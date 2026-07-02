from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/',             admin.site.urls),

    # Core Backend app  →  /api/register/, /api/login/, /api/user/*, /api/admin/*
    path('api/',               include('Backend.urls')),

    # AI engine app     →  /api/ai/users/*, /api/ai/upload/*, /api/ai/upload/query/
    path('api/ai/',            include('ai_engine.urls')),

    # Data Query app    →  /api/data-query/upload/
    path('api/data-query/',    include('Backend.data_query.urls')),

    # JWT token refresh →  /api/token/refresh/
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Super Admin panel →  /superadmin/*
    path('superadmin/',        include('superadmin_panel.urls')),
]
