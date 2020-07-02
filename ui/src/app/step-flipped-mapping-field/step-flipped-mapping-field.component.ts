import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-step-flipped-mapping-field',
  templateUrl: './step-flipped-mapping-field.component.html',
  styleUrls: ['./step-flipped-mapping-field.component.less']
})
export class StepFlippedMappingFieldComponent implements OnInit {

  @Input() ct: any;
  @Input() mapping: any;
  @Input() constant: any;
  @Input() config: any;

  mappingType = '';
  constantValue = null;

  constructor() { }

  ngOnInit() {
    this.mapping = this.mapping || {};
    this.mapping.columnType = this.mapping.columnType || this.ct.name;
    this.mapping.title = this.mapping.title || this.ct.name;
    this.mapping.options = this.mapping.options || {};
    this.mappingType = this.mapping.name || '';
    if (this.constant !== null) {
      this.mappingType = 'constant';
    }
    this.updateMappingOptions();
  }

  updateMappingOptions() {
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


}
