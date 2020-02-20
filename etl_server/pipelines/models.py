import os

from sqlalchemy.ext.declarative import declarative_base

from ..db_utils import Common, ModelsBase


# ## SQL DB
Base = declarative_base()


# ## Pipeline Model
class Pipeline(Base, Common):
    __tablename__ = 'etl_pipeline'


class Models(ModelsBase):

    def __init__(self, connection_string=None):
        super().__init__(Base, Pipeline, connection_string)

    def create_or_edit(self, key, value):
        if 'status' in value:
            value.pop('status', None)
        return super().create_or_edit(key, value)

    def _pipelines(self):
        return self.query()['result']

    def all_pipelines(self):
        return list(map(lambda p: p['value'], self._pipelines()))
