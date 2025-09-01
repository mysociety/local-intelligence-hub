from collections import defaultdict


def add_site_to_classes(site, classes: list = []):
    counts = defaultdict(int)

    for c in classes:
        for o in c.objects.all():
            counts[c.__name__] += 1
            o.sites.add(site)

    return counts
