import calendar
import boto3
import json
import tempfile
import shutil
from auth.models import get_user

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
        if not self.bucket.creation_date:
            self.bucket.create(ACL='authenticated-read')


    def list_files(self):
        from flask import current_app
        current_app.logger.error('XXX')
        ret = [
            (
                o.key,
                o.last_modified,
                oo.content_length,
                oo.metadata.get('Ownerid'),
                oo.metadata.get('Ownername'),
            )
            for o in self.bucket.objects.all() or []
            for o, oo in [(o, o.Object())]
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
            print(admin, o.metadata)
            from Flask import request; request.application.logger.error('BOO %s %s', admin, o.metadata)
            if admin or o.metadata.get('ownerid') == user:
                allowed = True
        except:
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
                    ACL='authenticated-read'
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
            if admin or o.metadata.get('Ownerid') == user:
                o.delete()
                return dict(
                    success=True,
                )

        except:
            pass
        return dict(
            success=False
        )
