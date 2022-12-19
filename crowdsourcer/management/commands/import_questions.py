from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd

from crowdsourcer.models import Question, QuestionGroup, Section


class Command(BaseCommand):
    help = "import questions"

    question_file = settings.BASE_DIR / "data" / "questions.xlsx"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet: bool = False, *args, **options):
        q_groups = {}
        for q in QuestionGroup.objects.all():
            key = q.description.lower().replace(" ", "_")
            q_groups[key] = q

        for section in Section.objects.all():
            df = pd.read_excel(
                self.question_file,
                sheet_name=section.title,
                header=3,
                usecols="B:L",
            )

            df.columns = [
                "question_no",
                "topic",
                "question",
                "criteria",
                "clarifications",
                "how_marked",
                "weighting",
                "district",
                "single_tier",
                "county",
                "northern_ireland",
            ]

            for index, row in df.iterrows():
                q, c = Question.objects.update_or_create(
                    description=row["question"],
                    section=section,
                    defaults={"criteria": row["criteria"]},
                )

                for col, group in q_groups.items():
                    if row[col] == "Yes":
                        q.questiongroup.add(group)
