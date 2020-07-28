import sys
import tempfile
import yaml
import os
import logging
import json

from sqlalchemy import create_engine

from dataflows import Flow, printer

from dgp.core import Config, Context
from dgp.genera import SimpleDGP, LoaderDGP, TransformDGP, EnricherDGP, PublisherDGP
from dgp.taxonomies import TaxonomyRegistry

from .fileloader import FileLoaderDGP


engine = None

def get_engine():
    global engine
    if engine is None:
        engine = create_engine(os.environ['DATASETS_DATABASE_URL'])
    return engine

def set_dots(o, k, v):
    k = k.split('.')
    while len(k) > 1:
        p = k.pop(0)
        o = o.setdefault(p, {})
    o[k[0]] = v


def operator(name, params):
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8') as config_file:
        params['dgpConfig'].setdefault('publish', {})['allowed'] = True
        params['dgpConfig'].setdefault('extra', {}).setdefault('metadata', {})['title'] = name
        for k, v in params.items():
            if k.startswith('extra.'):
                set_dots(params['dgpConfig'], k, v)
        logging.info('\nCONFIGURATION:\n--------------\n%s', 
                     json.dumps(params['dgpConfig'], sort_keys=True, ensure_ascii=False, indent=2))
        yaml.dump(params['dgpConfig'], config_file)
        config_file.flush()
        config = Config(config_file.name)
        taxonomy_registry = TaxonomyRegistry('taxonomies/index.yaml')
        context = Context(config, taxonomy_registry)

        logging.getLogger().setLevel(logging.DEBUG)

        steps = [
            FileLoaderDGP,
            LoaderDGP,
            TransformDGP,
            EnricherDGP,
            PublisherDGP,
        ]

        dgp = SimpleDGP(
            config, context,
            steps=steps
        )

        ret = dgp.analyze()
        if not ret:
            logging.error('Errors:')
            logging.error('\n\t - '.join([str(x) for x in dgp.errors]))
            sys.exit(0)

        # logging.info('\nCONF (POST ANALYSIS):\n--------------\n%s', 
        #              json.dumps(config._unflatten(), sort_keys=True, ensure_ascii=False, indent=2))

        flow = dgp.flow()
        flow = Flow(
            flow,
            printer(tablefmt='html')
        )
        flow.process()

        logging.info('Success')
