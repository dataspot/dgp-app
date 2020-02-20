import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-step-extract-source',
  template: `
  <div class='formish'>
    <label i18n>URL:</label>
    <input type='url'
      [(ngModel)]='source.path'
      (change)='changed(source.path)'
    />
  </div>
  <div class='formish'>
    <label i18n>Format:</label>
    <select [(ngModel)]='source.format' (change)='changed()'>
      <option value='xls' i18n>Excel (xls)</option>
      <option value='xlsx' i18n>Excel (xlsx)</option>
      <option value='csv' i18n>CSV</option>
      <option value='json' i18n>JSON</option>
      <option value='gsheet' i18n>Google Spreadsheet</option>
    </select>
  </div>
  <ng-container *ngIf='source.sheet_names'>
    <div class='formish'>
      <label i18n>Sheet:</label>
      <select [(ngModel)]='source.sheet' (change)='changed()'>
        <option *ngFor='let x of source.sheet_names' [value]='x[1]'>{{x[1]}}</option>
      </select>
    </div>
  </ng-container>
  <ng-container *ngIf='source.format==="csv"'>
    <div class='formish'>
      <label i18n>Encoding:</label>
      <input type='text'
        [(ngModel)]='source.encoding'
        (change)='changed()'
      />
    </div>
  </ng-container>
  <ng-container *ngIf='source.format==="json"'>
    <div class='formish'>
      <label i18n>JSON Path:</label>
      <input type='text'
        [(ngModel)]='source.property'
        (change)='changed()'
      />
    </div>
  </ng-container>
`,
  styles: []
})
export class StepExtractSourceComponent implements OnInit {

  @Input() source;
  @Output() update = new EventEmitter<string>();

  constructor() { }

  ngOnInit() {
  }

  changed(path?: string) {
    this.update.emit(path);
  }

}
