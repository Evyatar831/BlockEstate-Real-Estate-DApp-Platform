from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('users/', views.user_list, name='user-list'),
    path('users/<int:pk>/', views.user_detail, name='user-detail'),
    path('user/', views.user_info, name='user-info'),
    path('user/update/', views.user_update, name='user-update'),
    path('user/change-password/', views.change_password, name='change-password'),
    path('user/dashboard/', views.user_dashboard, name='user-dashboard'),
    path('forgot-password/', views.forgot_password, name='forgot-password'), 
    path('verify-reset-code/', views.verify_reset_code, name='verify-reset-code'),
    path('reset-password/', views.reset_password, name='reset-password'),
    

]