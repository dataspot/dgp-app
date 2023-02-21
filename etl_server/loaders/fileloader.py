import os
import tempfile
import boto3

from dgp.core import BaseAnalyzer
from dgp.config.consts import CONFIG_URL
from dgp_server.log import logger

CONFIG_SOURCE_FILENAME = 'loader.filename'

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


class BaseFilePreprocessor(BaseAnalyzer):

    def test_url(self, url):
        pass

    def process_url(self, url, cache_dir):
        pass

    def run(self):
        url = self.config.get(self.CONFIG_URL)
        if url:
            self.obj_name = self.test_url(url)
            if self.obj_name:
                obj = bucket().Object(self.obj_name)
                try:
                    obj.load()
                except Exception:
                    temp_filename = self.process_url(url, cache_dir)
                    obj.upload_file(temp_filename)
                self.config.set(CONFIG_SOURCE_FILENAME, self.obj_name)

    def test(self):
        return True

    
class FileLoaderAnalyzer(BaseAnalyzer):

    def download_out_filename(self):
        filename = self.config.get(CONFIG_SOURCE_FILENAME)
        if not filename:
            return
        logger.warning('FileLoaderAnalyzer filename=%s', filename)
        obj = bucket().Object(filename)
        last_modified = obj.last_modified.strftime('%Y%m%d%H%M%S')
        out_filename = os.path.join(cache_dir(), '{}-{}'.format(last_modified, filename))
        if not os.path.exists(out_filename):
            logger.warning('FileLoaderAnalyzer downloading')
            obj.download_file(Filename=out_filename)
        return out_filename

    def run(self):
        if self.cached_out_filename:
            current_url = self.config.get(CONFIG_URL)
            logger.warning('FileLoaderAnalyzer current_url=%s, cached_out_filename=%s', current_url, self.cached_out_filename)
            if current_url != self.cached_out_filename:
                self.config.set(CONFIG_URL, self.cached_out_filename)
                self.context.reset_stream()

    def analyze(self):
        self.cached_out_filename = self.download_out_filename()
        self.run()
        return True


class FileLoaderDGP(BaseDataGenusProcessor):

    def __init__(self, config, context):
        super().__init__(config, context)
        self.steps = self.init_classes([
           FileLoaderAnalyzer,
        ])
