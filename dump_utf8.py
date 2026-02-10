import os
import django
from django.core.management import call_command

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Ario_Shop.settings")
django.setup()

with open("db.json", "w", encoding="utf-8") as f:
    call_command(
        "dumpdata",
        exclude=["auth.permission", "contenttypes"],
        indent=2,
        stdout=f,
    )
