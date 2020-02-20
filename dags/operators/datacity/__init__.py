import sys
import tempfile
import yaml
import os
import logging

from sqlalchemy import create_engine

from dataflows import Flow, printer

from dgp.core import Config, Context
from dgp.genera import SimpleDGP, LoaderDGP, TransformDGP, EnricherDGP
from dgp.taxonomies import TaxonomyRegistry
from dgp_server.blueprint import PublishFlow

from .datacity_dgp import DataCityDGP
from .db_preparer_dgp import DBPreparerDGP


engine = None

def get_engine():
    global engine
    if engine is None:
        engine = create_engine(os.environ['DATABASE_URL'])
    return engine


def operator(params):
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8') as config_file:
        yaml.dump(params['dgpConfig'], config_file)
        config_file.flush()
        config = Config(config_file.name)
        taxonomy_registry = TaxonomyRegistry('taxonomies/index.yaml')
        context = Context(config, taxonomy_registry)

        logging.getLogger().setLevel(logging.DEBUG)

        dgp = SimpleDGP(
            config, context,
            steps=[
                LoaderDGP,
                DataCityDGP,
                TransformDGP,
                EnricherDGP,
                DBPreparerDGP(config, context, get_engine),
                PublishFlow(config, context, get_engine),
            ]
        )

        ret = dgp.analyze()
        if not ret:
            logging.error('Errors:')
            logging.error('\n\t - '.join([str(x) for x in dgp.errors]))
            sys.exit(0)

        flow = dgp.flow()
        flow = Flow(
            flow,
            printer(tablefmt='html')
        )
        flow.process()

        logging.info('Success')
