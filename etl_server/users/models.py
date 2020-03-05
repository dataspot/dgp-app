import os

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy import Column, String

from auth.models import get_user

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
