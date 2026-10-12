import hashlib
import secrets

from .models import Models

PREFIX = 'dgp_'


def hash_key(api_key):
    return hashlib.sha256(api_key.encode('utf-8')).hexdigest()


class Controllers():

    def __init__(self, connection_string):
        self.models = Models(connection_string=connection_string)

    def create(self, userid, name):
        api_key = PREFIX + secrets.token_urlsafe(32)
        value = dict(id=secrets.token_hex(8), name=name, userid=userid, hint=api_key[:len(PREFIX) + 4])
        self.models.create_or_edit(hash_key(api_key), value)
        # The only time the key itself is returned
        return dict(success=True, result=dict(value, api_key=api_key))

    def _keys(self, userid=None):
        return [
            x for x in self.models.query()['result']
            if userid is None or x['value']['userid'] == userid
        ]

    def query(self, userid=None):
        return dict(success=True, result=[
            dict(x['value'],
                 created_at=x['created_at'].isoformat() if x.get('created_at') else None)
            for x in self._keys(userid)
        ])

    def delete(self, id, userid=None):
        for x in self._keys(userid):
            if x['value']['id'] == id:
                return self.models.delete(x['key'])
        return dict(success=False)

    def userid_for(self, api_key):
        if not api_key.startswith(PREFIX):
            return None
        ret = self.models.query_one(hash_key(api_key))
        if ret['success']:
            return ret['result']['value']['userid']
