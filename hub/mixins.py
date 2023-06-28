from collections import defaultdict
from functools import cache

from hub.models import Area, AreaData, AreaType, DataSet, DataType, Person, PersonData


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
        is_non_member = self.request.user.is_anonymous

        filters = []
        area_type = self.area_type()
        for param, value in self.request.GET.items():
            # we don't filter on blank values so skip them
            if value == "":
                continue

            if "__" in param and param not in ["shader", "columns"]:
                name, comparator = param.split("__", 1)
            else:  # pragma: nocover
                continue

            if "_in" in param:
                value = value.split(",")

            try:
                dataset = DataSet.objects.get(name=name, areas_available=area_type)
                if is_non_member and not dataset.is_public:
                    continue
                filters.append(
                    {
                        "dataset": dataset,
                        "name": dataset.name,
                        "label": dataset.label,
                        "comparator": comparator,
                        "value": value,
                        "value_col": dataset.value_col,
                    }
                )
            except DataSet.DoesNotExist:  # pragma: nocover
                try:
                    datatype = DataType.objects.get(name=name, area_type=area_type)
                    filters.append(
                        {
                            "dataset": datatype.data_set,
                            "name": datatype.name,
                            "label": datatype.label,
                            "comparator": comparator,
                            "value": value,
                            "value_col": datatype.value_col,
                        }
                    )
                except DataType.DoesNotExist:  # pragma: nocover
                    pass
        return filters

    @cache
    def columns(self, mp_name=False):
        is_non_member = self.request.user.is_anonymous

        columns = []
        col_names = self.request.GET.get("columns", "").split(",")

        if mp_name:
            col_names.append("mp_name")

        col_label_map = {"mp_name": "MP Name", "gss": "GSS"}

        area_type = self.area_type()

        for col in col_names:
            if col in ["mp_name", "gss"]:
                columns.append({"name": col, "label": col_label_map[col]})
                continue

            try:
                dataset = DataSet.objects.get(name=col, areas_available=area_type)
                if is_non_member and not dataset.is_public:
                    continue
                columns.append(
                    {
                        "dataset": dataset,
                        "name": dataset.name,
                        "value_col": dataset.value_col,
                        "label": dataset.label,
                        "header_label": dataset.label,
                    }
                )
            except DataSet.DoesNotExist:
                try:
                    datatype = DataType.objects.get(name=col, area_type=area_type)
                    columns.append(
                        {
                            "dataset": datatype.data_set,
                            "name": datatype.name,
                            "value_col": datatype.value_col,
                            "label": datatype.label,
                            "header_label": f"{datatype.data_set.label} - {datatype.label}",
                        }
                    )
                except DataType.DoesNotExist:
                    pass

        return columns

    @cache
    def area_type(self):
        code = self.request.GET.get("area_type", "WMC")
        try:
            area_type = AreaType.objects.get(code=code)
        except AreaType.DoesNotExist:
            return None

        return area_type

    def query(self):
        query = Area.objects
        area_type = self.area_type()
        if area_type is not None:
            query = query.filter(area_type=area_type)

        for f in self.filters():
            query = f["dataset"].filter(
                query,
                name=f["name"],
                comparator=f["comparator"],
                value=f["value"],
            )

        query = query.distinct("pk")
        return query

    def format_value(self, type, value):
        if type == "percent":
            return f"{round(value, 1)}%"
        elif type == "float":
            return round(value, 1)

        return value

    def data(self, as_dict=False, mp_name=False):
        headers = ["Constituency Name"]
        headers += map(lambda f: f["dataset"].label, self.filters())
        headers += map(
            lambda f: f.get("header_label", f["label"]), self.columns(mp_name=mp_name)
        )

        data = [headers]

        area_data = defaultdict(lambda: defaultdict(list))

        """
        it is not really possible in django to do multiple joins to a table
        so it's easiest to construct this by doing one query per column we want
        to add, limited by the set of areas we've already filtered down to
        """
        area_ids = self.query().values_list("pk", flat=True)
        cols = self.filters().copy()
        cols.extend(self.columns(mp_name=mp_name))

        """
        shortcut if no filters/columns were requested: just return a single
        column of constituency names
        """
        if not cols:
            areas = Area.objects
            area_type = self.area_type()
            if area_type is not None:
                areas = areas.filter(area_type=area_type)
            for area in areas.order_by("name"):
                data.append([area.name])
            return data

        """
        first for each column we want gather the data and store it against the
        area
        """
        for col in cols:
            if col["name"] == "mp_name":
                for row in Person.objects.filter(
                    person_type="MP", area_id__in=area_ids
                ).select_related("area"):
                    area_data[row.area.name]["MP Name"].append(row.name)

                continue
            elif col["name"] == "gss":
                for row in self.query():
                    area_data[row.name]["GSS"].append(row.gss)
                continue

            dataset = col["dataset"]
            if dataset.table == "areadata":
                for row in (
                    AreaData.objects.filter(
                        area_id__in=area_ids, data_type__name=col["name"]
                    )
                    .order_by(col["value_col"])
                    .select_related("area", "data_type")
                ):
                    value = row.value()
                    if as_dict:
                        value = self.format_value(row.data_type.data_type, row.value())
                    area_data[row.area.name][col["label"]].append(str(value))
            else:
                for row in (
                    PersonData.objects.filter(
                        person__area_id__in=area_ids, data_type__name=col["name"]
                    )
                    .order_by(col["value_col"])
                    .select_related("person__area", "data_type")
                ):
                    value = row.value()
                    if as_dict:
                        value = self.format_value(row.data_type.data_type, row.value())
                    area_data[row.person.area.name][col["label"]].append(str(value))

        if as_dict:
            for area in Area.objects.filter(id__in=area_ids):
                area_data[area.name]["area"] = area
            return area_data

        """
        and then go through the data for each area and reconstitute it into an array
        """
        for area, values in area_data.items():
            row = [area]
            for col in cols:
                row.append("; ".join(values[col["label"]]))
            data.append(row)

        return data

    def shader(self):
        name = self.request.GET.get("shader")
        try:
            return DataSet.objects.get(name=name, areas_available=self.area_type())
        except DataSet.DoesNotExist:
            try:
                return DataType.objects.get(name=name)
            except DataType.DoesNotExist:
                return None
