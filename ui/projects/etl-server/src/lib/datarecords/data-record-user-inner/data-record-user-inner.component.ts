import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'etl-data-record-user-inner',
  templateUrl: './data-record-user-inner.component.html',
  styleUrls: ['./data-record-user-inner.component.less']
})
export class DataRecordUserInnerComponent implements OnInit {

  @Output() updated = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
  }

}
