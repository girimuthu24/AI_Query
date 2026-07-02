from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('login/',                views.SuperAdminLoginView.as_view(),        name='sa-login'),
    path('logout/',               views.SuperAdminLogoutView.as_view(),       name='sa-logout'),
    path('refresh-token/',        views.SuperAdminRefreshTokenView.as_view(), name='sa-refresh'),

    # Admin management
    path('create-admin/',         views.CreateAdminView.as_view(),            name='sa-create-admin'),
    path('view-admins/',          views.ViewAdminsView.as_view(),             name='sa-view-admins'),
    path('update-admin/<int:user_id>/', views.UpdateAdminView.as_view(),      name='sa-update-admin'),
    path('delete-admin/<int:user_id>/', views.DeleteAdminView.as_view(),      name='sa-delete-admin'),
    path('block-admin/<int:user_id>/',  views.BlockAdminView.as_view(),       name='sa-block-admin'),
    path('reset-admin-password/', views.ResetAdminPasswordView.as_view(),     name='sa-reset-admin-pw'),

    # User management
    path('create-user/',          views.CreateUserView.as_view(),             name='sa-create-user'),
    path('view-users/',           views.ViewUsersView.as_view(),              name='sa-view-users'),
    path('update-user/<int:user_id>/', views.UpdateUserView.as_view(),        name='sa-update-user'),
    path('delete-user/<int:user_id>/', views.DeleteUserView.as_view(),        name='sa-delete-user'),
    path('block-user/<int:user_id>/',  views.BlockUserView.as_view(),         name='sa-block-user'),
    path('reset-user-password/',  views.ResetUserPasswordView.as_view(),      name='sa-reset-user-pw'),

    # Role management
    path('assign-role/',          views.AssignRoleView.as_view(),             name='sa-assign-role'),
    path('change-role/',          views.ChangeRoleView.as_view(),             name='sa-change-role'),
    path('remove-role/<int:user_id>/', views.RemoveRoleView.as_view(),        name='sa-remove-role'),

    # Permission management
    path('grant-permission/',     views.GrantPermissionView.as_view(),        name='sa-grant-perm'),
    path('remove-permission/',    views.RemovePermissionView.as_view(),       name='sa-remove-perm'),

    # Logs
    path('system-logs/',          views.SystemLogsView.as_view(),             name='sa-system-logs'),

    # Force password change (first-run)
    path('force-change-password/', views.ForceChangePasswordView.as_view(),    name='sa-force-change-pw'),
]
