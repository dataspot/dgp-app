import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { WorkbenchService } from '../../workbench.service';
import { StoreService } from '../../store.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-result-table',
  templateUrl: 'result-table.component.html',
  styleUrls: ['result-table.component.less']
})
export class ResultTableComponent implements OnInit, OnDestroy {

  @Input() kind: number;
  @Input() kindName: string;

  rows = [];
  headers = [];
  subs: Subscription[] = [];

  constructor(private store: StoreService) {
    this.subs.push(
      this.store.getRows()
        .subscribe((row) => {
          if (row.kind === -1) {
            this.rows = [];
          } else if (this.kind === row.kind) {
            if (row.index === -1) {
              console.log('GOT HEADERS', row);
              this.rows = [];
              this.headers = row.data;
              this.headers.unshift('#');
            } else if (row.index >= 0) {
              if (this.rows.length !== 0) {
                if (this.rows[this.rows.length - 1].data[0] !== row.index ) {
                  this.rows.push({data: this.headers.map((h) => '&hellip;')});
                }
              }
              const data: any = this.headers.map((h) => this.store.strize(row.data[h]));
              data[0] = row.index + 1;
              const errd = row.errors && row.errors.length > 0 && !row.errors_field;
              const errd_field = row.errors_field ? this.headers.indexOf(row.errors_field) : null;
              this.rows.push({data, errd, errd_field});
            }
          }
        })
      );
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    for (const s of this.subs) {
      s.unsubscribe();
    }
  }
}
