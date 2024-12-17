from pathlib import Path
from typing import Any
from django.conf import settings
from dataclasses import dataclass, field
from psycopg import Column

# from django postgis
from django.core.management.base import BaseCommand
from django.db import connection


@dataclass
class TableConfig:
    table_name: str
    extra_select_columns: dict[str, str] = field(default_factory=dict)
    output_column_templates: dict[str, str] = field(default_factory=dict)


TABLES = [
    TableConfig(table_name="hub_areatype"),
    TableConfig(
        table_name="hub_area",
        extra_select_columns={
            "area_type_code": "(SELECT code FROM hub_areatype WHERE hub_areatype.id = hub_area.area_type_id)"
        },
        output_column_templates={
            "area_type_id": "(SELECT id FROM hub_areatype WHERE code = '{area_type_code}')"
        },
    ),
]


class Command(BaseCommand):
    help = """
    Export the area table from the database as an SQL file that can be imported into any environment
    without causing primary key conflicts.
    """

    def handle(self, *args, **options):
        print("Exporting areas and area types from current database to data/areas.psql")
        count = 0
        output_file: Path = settings.BASE_DIR / "data" / "areas.psql"
        with output_file.open("w", encoding="utf8") as f:
            for table_config in TABLES:
                rows, columns = self.do_query(table_config)
                for row in rows:
                    output_record = self.get_output_record(row, columns, table_config)
                    column_names = ",".join(output_record.keys())
                    output_values = ",".join(output_record.values())
                    f.write(
                        f"INSERT INTO {table_config.table_name} ({column_names}) VALUES ({output_values});\n"
                    )
                    count += 1
        print(f"Exported {count} rows to data/areas.psql")

    def do_query(
        self, table_config: TableConfig
    ) -> tuple[list[tuple[Any]], tuple[Column]]:
        with connection.cursor() as cursor:
            select = "*"
            for column_name, column_select in table_config.extra_select_columns.items():
                select += f", {column_select} as {column_name}"
            cursor.execute(
                f"SELECT {select} FROM {table_config.table_name} ORDER BY id ASC"
            )
            rows = cursor.fetchall()
            columns = cursor.description
            return (rows, columns)

    def escape_sql_string(self, value: Any) -> str:
        if value is None:
            return "NULL"
        # Replace single quote with two single quotes
        return str(value).replace("'", "''")

    def get_output_record(
        self, row: tuple[Any], columns: tuple[Column], table_config: TableConfig
    ) -> dict[str, str]:
        record = {}
        for i, column in enumerate(columns):
            # Don't output ID columns or extra select columns (these can't be imported)
            if column.name == "id" or column.name in table_config.extra_select_columns:
                continue

            if column.name in table_config.output_column_templates:
                template = table_config.output_column_templates[column.name]
                value = self.template_output_value(template, row, columns)
            else:
                # output the value as a string, cast to the correct type in postgres
                value = f"'{self.escape_sql_string(row[i])}'::{column.type_display}"

            record[column.name] = value
        return record

    def template_output_value(
        self, template: str, row: tuple[Any], columns: tuple[Column]
    ) -> str:
        value = template
        for i, column in enumerate(columns):
            value = value.replace("{" + column.name + "}", str(row[i]))
        return value
