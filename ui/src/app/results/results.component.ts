import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { StoreService } from '../store.service';


@Component({
  selector: 'app-results',
  templateUrl: 'results.component.html',
  styleUrls: ['results.component.less'],
})
export class ResultsComponent implements OnInit {

  @Output() validate = new EventEmitter<any>();

  step = 'extract';
  hasResults = false;
  failure = null;
  failureMain = null;
  errors = [];

  TABLES = [
    {slug: 'extract', rowCount: 0, progress: false, errors: null, valid: null},
    {slug: 'map', rowCount: 0, progress: false, errors: null, valid: null},
    {slug: 'enrich', rowCount: 0, progress: false, errors: null, valid: null},
  ];

  constructor(private store: StoreService) {
    this.store.getRows()
      .subscribe((row) => {
        if (row.kind === -1) {
          this.stop();
        } else if (row.kind >= 0 && row.kind < this.TABLES.length) {
          this.hasResults = true;
          const table = this.TABLES[row.kind];
          if (row.index === -1) {
            table.rowCount = 0;
            table.progress = true;
            table.errors = null;
          } else if (row.index === -2) {
            table.progress = false;
            table.valid = table.errors === null;
          } else if (row.index >= 0) {
            table.progress = true;
            table.rowCount = row.index + 1;
            if (table.errors === null && row.errors && row.errors.length > 0) {
              table.errors = row.errors;
              if (this.errors.length === 0) {
                this.errors = row.errors;
              }
            }
          }
        }
      });
    this.store.getRowCount()
      .subscribe((count) => {
        if (count.kind >= 0 && count.kind < this.TABLES.length) {
          this.TABLES[count.kind].rowCount = count.index + 1;
        }
      });
    this.store.getFailure().subscribe((failure) => {
      this.failure = failure;
      if (failure) {
        const parts = failure.replace(/^\s+|\s+$/g, '').split('\n');
        this.failureMain = parts[parts.length - 1];
        this.stop(-1);
      }
    });
  }

  ngOnInit() {
  }

  stop(running = 0) {
    this.TABLES.forEach((x, i) => {
      x.progress = i === running;
      x.rowCount = 0;
      x.errors = null;
      x.valid = null;
      this.hasResults = false;
    });
    this.errors = [];
  }
}
