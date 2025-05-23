"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from app.views import RoomCreateAPI, RoomJoinAPI, MessageCreateAPI, MessageListAPI, UserRegistrationAPI

urlpatterns = [
    path('api/register/', UserRegistrationAPI.as_view(), name='user-register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('api/rooms/', RoomCreateAPI.as_view(), name='room-create'),
    path('api/rooms/<int:pk>/join/', RoomJoinAPI.as_view(), name='room-join'),
    
    path('api/messages/', MessageCreateAPI.as_view(), name='message-create'),
    path('api/messages/<int:room_id>/', MessageListAPI.as_view(), name='message-list'),
]
