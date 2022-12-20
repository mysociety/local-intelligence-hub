from django.contrib import admin

from crowdsourcer.models import (
    Assigned,
    Option,
    PublicAuthority,
    Question,
    QuestionGroup,
    Response,
    ResponseType,
    Section,
)


@admin.register(Assigned)
class AssignedAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "section",
        "authority",
        "question",
    )


@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    list_display = ("question", "description", "score")


@admin.register(PublicAuthority)
class PublicAuthorityAdmin(admin.ModelAdmin):
    list_display = ("name", "questiongroup")
    list_filter = ["questiongroup"]
    ordering = ["name"]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = (
        "section",
        "number",
        "number_part",
        "description",
    )
    list_filter = ["section"]
    ordering = ("section", "number", "number_part")


@admin.register(QuestionGroup)
class QuestionGroupAdmin(admin.ModelAdmin):
    pass


@admin.register(Response)
class ResponseAdmin(admin.ModelAdmin):
    list_display = (
        "authority",
        "question",
        "option",
    )


@admin.register(ResponseType)
class ResponseTypeAdmin(admin.ModelAdmin):
    pass


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    pass
