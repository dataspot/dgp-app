from slugify import slugify

from .models import Models


class Controllers():

    def __init__(self, connection_string):
        self.models = Models(connection_string=connection_string)

    def _key(self, kind, id):
        return '{}::{}'.format(kind, id)

    def create_or_edit(self, kind, id, value, user, admin):
        id = slugify(id)
        key = self._key(kind, id)
        value['id'] = id
        if admin:
            edit_allowed = None
        else:
            edit_allowed = lambda x: x.created_by == user
        return self.models.create_or_edit(key, value,
            create_kw=dict(created_by=user),
            update_kw=dict(updated_by=user),
            edit_allowed=edit_allowed)

    def query_one(self, kind, id, admin=False, user=None):
        ret = self.models.query_one(self._key(kind, id))
        if ret['success']:
            if admin:
                return ret
            else:
                if user == ret['result']['created_by']:
                    return ret
        return dict(success=False)

    def query(self, kind, admin=False, user=None):
        ret = self.models.query()
        ret['result'] = [
            x
            for x in ret['result']
            if x['key'].startswith(kind + '::')
        ]
        if not admin:
            ret['result'] = [
                x for x in ret['result']
                if x['created_by'] == user
            ]
        return ret

    def delete(self, kind, id, admin=False, user=None):
        if admin:
            return self.models.delete(self._key(kind, id))
        else:
            return self.models.delete(self._key(kind, id), delete_allowed=lambda x: x.created_by == user)

