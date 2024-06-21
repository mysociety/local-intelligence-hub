from django.db.models import Transform, DateTimeField, BooleanField

@DateTimeField.register_lookup
class IsPast(Transform):
    lookup_name = "ispast"

    def as_sql(self, compiler, connection):
        lhs, params = compiler.compile(self.lhs)
        field_name = self.lhs.output_field.name
        return f"({lhs} IS NOT NULL AND {lhs} < CURRENT_TIMESTAMP) as {field_name}__{self.lookup_name}", params

    @property
    def output_field(self):
        return BooleanField()


@DateTimeField.register_lookup
class IsFuture(Transform):
    lookup_name = "isfuture"

    def as_sql(self, compiler, connection):
        lhs, params = compiler.compile(self.lhs)
        field_name = self.lhs.output_field.name
        return f"({lhs} IS NOT NULL AND {lhs} >= CURRENT_TIMESTAMP) as {field_name}__{self.lookup_name}", params
    
    @property
    def output_field(self):
        return BooleanField()