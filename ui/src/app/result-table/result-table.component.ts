import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { WorkbenchService } from '../workbench.service';
import { StoreService } from '../store.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-result-table',
  template: `
  <span i18n>Count: {{rowcount}}</span>
  <table>
    <thead>
      <th *ngFor='let hdr of headers'>{{hdr}}</th>
    </thead>
    <tbody>
      <ng-container *ngFor='let row of rows'>
        <tr [class.errd]='row.errd'>
          <td *ngFor='let val of row.data' [innerHtml]='val'>
          </td>
        </tr>
      </ng-container>
    </tbody>
  </table>
  `,
  styles: [
`
    table {
      border-collapse: collapse;
      border: 1px solid #444;
    }

    ::ng-deep .number {
      text-align: right;
      width: 100%;
      display: inline-block;
    }

    th {
      font-weight: bold;
      background-color: #ccc;
      text-align: start;
    }

    tr:nth-child(2n+1) {
      background-color: #eee;
    }

    tr.errd td {
      background-color: salmon;
    }

    td, th {
      padding: 1px 6px;
    }

    td {
      white-space: nowrap;
    }
`
  ]
})
export class ResultTableComponent implements OnInit, OnDestroy {

  @Input() kind: number;
  @Input() kindName: string;
  @Output() validate = new EventEmitter<{kind: string, valid?: boolean, progress?: boolean, errors?: any[]}>();

  rows = [];
  rowcount = 0;
  headers = [];
  subs: Subscription[] = [];
  errors: any[] = null;

  constructor(private store: StoreService) {
    this.subs.push(
      this.store.getRows()
        .subscribe((row) => {
          if (row.kind === -1) {
            this.rows = [];
            this.rowcount = 0;
            this.errors = null;
            console.log('CLEARING STATE FOR', this.kind);
            setTimeout(() => {
              console.log('IN PROGRESS');
              this.validate.emit({kind: this.kindName, progress: this.kind === 0});
            }, 0);
          } else if (this.kind === row.kind) {
            if (row.index === -1) {
              console.log('GOT HEADERS', row);
              this.rows = [];
              this.rowcount = 0;
              this.errors = null;
              this.headers = row.data;
              this.headers.unshift('#');
              setTimeout(() => {
                this.validate.emit({kind: this.kindName, progress: true});
              }, 0);
            } else if (row.index === -2) {
              console.log('GOT DONE');
              setTimeout(() => {
                if (this.errors) {
                  this.validate.emit({kind: this.kindName, errors: this.errors});
                } else {
                  this.validate.emit({kind: this.kindName, valid: true});
                }
              }, 0);
            } else {
              if (this.rows.length === 0) {
                setTimeout(() => {
                  this.validate.emit({kind: this.kindName, progress: true});
                }, 0);
              } else {
                if (this.rows[this.rows.length - 1].data[0] !== row.index ) {
                  this.rows.push({data: this.headers.map((h) => '&hellip;')});
                }
              }
              const mapped: any = this.headers.map((h) => this.strize(row.data[h]));
              mapped[0] = row.index + 1;
              const errd = row.errors && row.errors.length > 0;
              if (errd) {
                this.errors = row.errors;
                this.validate.emit({kind: this.kindName, errors: row.errors});
              }
              this.rows.push({
                data: mapped,
                errd: errd
              });
            }
          }
        })
      );
      this.subs.push(
        this.store.getRowCount()
          .subscribe((count) => {
            if (this.kind === count.kind) {
              this.rowcount = count.index;
            }
          })
      );
  }

  strize(v) {
    if (v !== null && v !== undefined) {
      if (v.hasOwnProperty('type{decimal}')) {
        return `<span class='number'>${parseFloat(v['type{decimal}']).toFixed(2)}</span>`;
      } else if (v.hasOwnProperty('type{date}')) {
        return v['type{date}'];
      } else if (v.hasOwnProperty('type{datetime}')) {
        return v['type{datetime}'];
      } else if (v.hasOwnProperty('type{time}')) {
        return v['type{time}'];
      }
    }
    return '' + v;
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    for (const s of this.subs) {
      s.unsubscribe();
    }
  }
}
