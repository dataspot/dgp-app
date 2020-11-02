import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-dynamic-fields-editor',
  templateUrl: './dynamic-fields-editor.component.html',
  styleUrls: ['./dynamic-fields-editor.component.less']
})
export class DynamicFieldsEditorComponent implements OnInit {

  @Input() item: any;
  @Input() fields: any[];
  @Output() updated = new EventEmitter<void>();
  valid = false;
  expanded = {};

  constructor() { }

  ngOnInit() {
    this.validate();
  }

  update() {
    this.validate();
    this.updated.emit();
  }

  _validate(fields: any[], item) {
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
