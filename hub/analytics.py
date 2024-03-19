from django.db.models import Count, F
import pandas as pd
from typing import List, Optional, TypedDict

class Analytics:
    def __init__(self, qs) -> None:
        self.qs = qs

    def get_dataframe(self, qs):
        json_list = [{**d.postcode_data, **d.json} for d in self.qs]
        enrichment_df = pd.DataFrame.from_records(json_list)
        return enrichment_df

    class RegionCount(TypedDict):
        label: str
        area_id: Optional[str]
        count: int
    
    def imported_data_count_by_region(self) -> List[RegionCount]:
        return self.qs()\
          .annotate(
              label=F('postcode_data__european_electoral_region'),
              area_id=F('postcode_data__codes__european_electoral_region')
          )\
          .values('label', 'area_id')\
          .annotate(count=Count('label'))\
          .order_by('-count')\

    
    def imported_data_count_by_constituency(self) -> List[RegionCount]:
        return self.qs()\
          .annotate(
              label=F('postcode_data__parliamentary_constituency'),
              area_id=F('postcode_data__codes__parliamentary_constituency')
          )\
          .values('label', 'area_id')\
          .annotate(count=Count('label'))\
          .order_by('-count')\

    
    def imported_data_count_by_constituency_2024(self) -> List[RegionCount]:
        return self.qs()\
          .annotate(
              label=F('postcode_data__parliamentary_constituency_2025'),
              area_id=F('postcode_data__codes__parliamentary_constituency_2025')
          )\
          .values('label', 'area_id')\
          .annotate(count=Count('label'))\
          .order_by('-count')\

    
    def imported_data_count_by_council(self) -> List[RegionCount]:
        return self.qs()\
          .annotate(
              label=F('postcode_data__admin_district'),
              area_id=F('postcode_data__codes__admin_district')
          )\
          .values('label', 'area_id')\
          .annotate(count=Count('label'))\
          .order_by('-count')\

    
    def imported_data_count_by_ward(self) -> List[RegionCount]:
        return self.qs()\
          .annotate(
              label=F('postcode_data__admin_ward'),
              area_id=F('postcode_data__codes__admin_ward')
          )\
          .values('label', 'area_id')\
          .annotate(count=Count('label'))\
          .order_by('-count')\

    def imported_data_count(self) -> int:
        count = self.qs().all().count()
        if isinstance(count, int):
            return count
        return 0