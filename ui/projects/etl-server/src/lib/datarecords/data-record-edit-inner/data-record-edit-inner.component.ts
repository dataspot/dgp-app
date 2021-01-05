import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-data-record-edit-inner',
  templateUrl: './data-record-edit-inner.component.html',
  styleUrls: ['./data-record-edit-inner.component.less']
})
export class DataRecordEditInnerComponent implements OnInit {

  @Input() datarecord: any;
  @Input() def: any;

  constructor() { }

  ngOnInit() {
  }

}
