import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service';
import { RolesService } from '../../roles.service';
import { ConfirmerService } from '../../confirmer.service';
import { filter, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-data-record-edit-inner',
  templateUrl: './data-record-edit-inner.component.html',
  styleUrls: ['./data-record-edit-inner.component.less']
})
export class DataRecordEditInnerComponent implements OnInit {

  @Input() datarecord: any;
  @Input() def: any;
  kind = '';

  constructor(public api: ApiService, public roles: RolesService, private router: Router, private confirmer: ConfirmerService) { }

  ngOnInit() {
    this.kind = this.def.name;
  }

  _save() {
    this.datarecord.id = this.datarecord.id || this.datarecord[this.def.id];
    return this.api.saveDatarecord(this.kind, this.datarecord);
  }

  save() {
    this._save()
        .subscribe((result) => {
          if (result.id) {
            this.router.navigate(['/datarecords/', this.kind]);
          } else {
            console.log('Failed to SAVE Datarecord!', this.kind);
          }
        });
  }

  delete(e) {
    this.confirmer.confirm(this.confirmer.ACTION_DELETE_DATARECORD, this.datarecord[this.def.snippet])
      .pipe(
        filter((x) => x),
        switchMap(() => this.api.deleteDatarecord(this.kind, this.datarecord.id))
      ).subscribe((result) => {
        console.log('DELETED DATARECORD', result);
        this.router.navigate(['/datarecords/', this.kind]);
      });
    e.preventDefault();
    return false;
  }
}
