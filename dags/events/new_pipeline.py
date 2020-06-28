from dgp_server.log import logger

def handler(pipeline=None):
    logger.info('New pipeline %r', pipeline)
