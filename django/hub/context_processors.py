from django.conf import settings


def analytics(request):
    return {
        "GOOGLE_ANALYTICS": settings.GOOGLE_ANALYTICS,
        "GOOGLE_SITE_VERIFICATION": settings.GOOGLE_SITE_VERIFICATION,
    }
