# Generated by Django 4.2.11 on 2024-07-22 08:42

from django.db import migrations


class Migration(migrations.Migration):
    """
    Remove references to '2024' boundaries, as the official postcodes.io uses
    '2025'.
    """

    dependencies = [
        ("hub", "0136_merge_20240624_1037"),
    ]

    operations = [
        migrations.RunSQL(
            """
            UPDATE hub_externaldatasource
              SET update_mapping = REPLACE(
                update_mapping::text,
                'parliamentary_constituency_2025',
                'parliamentary_constituency_2024'
              )::jsonb;
            """
        ),
        migrations.RunSQL(
            """
            UPDATE hub_genericdata
              SET postcode_data = REPLACE(
                postcode_data::text,
                'parliamentary_constituency_2025',
                'parliamentary_constituency_2024'
              )::jsonb;
            """
        ),
        migrations.RunSQL(
            """
            UPDATE hub_mapreport
              SET display_options = REPLACE(
                display_options::text,
                'parliamentary_constituency_2025',
                'parliamentary_constituency_2024'
              )::jsonb;
            """
        ),
    ]