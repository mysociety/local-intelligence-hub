import psycopg
from django.db import connection
from django.db.models.query import QuerySet

async def async_query(queryset: QuerySet):
    # Find and quote a database table name for a Model with users.
    # table_name = connection.ops.quote_name(GenericData._meta.db_table)
    # Create a new async connection.
    aconnection = await psycopg.AsyncConnection.connect(
        **{
            **connection.get_connection_params(),
            "cursor_factory": psycopg.AsyncCursor,
        },
    )
    async with aconnection:
        # Create a new async cursor and execute a query.
        async with aconnection.cursor() as cursor:
            await cursor.execute(
                str(queryset.query)
            )
            results = await cursor.fetchall()
            return [queryset.model(*result) for result in results]