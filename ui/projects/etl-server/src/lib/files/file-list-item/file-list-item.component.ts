import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from 'dgp-oauth2-ng';
import { RolesService } from '../../roles.service';
import { ApiService } from '../../api.service';
import { ConfirmerService } from '../../confirmer.service';
import { switchMap, filter } from 'rxjs/operators';

@Component({
  selector: 'app-file-list-item',
  templateUrl: './file-list-item.component.html',
  styleUrls: ['./file-list-item.component.less']
})
export class FileListItemComponent implements OnInit {

  @Input() item: any;
  @Output() update = new EventEmitter<void>();

  userId: string;

  constructor(private auth: AuthService, private roles: RolesService,
              private api: ApiService, private confirmer: ConfirmerService) {
    this.auth.getUser().subscribe((user) => {
      this.userId = user.profile.id;
    });
  }

  get size() {
    let size: number = this.item.size;
    let suffix = '';
    if (size > 1000) {
      size = size / 1000;
      suffix = ' KB';
    }
    if (size > 1000) {
      size = size / 1000;
      suffix = ' MB';
    }
    if (size > 1000) {
      size = size / 1000;
      suffix = ' GB';
    }
    return size.toFixed(2) + suffix;
  }

  ngOnInit() {
  }

  updateable() {
    return this.roles._.filesUpdateAll || (this.roles._.filesUpdateOwn && this.item.owner_id === this.userId);
  }

  deletable() {
    return this.roles._.filesDeleteAll || (this.roles._.filesDeleteOwn && this.item.owner_id === this.userId);
  }

  downloadable(){
    return this.roles._.filesDownload;
  }

  
  delete() {
    this.confirmer.confirm(this.confirmer.ACTION_DELETE_FILE, this.item.filename)
      .pipe(
        filter((x) => x),
        switchMap(() => this.api.deleteFile(this.item.filename))
      ).subscribe((result) => {
          console.log('deleted', result);
          this.api.queryFiles();
        });
  }

  download(){

    this.api.token.subscribe((token) =>{
      const filename = encodeURIComponent(this.item.filename);
      const jwt = encodeURIComponent(token);
      
      const url = this.api.API_ENDPOINT + '/file?filename=' + filename
      + '&jwt=' + jwt;
      window.open(url);
     
    });
    
  }

  requestUpdate() {
    this.update.emit();
  }
}
