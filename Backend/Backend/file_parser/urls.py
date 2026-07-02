from django.urls import path

from .views import FileParseView

urlpatterns = [
    path('parse/', FileParseView.as_view(), name='file-parse'),
]