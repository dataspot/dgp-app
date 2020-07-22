from auth.models import get_user, delete_user

from .models import Models


class Controllers():

    def __init__(self, connection_string):
        self.models = Models(connection_string=connection_string)

