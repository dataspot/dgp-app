import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-extendable-keyvalue-list',
  template: `
    <div>
      <span class='item' *ngFor='let value of values'>
        <select [(ngModel)]='value[0]' (change)='changed()'>
          <option *ngFor='let ct of taxonomy.columnTypes'
                  [value]='ct.title'>{{ct.title}}</option>
        </select>
        (<input type='text'
          [(ngModel)]='value[0]'
          (change)='changed()'
        />)
        <span> = </span>
        <input type='text'
          [(ngModel)]='value[1]'
          (change)='changed()'
        />
        <a href='#' *ngIf='value[0]' (click)='value[0]=""; changed()'><i class="fas fa-trash"></i></a>
      </span>
    </div>
  `,
  styles: [
    `
div {
  display: flex;
  flex-flow: column;
  padding: 5px 10px;
}

.item {
  display: flex;
  flex-flow: row;
}
    `
  ]
})
export class ExtendableKeyvalueListComponent implements OnInit {

  @Input() data;
  @Input() dataList;
  @Input() taxonomy: any;
  @Output() update = new EventEmitter<any>();
  @Output() updateList = new EventEmitter<any>();

  values = [];

  constructor() { }

  ngOnInit() {
    if (this.dataList) {
      this.values = this.dataList.slice();
    } else {
      this.values = Object.entries(this.data);
    }
    this.values.push(['', '']);
  }

  changed() {
    this.updateList.emit(this.values.slice(0, -1));

    const x = [];
    const ret = {};
    for (const v of this.values) {
      if (v[0]) {
        x.push(v);
        ret[v[0]] = v[1];
      }
    }
    x.push(['', '']);
    this.values = x;
    this.update.emit(ret);
  }
}
