class Filter:
    def __init__(self, dataset, query):
        self.dataset = dataset
        self.query = query

    def column(self):
        if self.dataset.is_date:
            return "date"
        elif self.dataset.is_float:
            return "float"
        elif self.dataset.is_number:
            return "int"
        else:
            return "data"

    def run(self, name, comparator, value):
        exclude = comparator.startswith("not_")
        kwargs = {
            "{0}__data_type__name".format(self.dataset.table): name,
            "{0}__{1}__{2}".format(
                self.dataset.table, self.column(), comparator.removeprefix("not_")
            ): value,
        }
        return self.query.exclude(**kwargs) if exclude else self.query.filter(**kwargs)
