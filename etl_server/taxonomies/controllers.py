from dgp_oauth2.models import get_user, delete_user

from .models import Models


class Controllers():

    def __init__(self, connection_string):
        self.models = Models(connection_string=connection_string)

    def query(self):
        ret = self.models.query()
        ret['result'] = [x for x in ret['result'] if x['key'] != '_common_']
        return ret