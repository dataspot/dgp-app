import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-step-extract-structure',
  template: `
  <div class='formish'>
    <label i18n>Skip Rows:</label>
    <input type='number'
      min="0" max="100"
      [(ngModel)]='structure.skip_rows'
      (change)='changed()'
    />
  </div>
  <div class='formish'>
    <label i18n>Skip Columns:</label>
    <input type='number'
      min="0" max="100"
      [(ngModel)]='structure.skip_cols'
      (change)='changed()'
    />
  </div>
  `,
  styles: []
})
export class StepExtractStructureComponent implements OnInit {

  @Input() structure;
  @Output() change = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {
  }

  changed() {
    this.change.emit();
  }
}
