import strawberry

def key_resolver(key: str):
    def resolver(self):
        return self.get(key, None)
    return strawberry.field(resolver=resolver)