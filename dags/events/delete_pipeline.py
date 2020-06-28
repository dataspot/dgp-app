import logging

def handler(pipeline=None):
    logging.info('Deleting pipeline %r', pipeline.get('id'))