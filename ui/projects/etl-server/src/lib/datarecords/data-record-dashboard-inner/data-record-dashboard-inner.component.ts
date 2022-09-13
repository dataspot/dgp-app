import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'lib-data-record-dashboard-inner',
  templateUrl: './data-record-dashboard-inner.component.html',
  styleUrls: ['./data-record-dashboard-inner.component.less']
})
export class DataRecordDashboardInnerComponent implements OnInit {

  @Input() def: any;
  @Input() datarecords: any[];

  constructor() { }

  ngOnInit(): void {
  }

}
