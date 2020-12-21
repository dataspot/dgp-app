import sys
import tempfile
import yaml
import os
import logging
import json

from sqlalchemy import create_engine

from dataflows import Flow, printer

from dgp.core import Config, Context
from dgp.genera import SimpleDGP, LoaderDGP, PostLoaderDGP, TransformDGP, EnricherDGP, PublisherDGP
from dgp.taxonomies import TaxonomyRegistry

from etl_server.loaders.fileloader import FileLoaderDGP


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


def operator(name, params, pipeline):
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8') as config_file:
        params['dgpConfig'].setdefault('publish', {})['allowed'] = True
        metadata = params['dgpConfig'].setdefault('extra', {}).setdefault('metadata', {})
        metadata['title'] = name
        metadata['updated_at'] = pipeline['__updated_at']
        metadata['created_at'] = pipeline['__created_at']
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
            PostLoaderDGP,
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
            assert False

        # logging.info('\nCONF (POST ANALYSIS):\n--------------\n%s', 
        #              json.dumps(config._unflatten(), sort_keys=True, ensure_ascii=False, indent=2))

        logging.info('Creating Flow')
        flow = dgp.flow()
        flow = Flow(
            flow,
            printer(tablefmt='html')
        )
        logging.info('Running Flow')
        _, stats = flow.process()

        logging.info('Success')

        return stats