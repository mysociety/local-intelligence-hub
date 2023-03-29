from collections import defaultdict
from functools import cache

from hub.models import Area, AreaData, DataSet, DataType, PersonData


class TitleMixin:
    site_title = "Local Intelligence Hub"

    def get_page_title(self):
        if self.page_title:
            return f"{self.page_title} | {self.site_title}"
        else:
            return f"{self.site_title}"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["page_title"] = self.get_page_title()
        return context


class FilterMixin:
    @cache
    def filters(self):
        filters = []
        for param, value in self.request.GET.items():
            if "__" in param and param not in ["shader", "columns"]:
                name, comparator = param.split("__", 1)
            else:  # pragma: nocover
                continue

            if "_in" in param:
                value = value.split(",")

            try:
                dataset = DataSet.objects.get(name=name)
                filters.append(
                    {
                        "dataset": dataset,
                        "name": dataset.name,
                        "comparator": comparator,
                        "value": value,
                    }
                )
            except DataSet.DoesNotExist:  # pragma: nocover
                try:
                    datatype = DataType.objects.get(name=name)
                    filters.append(
                        {
                            "dataset": datatype.data_set,
                            "name": datatype.name,
                            "comparator": comparator,
                            "value": value,
                        }
                    )
                except DataType.DoesNotExist:  # pragma: nocover
                    pass
        return filters

    @cache
    def columns(self):
        columns = []
        col_names = self.request.GET.get("columns", "").split(",")

        for col in col_names:
            try:
                dataset = DataSet.objects.get(name=col)
                columns.append(
                    {
                        "dataset": dataset,
                        "name": dataset.name,
                    }
                )
            except DataSet.DoesNotExist:
                try:
                    datatype = DataType.objects.get(name=col)
                    columns.append(
                        {
                            "dataset": datatype.data_set,
                            "name": datatype.name,
                        }
                    )
                except DataType.DoesNotExist:
                    pass

        return columns

    def query(self):
        query = Area.objects
        for f in self.filters():
            query = f["dataset"].filter(
                query,
                name=f["name"],
                comparator=f["comparator"],
                value=f["value"],
            )

        query = query.distinct("pk")
        return query

    def data(self):
        headers = ["constituency_name"]
        headers += map(lambda f: f["dataset"].name, self.filters())
        headers += map(lambda f: f["name"], self.columns())

        data = [headers]

        area_data = defaultdict(lambda: defaultdict(list))

        """
        it is not really possible in django to do multiple joins to a table
        so it's easiest to construct this by doing one query per column we want
        to add, limited by the set of areas we've already filtered down to
        """
        area_ids = self.query().values_list("pk", flat=True)
        cols = self.filters()
        cols.extend(self.columns())

        """
        first for each column we want gather the data and store it against the
        area
        """
        for col in cols:
            dataset = col["dataset"]
            if dataset.table == "areadata":
                for row in AreaData.objects.filter(
                    area_id__in=area_ids, data_type__name=col["name"]
                ).select_related("area", "data_type"):
                    area_data[row.area.name][col["name"]].append(str(row.value()))
            else:
                for row in PersonData.objects.filter(
                    person__area_id__in=area_ids, data_type__name=col["name"]
                ).select_related("person__area", "data_type"):
                    area_data[row.person.area.name][col["name"]].append(
                        str(row.value())
                    )

        """
        and then go through the data for each area and reconstitute it into an array
        """
        for area, values in area_data.items():
            row = [area]
            for col in cols:
                row.append("; ".join(values[col["name"]]))
            data.append(row)

        return data

    def shader(self):
        name = self.request.GET.get("shader")
        try:
            return DataSet.objects.get(name=name)
        except DataSet.DoesNotExist:
            return None
