import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { RolesService } from '../../roles.service';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'etl-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.less']
})
export class FilesComponent implements OnInit {
  uploaderVisible = false;
  forceFilename: string | null = null;
  justMine = false;
  sort = 'alpha';
  files = [];
  showFiles: any[] = [];
  sub: Subscription | null = null;

  constructor(public api: ApiService, public roles: RolesService) {
    this.api.queryFiles();
    this.processFiles();
  }

  ngOnInit() {
  }

  upload() {
    this.forceFilename = null;
    this.uploaderVisible = true;
  }

  update(filename: string) {
    this.forceFilename = filename;
    this.uploaderVisible = true;
  }

  processFiles() {

    const source = this.justMine ? this.api.ownFiles : this.api.files;
    if (this.sub) {
      this.sub.unsubscribe();
    }
    this.sub = source.subscribe((files) => {
      this.showFiles = files.slice();
      this.showFiles.forEach((item) => {
        if (!item.last_modified_date) {
          item.last_modified_date = new Date(item.last_modified * 1000).toLocaleDateString();
          item.last_modified_time = new Date(item.last_modified * 1000).toLocaleTimeString();
        }
      });
      if (this.sort === 'alpha') {
        this.showFiles = this.showFiles.sort((a, b) => a.name < b.name ? -1 : 1);
      } else {
        this.showFiles = this.showFiles.sort((a, b) => b.last_modified - a.last_modified);
      }
    });
  }

}
