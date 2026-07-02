from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, LoginView, LogoutView, ProfileView,
    UploadFileView, UploadPreviewView, UploadClearView, QueryView,
)

urlpatterns = [
    # Auth
    path('users/register/',      RegisterView.as_view(),   name='register'),
    path('users/login/',         LoginView.as_view(),       name='login'),
    path('users/logout/',        LogoutView.as_view(),      name='logout'),
    path('users/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('users/profile/',       ProfileView.as_view(),     name='profile'),

    # Upload metadata (file never persisted)
    path('upload/file/',         UploadFileView.as_view(),    name='upload-file'),
    path('upload/preview/',      UploadPreviewView.as_view(), name='upload-preview'),
    path('upload/clear/',        UploadClearView.as_view(),   name='upload-clear'),

    # Query
    path('upload/query/',        QueryView.as_view(),         name='upload-query'),
]
