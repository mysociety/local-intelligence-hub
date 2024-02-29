from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create groups required for site admin"

    GROUPS = [
        {
            "name": "Admin",
            "is_staff": True,
            "permissions": [
                "auth.add_user",
                "auth.change_user",
                "auth.delete_user",
                "auth.view_user",
            ],
        },
        {"name": "User Manger", "is_staff": False, "permissions": []},
        {"name": "Data Uploader", "is_staff": False, "permissions": []},
    ]

    def handle(self, *args, **options):
        for group in self.GROUPS:
            g, _ = Group.objects.update_or_create(name=group["name"])

            permissions = []
            for permission in group["permissions"]:
                app, name = permission.split(".")
                ct = ContentType.objects.get(app_label=app, model="user")
                p = Permission.objects.get(content_type=ct, codename=name)
                permissions.append(p)

            g.permissions.set(permissions)
