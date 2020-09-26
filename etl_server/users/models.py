import os

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy import Column, String

from dgp_oauth2.models import get_users

from ..db_utils import Common, ModelsBase


# ## SQL DB
Base = declarative_base()


# ## USERS
class User(Base, Common):
    __tablename__ = 'etl_users'


class Models(ModelsBase):

    def __init__(self, connection_string=None):
        super().__init__(Base, User, connection_string)

    def query_one(self, key):
        return super().query_one(key, case_sensitive=False)

    def all_users(self):
        auth_users = get_users()
        auth_users = dict(
            (x['id'], x) for x in auth_users
        )
        etl_users = self.query()

        for user in etl_users['result']:
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
