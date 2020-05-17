import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-step-extract-source',
  template: `
  <div class='formish'>
    <label i18n>Uploaded Source File:</label>
    <select [(ngModel)]='loader.filename' (change)='changed({loader: {filename: loader.filename}, source:{}})'>
      <option *ngFor='let file of (api.files | async)' [value]='file.filename'>{{file.filename}}</option>
    </select>
  </div>
  <div class='formish'>
    <label i18n>Direct URL:</label>
    <input type='text' class='url'
      [(ngModel)]='source.path'
      (change)='changed({source: {path: source.path}, loader:{}})'
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
      <option value='html' i18n>HTML Table</option>
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
  <ng-container *ngIf='source.format==="html"'>
    <div class='formish'>
      <label i18n>CSS Selector:</label>
      <input type='text'
        [(ngModel)]='source.selector'
        (change)='changed()'
      />
      <a (click)='source.selector = ""; changed()'>Set no selector</a>
    </div>
  </ng-container>
`,
  styles: []
})
export class StepExtractSourceComponent implements OnInit {

  @Input() source;
  @Input() loader;
  @Output() update = new EventEmitter<string>();

  constructor(public api: ApiService) {
    this.api.queryFiles();
  }

  ngOnInit() {
  }

  changed(config?: any) {
    this.update.emit(config);
  }

}
