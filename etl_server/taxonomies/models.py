from sqlalchemy.ext.declarative import declarative_base

from ..db_utils import Common, ModelsBase


# ## SQL DB
Base = declarative_base()


# ## USERS
class Taxonomy(Base, Common):
    __tablename__ = 'etl_taxonomies'


class Models(ModelsBase):

    def __init__(self, connection_string=None):
        super().__init__(Base, Taxonomy, connection_string)

