import sys

from django.apps import AppConfig


class AppConfig(AppConfig):
    name = 'app'

    def ready(self):
        if any(arg in sys.argv for arg in ['migrate', 'makemigrations', 'collectstatic', 'check', 'test']):
            return
        try:
            from rest_framework.authtoken.models import Token

            Token.objects.all().delete()
        except Exception:
            pass
