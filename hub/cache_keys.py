def site_tile_filter_dict(hostname: str, external_data_source_id: str, *args, **kwargs):
    return f"site_tile_filter:{hostname}:{external_data_source_id}"
