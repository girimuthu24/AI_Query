import time
import uuid
import pandas as pd
from io import BytesIO

from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import CustomUser, UploadSession, QueryHistory, ActivityLog, SystemSettings
from .serializers import (
    RegisterSerializer, LoginSerializer, UserProfileSerializer,
    UploadSessionSerializer, UploadFileInputSerializer,
    QueryHistorySerializer,
)
from .services.ai_service import query_ai

# In-memory store: { session_id: { 'df': DataFrame, 'summary': str } }
_SESSION_STORE: dict = {}


def _get_ip(request) -> str:
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR', '0.0.0.0')


def _log(user, action: str, request, description: str = ''):
    custom_user = _get_custom_user(user)
    if custom_user is None:
        return
    ActivityLog.objects.create(
        user=custom_user, action=action,
        description=description or action,
        ip_address=_get_ip(request),
    )


def _get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


def _parse_file(file) -> tuple[pd.DataFrame, str]:
    """Parse uploaded file in-memory; raise ValueError for unsupported types or malformed files."""
    name = file.name.lower()
    try:
        raw  = file.read()
        if name.endswith('.csv'):
            df = pd.read_csv(BytesIO(raw))
        elif name.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(BytesIO(raw))
        else:
            raise ValueError('Unsupported file type. Upload CSV or Excel.')
    except ValueError as e:
        raise e
    except Exception as e:
        raise ValueError(f'Invalid file format or corrupted file: {str(e)}')

    if df.empty:
        raise ValueError('The uploaded file contains no data.')

    summary = '\n\n'.join([
        f'Columns: {list(df.columns)}',
        f'Shape: {df.shape[0]} rows x {df.shape[1]} columns',
        f'Sample:\n{df.head(5).to_string(index=False)}',
    ])
    return df, summary


def _get_custom_user(user) -> CustomUser:
    """Get or create the CustomUser matching the authenticated User."""
    if user is None or getattr(user, 'is_anonymous', False):
        return None
    if isinstance(user, CustomUser):
        return user
    custom_user, _ = CustomUser.objects.get_or_create(
        email=user.email,
        defaults={
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': 'USER',
        }
    )
    return custom_user



# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)
        user = s.save()
        _log(user, 'REGISTER', request, f'New account: {user.email}')
        return Response(UserProfileSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = LoginSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)
        user = s.validated_data['user']
        _log(user, 'LOGIN', request)
        return Response({
            'tokens': _get_tokens(user),
            'user':   UserProfileSerializer(user).data,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Refresh token required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            pass
        _log(request.user, 'LOGOUT', request)
        return Response({'detail': 'Logged out.'})


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserProfileSerializer(_get_custom_user(request.user)).data)


# ─── Upload ───────────────────────────────────────────────────────────────────

class UploadFileView(APIView):
    """
    POST /api/upload/file/
    Parses file in-memory with Pandas, stores DataFrame in _SESSION_STORE,
    saves only metadata to UploadSession — never persists file content.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = UploadFileInputSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)

        file      = s.validated_data['file']
        file_type = s.validated_data['file_type']

        settings_obj = SystemSettings.get()
        max_bytes    = settings_obj.max_upload_size_mb * 1024 * 1024
        if file.size > max_bytes:
            return Response(
                {'detail': f'File exceeds {settings_obj.max_upload_size_mb} MB limit.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            df, summary = _parse_file(file)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        session_key = uuid.uuid4().hex
        _SESSION_STORE[session_key] = {'df': df, 'summary': summary}

        expires_at = timezone.now() + timezone.timedelta(minutes=settings_obj.session_timeout_minutes)
        upload_session = UploadSession.objects.create(
            user          = _get_custom_user(request.user),
            session_id    = session_key,
            filename      = file.name,
            file_type     = file_type,
            rows_count    = df.shape[0],
            columns_count = df.shape[1],
            expires_at    = expires_at,
        )
        _log(request.user, 'UPLOAD_FILE', request, f'Uploaded {file.name}')
        return Response(UploadSessionSerializer(upload_session).data, status=status.HTTP_201_CREATED)


class UploadPreviewView(APIView):
    """
    GET /api/upload/preview/?session_id=<key>
    Returns in-memory DataFrame preview — owner only.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        session_key = request.query_params.get('session_id')
        if not session_key:
            return Response({'detail': 'session_id required.'}, status=status.HTTP_400_BAD_REQUEST)

        upload = UploadSession.objects.filter(
            session_id=session_key, user=_get_custom_user(request.user)
        ).first()
        if not upload:
            return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        if upload.expires_at < timezone.now():
            return Response({'detail': 'Session expired.'}, status=status.HTTP_410_GONE)

        store = _SESSION_STORE.get(session_key)
        if not store:
            return Response({'detail': 'Data no longer in memory.'}, status=status.HTTP_410_GONE)

        df = store['df']
        return Response({
            'filename': upload.filename,
            'rows':     upload.rows_count,
            'columns':  upload.columns_count,
            'preview':  df.head(10).to_dict(orient='records'),
        })


class UploadClearView(APIView):
    """
    DELETE /api/upload/clear/?session_id=<key>
    Removes metadata from DB and data from in-memory store — owner only.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        session_key = request.query_params.get('session_id')
        if not session_key:
            return Response({'detail': 'session_id required.'}, status=status.HTTP_400_BAD_REQUEST)

        upload = UploadSession.objects.filter(
            session_id=session_key, user=_get_custom_user(request.user)
        ).first()
        if not upload:
            return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        _SESSION_STORE.pop(session_key, None)
        upload.delete()
        _log(request.user, 'DELETE_SESSION', request, f'Cleared session {session_key}')
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Query ────────────────────────────────────────────────────────────────────

class QueryView(APIView):
    """
    POST /api/upload/query/
    Runs AI query against in-memory DataFrame; records to QueryHistory.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session_key = request.data.get('session_id')
        prompt      = request.data.get('prompt', '').strip()
        query_type  = request.data.get('query_type', 'SEARCH')

        if not session_key or not prompt:
            return Response({'detail': 'session_id and prompt are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if query_type not in ('SEARCH', 'IDENTIFY'):
            return Response({'detail': 'query_type must be SEARCH or IDENTIFY.'}, status=status.HTTP_400_BAD_REQUEST)

        upload = UploadSession.objects.filter(session_id=session_key, user=_get_custom_user(request.user)).first()
        if not upload:
            return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        if upload.expires_at < timezone.now():
            return Response({'detail': 'Session expired.'}, status=status.HTTP_410_GONE)

        store = _SESSION_STORE.get(session_key)
        if not store:
            return Response({'detail': 'Data no longer in memory.'}, status=status.HTTP_410_GONE)

        settings_obj = SystemSettings.get()
        if not settings_obj.enable_query_history:
            return Response({'detail': 'Queries are disabled by system settings.'}, status=status.HTTP_403_FORBIDDEN)

        t0 = time.monotonic()
        try:
            ai_response = query_ai(store['summary'], prompt)
        except Exception:
            return Response({'detail': 'AI service error.'}, status=status.HTTP_502_BAD_GATEWAY)
        execution_ms = int((time.monotonic() - t0) * 1000)

        qh = QueryHistory.objects.create(
            user              = _get_custom_user(request.user),
            session_id        = session_key,
            prompt            = prompt,
            query_type        = query_type,
            execution_time_ms = execution_ms,
        )
        action = 'PERSON_IDENTIFICATION' if query_type == 'IDENTIFY' else 'QUERY_SEARCH'
        _log(request.user, action, request, prompt[:100])

        return Response({
            'query':          QueryHistorySerializer(qh).data,
            'response':       ai_response,
        })
