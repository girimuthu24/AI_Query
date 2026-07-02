"""
urls.py

URL configuration for the data_query app.
Maps the file upload endpoint to the FileUploadAPIView.
"""

from django.urls import path
from .views import FileUploadAPIView

urlpatterns = [
    # POST /api/data-query/upload/
    path("upload/", FileUploadAPIView.as_view(), name="data-query-upload"),
]