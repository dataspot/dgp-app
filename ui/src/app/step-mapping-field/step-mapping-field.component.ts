import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-step-mapping-field',
  templateUrl: 'step-mapping-field.component.html',
  styleUrls: ['step-mapping-field.component.less'],
})
export class StepMappingFieldComponent implements OnInit {

  objectKeys = Object.keys;

  @Input() mapping: any;
  @Input() taxonomy: any;
  @Output() change = new EventEmitter<any>();

  more = false;

  constructor() { }

  ngOnInit() {
    this.mapping.options = this.mapping.options || {};
  }

  changed() {
    this.change.emit();
  }

  get compound(): boolean {
    return !!this.mapping.normalize;
  }

  set compound(value: boolean) {
    if (value) {
      delete this.mapping['columnType'];
      this.mapping['normalize'] = {};
      this.mapping['normalizeTarget'] = '';
    } else {
      delete this.mapping['normalize'];
      delete this.mapping['normalizeTarget'];
      this.mapping['columnType'] = '';
    }
  }

  updateMapping(ctName) {
    if (ctName !== 'null') {
      this.mapping.columnType = ctName;
      for (const ct of this.taxonomy.columnTypes) {
        if (ct.name === ctName) {
          if (!this.mapping.title) {
            this.mapping.title = ct.title;
          }
          if (!this.mapping.description) {
            this.mapping.description = ct.description;
          }
          break;
        }
      }
    } else {
      delete this.mapping['columnType'];
    }
    this.changed();
  }

}
