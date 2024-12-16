import json

# from django postgis
from django.core.management.base import BaseCommand
from pathlib import Path

from django.conf import settings
from django.db import connection

QUERIES = {
    "hub_areatype": "SELECT * FROM hub_areatype",
    # Get the hub_areatype.code column for matching areas to area types in the output SQL, as IDs will have changed
    "hub_area": "SELECT *,(SELECT code FROM hub_areatype WHERE hub_areatype.id = area_type_id) as area_type_code FROM hub_area",
}


class Command(BaseCommand):
    help = """
    Export the area table from the database as an SQL file that can be imported into any environment
    without causing primary key conflicts.
    """

    def escape_sql_string(self, value):
        if value is None:
            return "NULL"
        # Replace single quote with two single quotes
        return str(value).replace("'", "''")

    def handle(self, *args, **options):
        print("Exporting areas and area types from current database to data/areas.psql")
        count = 0
        output_file: Path = settings.BASE_DIR / "data" / "areas.psql"
        with output_file.open("w", encoding="utf8") as f:
            for table_name, table_query in QUERIES.items():
                with connection.cursor() as cursor:
                    cursor.execute(f"{table_query} ORDER BY id ASC")
                    rows = cursor.fetchall()
                    # The [1:] indices on cursor.description and row are to drop the ID column, which is first
                    columns = [description for description in cursor.description[1:]]
                    column_names = ",".join(
                        [
                            description.name
                            for description in cursor.description[1:]
                            if description.name != "area_type_code"  # Skip outputting derived column
                        ]
                    )

                    for row in rows:
                        output_row = []
                        for i, value in enumerate(row[1:]):
                            column = columns[i]
                            if column.name == "area_type_code":
                                continue  # Skip outputting derived column
                            if column.name == "area_type_id":
                                area_type_code = row[-1]
                                value = f"(SELECT id FROM hub_areatype WHERE code = '{area_type_code}')"
                            else:
                                # output the value as a string, cast to the correct type
                                value = f"'{self.escape_sql_string(value)}'::{column.type_display}"
                            output_row.append(value)
                        f.write(
                            f"INSERT INTO {table_name} ({column_names}) VALUES ({','.join(output_row)});\n"
                        )
                        count += 1
        print(f"Exported {count} rows to data/areas.psql")
