import os
import tempfile
import boto3

from dgp.core import BaseDataGenusProcessor, BaseAnalyzer
from dgp.config.consts import CONFIG_URL
from dgp_server.log import logger


_bucket = None
def bucket():
    global _bucket
    if _bucket is None:
        bucket_name = os.environ.get('BUCKET_NAME')
        endpoint_url = os.environ.get('S3_ENDPOINT_URL')
        aws_access_key_id = os.environ.get('AWS_ACCESS_KEY_ID')
        aws_secret_access_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
        aws_region = os.environ.get('AWS_REGION')

        s3 = boto3.resource('s3',         
            endpoint_url=endpoint_url,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=aws_region
        )
        _bucket = s3.Bucket(bucket_name)
    return _bucket

def cache_dir():
    return os.path.join(tempfile.gettempdir(), 'file-cache')

os.makedirs(cache_dir(), exist_ok=True)


class FileLoaderAnalyzer(BaseAnalyzer):

    CONFIG_SOURCE_FILENAME = 'loader.filename'

    def analyze(self):
        if self.config.get(self.CONFIG_SOURCE_FILENAME):
            filename = self.config.get(self.CONFIG_SOURCE_FILENAME)
            obj = bucket().Object(filename)
            filename = os.path.join(cache_dir(), '{}-{}'.format(obj.last_modified.isoformat(), filename))
            current_url = self.config.get(CONFIG_URL)
            logger.warning('FileLoaderAnalyzer current_url=%s', current_url)
            if current_url != filename:
                self.config.set(CONFIG_URL, filename)
                self.context.reset_stream()
            if not os.path.exists(filename):
                logger.warning('FileLoaderAnalyzer downloading')
                obj.download_file(Filename=filename)
        return True


class FileLoaderDGP(BaseDataGenusProcessor):

    def __init__(self, config, context):
        super().__init__(config, context)
        self.steps = self.init_classes([
           FileLoaderAnalyzer,
        ])
