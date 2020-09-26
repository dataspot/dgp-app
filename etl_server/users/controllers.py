from dgp_oauth2.models import get_user, delete_user

from .models import Models


class Controllers():

    def __init__(self, connection_string):
        self.models = Models(connection_string=connection_string)

    def create_or_edit_user(self, id, body):
        ret = self.models.create_or_edit(id, body)
        return ret

    def delete_user(self, id):
        ret = self.models.delete(id)
        auth_delete = delete_user(id)
        ret['success'] = ret['success'] or auth_delete
        return ret

    def query_users(self, userid):
        user = get_user(userid)
        if user is None:
            return {}

        userid = user.get('id')
        if userid is None:
            return {}

        all_users = self.models.all_users()

        for user in all_users['result']:
            user['self'] = user['key'] == userid

        return all_users
