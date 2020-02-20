from auth.models import get_user

from .models import Models


class Controllers():

    def __init__(self, connection_string):
        self.models = Models(connection_string=connection_string)

    def create_or_edit_user(self, id, body):
        ret = self.models.create_or_edit(id, body)
        return ret

    def delete_user(self, id):
        ret = self.models.delete(id)
        return ret

    def query_users(self, userid):
        user = get_user(userid)
        if user is None:
            return {}

        email = user.get('email')
        if email is None:
            return {}

        ret = self.models.query()

        for user in ret['results']:
            user['self'] = user['key'] == email

        return ret
