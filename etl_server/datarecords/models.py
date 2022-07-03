import os

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy import Column, String

from ..db_utils import Common, ModelsBase


# ## SQL DB
Base = declarative_base()


# ## USERS
class DataRecord(Base, Common):
    __tablename__ = 'datarecords'
    created_by = Column(String(128))
    updated_by = Column(String(128))


class Models(ModelsBase):

    def __init__(self, connection_string=None):
        super().__init__(Base, DataRecord, connection_string)
