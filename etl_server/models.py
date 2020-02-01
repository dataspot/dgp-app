import os
import json

from contextlib import contextmanager

from sqlalchemy import types
from sqlalchemy import inspect
from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy import Column, String, create_engine
from sqlalchemy.orm import sessionmaker


# ## SQL DB
Base = declarative_base()


# ## Json as string Type
class JsonType(types.TypeDecorator):
    impl = types.Unicode

    def process_bind_param(self, value, dialect):
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value:
            return json.loads(value)
        else:
            return None

    def copy(self, **kw):
        return JsonType(self.impl.length)


# ## Pipeline Model
class Pipeline(Base):
    __tablename__ = 'etl_pipeline'
    key = Column(String(128), primary_key=True)
    value = Column(JsonType)


class Models():

    def __init__(self, connection_string=None):
        connection_string = connection_string or os.environ.get('DATABASE_URL')
        assert connection_string is not None,\
            "No database defined, please set your DATABASE_URL env-var"
        self._sql_engine = create_engine(connection_string)
        self._sql_session = None
        Base.metadata.create_all(self._sql_engine)

    @contextmanager
    def session_scope(self):
        """Provide a transactional scope around a series of operations."""
        if self._sql_session is None:
            self._sql_session = sessionmaker(bind=self._sql_engine)
        session = self._sql_session()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.expunge_all()
            session.close()

    @staticmethod
    def object_as_dict(obj):
        return {c.key: getattr(obj, c.key)
                for c in inspect(obj).mapper.column_attrs}

    def create_or_edit(self, key, value):
        ret = dict(created=False, success=True, result=value)
        with self.session_scope() as session:
            document = session.query(Pipeline)\
                .filter(Pipeline.key == key).first()
            if document is None:
                document = Pipeline(key=key, value=value)
                ret['created'] = True
            else:
                document.value = value
            session.add(document)
        return ret

    def query(self):
        results = []
        ret = dict(success=False, result=results)
        with self.session_scope() as session:
            documents = session.query(Pipeline)
            for doc in documents:
                results.append(self.object_as_dict(doc))
            ret['success'] = True
        return ret

    def query_one(self, key):
        ret = dict(success=False)
        with self.session_scope() as session:
            document = session.query(Pipeline)\
                .filter(Pipeline.key == key).first()
            if document is not None:
                ret['success'] = True
                ret['result'] = self.object_as_dict(document)
        return ret

    def delete(self, key):
        ret = dict(success=False)
        with self.session_scope() as session:
            document = session.query(Pipeline)\
                .filter(Pipeline.key == key).first()
            if document is not None:
                ret['success'] = True
                session.delete(document)
        return ret
