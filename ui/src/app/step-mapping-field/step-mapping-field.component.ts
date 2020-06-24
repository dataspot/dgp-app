import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-step-mapping-field',
  templateUrl: 'step-mapping-field.component.html',
  styleUrls: ['step-mapping-field.component.less'],
})
export class StepMappingFieldComponent implements OnInit {

  objectKeys = Object.keys;

  @Input() mapping: any;
  @Input() taxonomy: any;
  @Input() sample: any;
  @Output() change = new EventEmitter<any>();

  more = false;
  ct = null;

  constructor(public api: ApiService) { }

  ngOnInit() {
    this.mapping.options = this.mapping.options || {};
    this.updateOwnCt();
  }

  changed() {
    this.change.emit();
  }

  get hasErrors() {
    return this.sample && this.sample.length > 0;
  }

  set trueValues(values: string) {
    this.mapping.options.trueValues = values.split(',');
  }

  set falseValues(values: string) {
    this.mapping.options.falseValues = values.split(',');
  }

  get trueValues() {
    if (this.mapping.options.trueValues && Array.isArray(this.mapping.options.trueValues)) {
      return this.mapping.options.trueValues.join(',');
    }
    return null;
  }

  get falseValues() {
    if (this.mapping.options.falseValues && Array.isArray(this.mapping.options.falseValues)) {
      return this.mapping.options.falseValues.join(',');
    }
    return null;
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

  updateOwnCt() {
    const ctName = this.mapping.columnType;
    for (const ct of this.taxonomy.columnTypes) {
      if (ct.name === ctName) {
        this.ct = ct;
        this.ct.options = this.ct.options || {};
        if (this.ct.dataType === 'date') {
          this.mapping.options.format = this.mapping.options.format || 'default';
        } else if (this.ct.dataType === 'boolean') {
          this.mapping.options.trueValues = this.mapping.options.trueValues ||
            this.ct.options.trueValues || ['true', 'True', 'TRUE', '1'];
          this.mapping.options.falseValues = this.mapping.options.falseValues ||
            this.ct.options.falseValues || [ 'false', 'False', 'FALSE', '0'];
        } else if (this.ct.dataType === 'number') {
          this.mapping.options.decimalChar = this.mapping.options.decimalChar || this.ct.options.decimalChar || '.';
          this.mapping.options.groupChar = this.mapping.options.groupChar || this.ct.options.groupChar || '';
          this.mapping.options.bareNumber = this.mapping.options.bareNumber === undefined ? true : this.mapping.options.bareNumber;
        } else if (this.ct.dataType === 'integer') {
          this.mapping.options.bareNumber = this.mapping.options.bareNumber === undefined ? true : this.mapping.options.bareNumber;
        }
        return;
      }
    }
    this.ct = null;
  }

  updateMapping(ctName) {
    if (ctName !== 'null') {
      this.mapping.columnType = ctName;
      for (const ct of this.taxonomy.columnTypes) {
        if (ct.name === ctName) {
          if (!this.mapping.title) {
            this.mapping.title = ct.title;
          }
          this.mapping.description = ct.description;
          break;
        }
      }
    } else {
      delete this.mapping['columnType'];
    }
    this.updateOwnCt();
    this.changed();
  }

}
