def user_can_manage_source(user, source):
    return source.organisation.members.filter(user=user).exists()
