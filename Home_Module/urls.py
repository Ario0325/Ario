from django.urls import path
from .views import index, offline


urlpatterns = [
    path('', index, name='index'),
    path('offline/', offline, name='offline'),
]
