from django.db import models


class StaffRecord(models.Model):
    """Staff member records for organisational staff directory."""

    GENDER_CHOICES = [
        ('Male',   'Male'),
        ('Female', 'Female'),
        ('Other',  'Other'),
    ]

    staff_id   = models.CharField(max_length=20, unique=True)
    name       = models.CharField(max_length=100)
    gender     = models.CharField(max_length=10, choices=GENDER_CHOICES)
    age        = models.PositiveIntegerField()
    domain     = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.staff_id})"