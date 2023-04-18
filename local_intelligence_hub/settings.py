"""
Django settings for local_intelligence_hub project.

Generated by 'django-admin startproject' using Django 4.1.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.1/ref/settings/
"""

import socket
from pathlib import Path

import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, []),
    HIDE_DEBUG_TOOLBAR=(bool, False),
    GOOGLE_ANALYTICS=(str, ""),
    GOOGLE_SITE_VERIFICATION=(str, ""),
)
environ.Env.read_env(BASE_DIR / ".env")

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.1/howto/deployment/checklist/

SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")
CACHE_FILE = env("CACHE_FILE")
HIDE_DEBUG_TOOLBAR = env("HIDE_DEBUG_TOOLBAR")
MAPIT_URL = env("MAPIT_URL")
MAPIT_API_KEY = env("MAPIT_API_KEY")
GOOGLE_ANALYTICS = env("GOOGLE_ANALYTICS")
GOOGLE_SITE_VERIFICATION = env("GOOGLE_SITE_VERIFICATION")

# make sure CSRF checking still works behind load balancers
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if env.str("BUGS_EMAIL", None):  # pragma: no cover
    SERVER_EMAIL = env("BUGS_EMAIL")
    ADMINS = (("mySociety bugs", env("BUGS_EMAIL")),)

NON_LOGIN_URLS = (
    "/status/",
    "/accounts/login/",
    "/accounts/logout/",
    "/accounts/password_reset/",
    "/signup/",
    "/confirmation_sent/",
    "/bad_token/",
    "/activate/",
    "/privacy/",
    "/about/",
    "/contact/",
    "/",
)

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.humanize",
    "compressor",
    "django_bootstrap5",
    "sslserver",
    "django_jsonform",
    "hub",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "hub.middleware.AuthPageProtectionMiddleware",
    "hub.middleware.RecordLastSeenMiddleware",
]

ROOT_URLCONF = "local_intelligence_hub.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.template.context_processors.media",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "hub.context_processors.analytics",
            ],
        },
    },
]

WSGI_APPLICATION = "local_intelligence_hub.wsgi.application"


# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases

DATABASES = {"default": env.db()}


# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

AUTHENTICATION_BACKENDS = ["django.contrib.auth.backends.AllowAllUsersModelBackend"]


# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


MEDIA_ROOT = BASE_DIR / ".media"
MEDIA_URL = "/media/"

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

STATIC_URL = "static/"

STATIC_ROOT = BASE_DIR / ".static"

STATICFILES_FINDERS = (
    "django.contrib.staticfiles.finders.FileSystemFinder",
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
    "compressor.finders.CompressorFinder",
)

STATICFILES_DIRS = [
    BASE_DIR / "hub" / "static",
    ("bootstrap", BASE_DIR / "vendor" / "bootstrap" / "scss"),
    ("bootstrap", BASE_DIR / "vendor" / "bootstrap" / "js"),
    ("chartjs", BASE_DIR / "vendor" / "chartjs" / "js"),
    ("jquery", BASE_DIR / "vendor" / "jquery" / "js"),
    ("leaflet", BASE_DIR / "vendor" / "leaflet" / "js"),
    ("papaparse", BASE_DIR / "vendor" / "papaparse" / "js"),
    ("popper", BASE_DIR / "vendor" / "popper" / "js"),
    ("vue", BASE_DIR / "vendor" / "vue" / "js"),
]

# only want to do this for live really
if not DEBUG:  # pragma: no cover
    STATICFILES_STORAGE = (
        "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"
    )

COMPRESS_PRECOMPILERS = (("text/x-scss", "django_libsass.SassCompiler"),)
COMPRESS_CSS_HASHING_METHOD = "content"


# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# django-bootstrap5 settings
# https://django-bootstrap5.readthedocs.io/en/latest/settings.html
BOOTSTRAP5 = {
    "set_placeholder": False,
    "server_side_validation": True,
    "field_renderers": {
        "default": "hub.renderers.CustomFieldRenderer",
    },
}

# Sending messages
EMAIL_HOST = env.str("EMAIL_HOST", "localhost")
EMAIL_PORT = env.str("EMAIL_PORT", 1025)

if DEBUG and HIDE_DEBUG_TOOLBAR is False:  # pragma: no cover
    hostname, _, ips = socket.gethostbyname_ex(socket.gethostname())
    INTERNAL_IPS = [ip[:-1] + "1" for ip in ips] + ["127.0.0.1", "10.0.2.2"]
    CSRF_TRUSTED_ORIGINS = ["https://*.preview.app.github.dev"]

    # debug toolbar has to come after django_hosts middleware
    MIDDLEWARE.insert(1, "debug_toolbar.middleware.DebugToolbarMiddleware")

    INSTALLED_APPS += ("debug_toolbar",)

    DEBUG_TOOLBAR_PANELS = [
        "debug_toolbar.panels.versions.VersionsPanel",
        "debug_toolbar.panels.timer.TimerPanel",
        "debug_toolbar.panels.settings.SettingsPanel",
        "debug_toolbar.panels.headers.HeadersPanel",
        "debug_toolbar.panels.request.RequestPanel",
        "debug_toolbar.panels.sql.SQLPanel",
        "debug_toolbar.panels.staticfiles.StaticFilesPanel",
        "debug_toolbar.panels.templates.TemplatesPanel",
        "debug_toolbar.panels.cache.CachePanel",
        "debug_toolbar.panels.signals.SignalsPanel",
        "debug_toolbar.panels.logging.LoggingPanel",
        "debug_toolbar.panels.redirects.RedirectsPanel",
    ]
