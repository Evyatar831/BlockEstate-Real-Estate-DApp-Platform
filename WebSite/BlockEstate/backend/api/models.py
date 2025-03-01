from django.db import models
from django.contrib.auth.models import User
import hmac
import hashlib
import os


class PasswordHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    password_hash = models.CharField(max_length=255)
    salt = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    @staticmethod
    def hash_password(password, salt=None):
        if not salt:
            salt = os.urandom(32).hex()
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        ).hex()
        return key, salt

class LoginAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    successful = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField()




