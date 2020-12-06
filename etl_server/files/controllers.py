import calendar
from urllib.parse import unquote_plus
import boto3
from botocore.exceptions import ClientError
import json
import tempfile
import shutil
from dgp_oauth2.models import get_user

class Controllers():

    def __init__(self, bucket_name, endpoint_url, aws_access_key_id, aws_secret_access_key, aws_region):
        kw = dict(
            endpoint_url=endpoint_url,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=aws_region
        )
        self.s3client = boto3.client('s3', **kw)
        self.s3 = boto3.resource('s3', **kw)
        self.bucket = self.s3.Bucket(bucket_name)
        exists = False
        try:
            exists = self.bucket.creation_date is not None
        except:
            pass
        if not exists:
            try:
                self.bucket.create(ACL='private')
            except:
                # Avoid race conditions
                pass

    @staticmethod
    def ownerid(obj):
        return obj.metadata.get('Ownerid') or obj.metadata.get('ownerid')

    @staticmethod
    def ownername(obj):
        return obj.metadata.get('Ownername') or obj.metadata.get('ownername')

    def list_files(self, user=None):
        filenames = [
            unquote_plus(o.key)
            for o in self.bucket.objects.all() or []
        ]
        objects = [
            self.bucket.Object(f) for f in filenames
        ]
        ret = [
            (
                o.key,
                o.last_modified,
                o.content_length,
                self.ownerid(o),
                self.ownername(o),
            )
            for o in objects
        ]
        ret = [
            dict(
                filename=filename,
                last_modified=calendar.timegm(last_modified.timetuple()),
                size=size,
                owner_id=ownerid,
                owner_name=ownername,
            )
            for filename, last_modified, size, ownerid, ownername in ret
            if user in (None, ownerid)
        ]
        return dict(
            success=True, result=ret
        )

    def download_file(self, filename):
        return self.s3client.generate_presigned_url(
            'get_object',
            dict(Bucket=self.bucket.name, Key=filename),
            HttpMethod='GET'
        )

    def upload_file(self, file_obj, filename, user, admin=False):
        profile = get_user(user)
        username = profile.get('name')
        o = self.bucket.Object(filename)
        allowed = False
        try:
            if admin or self.ownerid(o) == user:
                allowed = True
        except ClientError:
            allowed = True
        if allowed:
            metadata = dict(
                ownerid=user,
                ownername=username
            )
            with tempfile.NamedTemporaryFile() as t:
                shutil.copyfileobj(file_obj.stream, t)
                t.flush()
                t.seek(0)
                self.s3client.put_object(
                    Body=t,
                    Bucket=self.bucket.name,
                    Key=filename,
                    ContentType=file_obj.mimetype or 'application/octet-stream',
                    Metadata=metadata,
                    ACL='private'
                )
            return dict(
                success=True,
            )
        else:
            return dict(
                success=False
            )

    def delete_file(self, filename, user, admin=False):
        o = self.bucket.Object(filename)
        try:
            if admin or self.ownerid(o) == user:
                o.delete()
                return dict(
                    success=True,
                )

        except:
            pass
        return dict(
            success=False
        )
