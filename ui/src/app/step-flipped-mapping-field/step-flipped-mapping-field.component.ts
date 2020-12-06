import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { first } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { FIELD_CONSTANT, FIELD_UNPIVOT_TARGET, FIELD_UNPIVOT_COLUMN } from '../step-flipped-mapping/step-flipped-mapping.component';
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
  @Input() sample: any;
  @Input() mappingType: any;
  @Output() update = new EventEmitter<any>();

  expanded = false;
  titleVisible = false;
  titleEditable = false;

  MT_FIELD_CONSTANT = FIELD_CONSTANT;
  MT_FIELD_UNPIVOT_TARGET = FIELD_UNPIVOT_TARGET;
  MT_FIELD_UNPIVOT_COLUMN = FIELD_UNPIVOT_COLUMN;

  constructor(public api: ApiService) {
    api.configuration.pipe(
      first(),
    ).subscribe((configuration) => {
      this.titleVisible = configuration.features.titleVisible !== false;
      this.titleEditable = configuration.features.titleEditable !== false;
    });
  }

  ngOnInit() {
    this.mapping = this.mapping || {};
    this.mapping.columnType = this.mapping.columnType || this.ct.name;
    this.mapping.title = this.mapping.title || this.ct.name;
    this.mapping.options = this.mapping.options || {};
    this.updateMappingOptions();
  }

  canExpand() {
    return (
      this.titleVisible ||
      this.ct.dataType === 'date' ||
      this.ct.dataType === 'boolean' ||
      this.ct.dataType === 'number' ||
      false
    );
  }

  set _mappingType(mt: string) {
    this.mappingType = mt;
    if (mt !== FIELD_CONSTANT) {
      this.constant = null;
      this.changed();
    }
  }

  get _mappingType() {
    return this.mappingType;
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

  changed() {
    setTimeout(() => {
      this.update.emit({ct: this.ct, mappingType: this.mappingType, mapping: this.mapping, constant: this.constant});
    }, 0);
  }

}
