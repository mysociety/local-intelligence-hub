from django.views.generic import ListView

from crowdsourcer.models import Assigned


class OverviewView(ListView):
    template_name = "crowdsourcer/assignments.html"
    model = Assigned
    context_object_name = "assignments"

    def get_queryset(self):
        if self.request.user.is_anonymous:
            return None

        qs = Assigned.objects.all()
        if self.request.user.is_superuser is False:
            qs = qs.filter(user=self.request.user)

        return qs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["show_users"] = self.request.user.is_superuser

        return context
