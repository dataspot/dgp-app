import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { RolesService } from '../roles.service';

@Component({
  selector: 'app-data-record-list',
  templateUrl: './data-record-list.component.html',
  styleUrls: ['./data-record-list.component.less']
})
export class DataRecordListComponent implements OnInit {

  datarecords = [];
  def: any = {};

  constructor(public api: ApiService, public roles: RolesService, private activatedRoute: ActivatedRoute) {
    let defs = null;
    this.api.configuration.pipe(
      switchMap((configuration) => {
        defs = configuration.dataRecords || [];
        return this.activatedRoute.params;
      }),
      switchMap((params) => {
        const detectedName = params.name;
        for (const def of defs) {
          if (def.name === detectedName) {
            this.def = def;
            return this.api.queryDatarecords(detectedName);
          }
        }
      })
    )
    .subscribe((datarecords) => {
      this.datarecords = datarecords;
    });
  }

  ngOnInit() {
  }

}
