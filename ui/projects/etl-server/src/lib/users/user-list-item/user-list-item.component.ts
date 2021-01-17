import { Component, OnInit, Input } from '@angular/core';
import { ApiService } from '../../api.service';
import { ConfirmerService } from '../../confirmer.service';
import { filter, first, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-user-list-item',
  templateUrl: './user-list-item.component.html',
  styleUrls: ['./user-list-item.component.less']
})
export class UserListItemComponent implements OnInit {

  @Input() item: any;
  datarecords = [];

  _level = '';

  constructor(private api: ApiService, private confirmer: ConfirmerService) {
  }

  ngOnInit() {
    this._level = this.item.level + '';
    this.api.configuration.pipe(first()).subscribe((config) => {
      this.datarecords = config.dataRecords || [];
      for (const def of this.datarecords) {
        this.item.datarecords[def.name] = this.item.datarecords[def.name] || {}; 
      }
    });
  }

  get level() {
    return this._level;
  }

  set level(value) {
    this._level = value;
    this.item.level = parseInt(value, 10);
    this.update();
  }

  update() {
    this.api.updateUser(this.item)
      .subscribe((result) => {
        console.log('UPDATED', result);
      });
  }

  delete(e) {
    this.confirmer.confirm(this.confirmer.ACTION_DELETE_USER, this.item.email)
      .pipe(
        filter((x) => x),
        switchMap(() => this.api.deleteUser(this.item.id))
      ).subscribe((result) => {
        console.log('DELETED USER', result);
      });
    e.preventDefault();
    return false;
  }

}
