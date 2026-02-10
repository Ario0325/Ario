from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('login/', views.LoginRegisterView.as_view(), name='login_register'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('forget-password/', views.ForgetPasswordView.as_view(), name='forget_password'),
    path('forget-password/done/', views.ForgetPasswordDoneView.as_view(), name='password_reset_done'),
    path(
        'reset/<uidb64>/<token>/',
        views.ForgetPasswordConfirmView.as_view(),
        name='password_reset_confirm',
    ),
    path('reset/done/', views.ForgetPasswordCompleteView.as_view(), name='password_reset_complete'),
]
