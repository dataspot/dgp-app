from auth.models import get_user, get_users, delete_user

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

        auth_users = get_users()
        auth_users = dict(
            (x['id'], x) for x in auth_users
        )
        etl_users = self.models.query()

        for user in etl_users['result']:
            user['self'] = user['key'] == userid
            for auth_user in auth_users.keys():
                if auth_user == user['key']:
                    user['value'].update(auth_users[auth_user])
                    auth_users.pop(auth_user, None)
                    break
        for auth_user in auth_users.values():
            etl_users['result'].append(dict(
                key=auth_user['id'], 
                value=auth_user
            ))

        return etl_users
