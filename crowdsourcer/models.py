from django.contrib.auth.models import User
from django.db import models


class Section(models.Model):
    title = models.CharField(max_length=200)

    def __str__(self):
        return self.title


class QuestionGroup(models.Model):
    description = models.TextField(max_length=200)

    def __str__(self):
        return self.description


class PublicAuthority(models.Model):
    unique_id = models.CharField(max_length=100, unique=True)
    name = models.TextField(max_length=300)
    questiongroup = models.ForeignKey(QuestionGroup, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "authorities"


class Question(models.Model):
    number = models.IntegerField(blank=True, null=True)
    number_part = models.CharField(max_length=4, blank=True, null=True)
    description = models.TextField()
    criteria = models.TextField()
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    questiongroup = models.ManyToManyField(QuestionGroup)

    def __str__(self):
        return self.description


class Option(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    score = models.IntegerField()
    description = models.TextField(max_length=200)

    def __str__(self):
        return self.description


class ResponseType(models.Model):
    type = models.TextField(max_length=200)
    priority = models.IntegerField()

    def __str__(self):
        return self.type


class Response(models.Model):
    authority = models.ForeignKey(PublicAuthority, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    option = models.ForeignKey(Option, on_delete=models.CASCADE, null=True)
    response_type = models.ForeignKey(ResponseType, on_delete=models.CASCADE, null=True)
    public_notes = models.TextField()
    private_notes = models.TextField()
    revision_type = models.CharField(max_length=200, blank=True, null=True)
    revision_notes = models.TextField(blank=True, null=True)


class Assigned(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    section = models.ForeignKey(
        Section, on_delete=models.CASCADE, null=True, blank=True
    )
    authority = models.ForeignKey(
        PublicAuthority, on_delete=models.CASCADE, null=True, blank=True
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, null=True, blank=True
    )

    class Meta:
        verbose_name = "assignment"
        verbose_name_plural = "assignments"
