import { Component, OnInit, Input, OnChanges, EventEmitter, Output } from '@angular/core';

import { TableType } from '../results/types';

@Component({
  selector: 'etl-results-tab-selector',
  templateUrl: './results-tab-selector.component.html',
  styleUrls: ['./results-tab-selector.component.less']
})
export class ResultsTabSelectorComponent implements OnInit {

  @Input() table: TableType;
  @Input() label: string;
  @Input() active: boolean;
  @Output() select = new EventEmitter<void>();

  constructor() { }

  ngOnInit() {
  }

  get state() {
    let ret = 'unknown';
    if (this.table.errors && this.table.errors.length > 0) {
      ret = 'fail';
    } else if (this.table.valid) {
      ret = 'success';
    } else if (this.table.progress) {
      ret = 'progress';
    }
    return ret;
  }

}
