import re

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

            df = df.dropna(axis="index", how="all")

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
                q_no = row["question_no"]
                q_part = None
                if pd.isna(q_no):
                    continue

                if type(q_no) is not int:
                    q_parts = re.search(r"(\d+)([a-z]?)", q_no).groups()
                    q_no = q_parts[0]
                    if len(q_parts) == 2:
                        q_part = q_parts[1]

                q, c = Question.objects.update_or_create(
                    number=q_no,
                    number_part=q_part,
                    section=section,
                    defaults={
                        "description": row["question"],
                        "criteria": row["criteria"],
                    },
                )

                for col, group in q_groups.items():
                    if row[col] == "Yes":
                        q.questiongroup.add(group)
