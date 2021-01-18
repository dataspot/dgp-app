import { Component, Input, OnInit } from '@angular/core';
import { RolesService } from '../../roles.service';
import { snippetize } from '../../utilities';

@Component({
  selector: 'lib-data-record-list-inner',
  templateUrl: './data-record-list-inner.component.html',
  styleUrls: ['./data-record-list-inner.component.less']
})
export class DataRecordListInnerComponent implements OnInit {

  @Input() datarecords: any;
  @Input() def: any;

  constructor(public roles: RolesService) { }

  ngOnInit(): void {
  }

  snippetize(def, record) {
    return snippetize(def, record);
  }
}
