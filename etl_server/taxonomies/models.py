import os

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy import Column, String

from dgp_oauth2.models import get_users

from ..db_utils import Common, ModelsBase


# ## SQL DB
Base = declarative_base()


# ## USERS
class Taxonomy(Base, Common):
    __tablename__ = 'etl_taxonomies'


class Models(ModelsBase):

    def __init__(self, connection_string=None):
        super().__init__(Base, Taxonomy, connection_string)

