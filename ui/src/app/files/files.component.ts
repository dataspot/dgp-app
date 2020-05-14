import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { RolesService } from '../roles.service';

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.less']
})
export class FilesComponent implements OnInit {

  uploaderVisible = false;
  forceFilename: string;

  constructor(public api: ApiService, public roles: RolesService) {
    this.api.queryFiles();
  }

  ngOnInit() {
  }

  upload() {
    this.forceFilename = null;
    this.uploaderVisible = true;
  }

  update(filename) {
    this.forceFilename = filename;
    this.uploaderVisible = true;
  }
}
