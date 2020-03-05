import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { RolesService } from '../roles.service';

@Component({
  selector: 'app-pipeline-list',
  templateUrl: './pipeline-list.component.html',
  styleUrls: ['./pipeline-list.component.less']
})
export class PipelineListComponent implements OnInit {

  constructor(public api: ApiService, public roles: RolesService) {
  }

  ngOnInit() {
  }

}
