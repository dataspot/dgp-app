import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';

@Component({
  selector: 'etl-dynamic-fields-editor',
  templateUrl: './dynamic-fields-editor.component.html',
  styleUrls: ['./dynamic-fields-editor.component.less']
})
export class DynamicFieldsEditorComponent implements OnInit, AfterViewInit {

  @Input() item: any;
  @Input() fields: any[];
  @Output() updated = new EventEmitter<void>();
  valid = false;
  expanded: any = {};

  constructor() { }

  ngOnInit() {
    this.validate();
  }

  update() {
    this.validate();
    this.updated.emit();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.update();
    }, 0);
  }

  _validate(fields: any[], item: any) {
    let ret = true;
    for (const field of fields) {
      field.__valid = true;
      if (field.type === 'section') {
        if (!this._validate(field.fields, item)) {
          ret = false;
        }
      }
      if (field.required && !item[field.name]) {
        field.__valid = false;
        ret = false;
      }
    }
    return ret;
  }

  validate() {
    this.valid = this._validate(this.fields, this.item);
  }

}
