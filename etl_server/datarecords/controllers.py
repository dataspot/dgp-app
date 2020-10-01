from slugify import slugify

from .models import Models


class Controllers():

    def __init__(self, connection_string):
        self.models = Models(connection_string=connection_string)

    def _key(self, kind, id):
        return '{}::{}'.format(kind, id)

    def create_or_edit(self, kind, id, value, user):
        id = slugify(id)
        key = self._key(kind, id)
        value['id'] = id
        return self.models.create_or_edit(key, value,
            create_kw=dict(created_by=user),
            update_kw=dict(updated_by=user))

    def query_one(self, kind, id):
        return self.models.query_one(self._key(kind, id))

    def query(self, kind):
        ret = self.models.query()
        ret['result'] = [
            x
            for x in ret['result']
            if x['key'].startswith(kind + '::')
        ]
        return ret

    def delete(self, kind, id):
        return self.models.delete(self._key(kind, id))
