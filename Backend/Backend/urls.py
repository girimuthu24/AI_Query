from django.urls import path
from Backend.views.auth_views import RegisterView, LoginView, CheckFieldView, HomePage
from Backend.views.admin_views import (
    AdminLogoutView, AdminRefreshTokenView,
    AdminCreateUserView, AdminViewUsersView, AdminUpdateUserView,
    AdminDeleteUserView, AdminBlockUserView, AdminResetUserPasswordView,
    AdminViewMyPermissionsView, AdminActivityLogsView,
)
from Backend.views.user_views import (
    UserLogoutView, UserProfileView, UserUpdateProfileView,
    UserChangePasswordView, UserActivityLogsView,
)
from Backend.views import api_root

urlpatterns = [
    # ── API Root (lists available endpoints) ─────────────────────────────────
    path('',              api_root,                name='api-root'),

    # ── Public Auth ───────────────────────────────────────────────────────────
    path('register/',     RegisterView.as_view(),  name='register'),
    path('login/',        LoginView.as_view(),      name='login'),
    path('check-field/',  CheckFieldView.as_view(), name='check-field'),
    path('home/',         HomePage,                 name='home'),

    # ── User endpoints ────────────────────────────────────────────────────────
    path('user/logout/',          UserLogoutView.as_view(),        name='user-logout'),
    path('user/profile/',         UserProfileView.as_view(),       name='user-profile'),
    path('user/update-profile/',  UserUpdateProfileView.as_view(), name='user-update-profile'),
    path('user/change-password/', UserChangePasswordView.as_view(),name='user-change-password'),
    path('user/activity-logs/',   UserActivityLogsView.as_view(),  name='user-activity-logs'),

    # ── Admin endpoints ───────────────────────────────────────────────────────
    path('admin/logout/',                  AdminLogoutView.as_view(),         name='admin-logout'),
    path('admin/refresh-token/',           AdminRefreshTokenView.as_view(),   name='admin-refresh'),
    path('admin/create-user/',             AdminCreateUserView.as_view(),     name='admin-create-user'),
    path('admin/view-users/',              AdminViewUsersView.as_view(),      name='admin-view-users'),
    path('admin/update-user/<int:user_id>/', AdminUpdateUserView.as_view(),   name='admin-update-user'),
    path('admin/delete-user/<int:user_id>/', AdminDeleteUserView.as_view(),   name='admin-delete-user'),
    path('admin/block-user/<int:user_id>/',  AdminBlockUserView.as_view(),    name='admin-block-user'),
    path('admin/reset-user-password/',     AdminResetUserPasswordView.as_view(), name='admin-reset-user-pw'),
    path('admin/my-permissions/',          AdminViewMyPermissionsView.as_view(), name='admin-my-permissions'),
    path('admin/activity-logs/',           AdminActivityLogsView.as_view(),   name='admin-activity-logs'),
]
