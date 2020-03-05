import os

from sqlalchemy import String, Boolean, Column
from sqlalchemy.ext.declarative import declarative_base

from ..db_utils import Common, ModelsBase, JsonType


# ## SQL DB
Base = declarative_base()


# ## Pipeline Model
class Pipeline(Base, Common):
    __tablename__ = 'etl_pipeline'
    owner = Column(String(128))
    private = Column(Boolean)


class Models(ModelsBase):

    def __init__(self, connection_string=None):
        super().__init__(Base, Pipeline, connection_string)

    def create_or_edit(self, key, value, owner=None, allowed_all=False):
        if 'status' in value:
            value.pop('status', None)
        private = value.get('private') is not False
        return super().create_or_edit(
            key, value,
            edit_allowed=lambda document: allowed_all or document.owner == owner,
            create_kw=dict(private=private, owner=owner),
            update_kw=dict(private=private),
        )

    def _pipelines(self):
        return self.query()['result']

    def all_pipelines(self):
        return list(map(lambda p: p['value'], self._pipelines()))

    def delete(self, id, user):
        return super().delete(id, delete_allowed=lambda p: user is None or p['owner'] == user)