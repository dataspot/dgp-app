import { Component, OnInit } from '@angular/core';
import { StoreService } from '../store.service';
import { first, filter } from 'rxjs/operators';

export const FIELD_CONSTANT = '  const  ';
export const FIELD_UNPIVOT_TARGET = '  upt  ';
export const FIELD_UNPIVOT_COLUMN = '  upc  ';

@Component({
  selector: 'app-step-flipped-mapping',
  templateUrl: './step-flipped-mapping.component.html',
  styleUrls: ['./step-flipped-mapping.component.less']
})
export class StepFlippedMappingComponent implements OnInit {

  config: any = null;
  taxonomy_id: string = null;
  mandatory_cts = [];
  optional_cts = [];
  mapping = {};
  badSample = {};
  unpivot_target = null;
  unpivot_columns = [];
  unpivot_fields = [];

  SAMPLE_SIZE = 5;
  FIELD_UNPIVOT_DUMMY = '  updummy  ';

  constructor(private store: StoreService) {
    this.store.getConfig().pipe(
      filter(config => config && config.taxonomy && config.taxonomy.columnTypes && config.taxonomy.columnTypes.length),
    ).subscribe(config => {
      if (this.taxonomy_id !== config.taxonomy.id ) {
        console.log('GOT TX CONFIG', this.taxonomy_id, '!==', config.taxonomy.id, config);
        this.processConfig(config);
        this.taxonomy_id = config.taxonomy.id;
      }
      console.log('CONFIG MAPPING', config.model ? config.model.mapping : null);
      this.config = config;
    });

    this.store.getRows().subscribe((row) => {
      if (row.index === -1) {
        this.badSample = {};
      } else {
        if (row.index >= 0) {
          if (row.kind === 1) {
            if (row.errors_field) {
              const field = row.errors_field;
              this.badSample[field] = this.badSample[field] || [];
              const list = this.badSample[field];
              if (list.length < this.SAMPLE_SIZE) {
                const value = this.store.strize(row.data[field]);
                if (list.map((x) => x.value).indexOf(value) < 0) {
                  const idx = row.index;
                  list.push({idx, value});
                }
              }
            }
          }
        }
      }
    });
  }

  processConfig(config) {
    this.mandatory_cts = [];
    this.optional_cts = [];
    this.unpivot_target = null;
    this.unpivot_columns = [];
    this.unpivot_fields = [];

    // Mapping of mapping.name -> ct.title
    const mNameToCtTitle = {};
    for (const mapping of config.model.mapping) {
      if (!mapping.columnType) {
        continue;
      }
      for (const ct of config.taxonomy.columnTypes) {
        if (mapping.columnType === ct.name) {
          mNameToCtTitle[mapping.name] = ct.title;
        }
      }
    }
    // Normalize pivoting parameters
    const usedColumns = [];
    for (const mapping of config.model.mapping) {
      if (mapping.normalizeTarget) {
        this.unpivot_target = mNameToCtTitle[mapping.normalizeTarget] || mapping.normalizeTarget;
        const _normalize = {}; 
        for (const column of Object.keys(mapping.normalize)) {
          const _column = mNameToCtTitle[column] || column;
          if (this.unpivot_columns.indexOf(_column) < 0) {
            this.unpivot_columns.push(_column);
          }
          _normalize[_column] = mapping.normalize[column];
        }
        this.unpivot_fields.push({field_name: mapping.name, mapping: _normalize});
      }
    }
    console.log('UNPIVOT: target', this.unpivot_target, 'columns', this.unpivot_columns, 'fields', this.unpivot_fields);
    for (const ct of config.taxonomy.columnTypes) {
      let mapping: any = {};
      let constant = null;
      for (const _mapping of config.model.mapping) {
        if (_mapping.columnType === ct.name) {
          mapping = _mapping;
          break;
        }
      }
      for (const extra of config.constants) {
        if (extra[0] === ct.title) {
          constant = extra[1];
        }
      }
      let mappingType = '';
      if (constant !== null) {
        mappingType = FIELD_CONSTANT;
      } else if (this.unpivot_columns.indexOf(ct.title) >= 0) {
        mappingType = FIELD_UNPIVOT_COLUMN;
      } else if (this.unpivot_target && ct.title === this.unpivot_target) {
        mappingType = FIELD_UNPIVOT_TARGET;
      } else if (mapping.name) {
        mappingType = mapping.name;
      }
      if (mappingType !== FIELD_CONSTANT && mappingType !== FIELD_UNPIVOT_TARGET &&
          mappingType !== FIELD_UNPIVOT_COLUMN && mappingType !== '') {
        if (usedColumns.indexOf(mappingType) >= 0) {
          mappingType = '';
          delete mapping['name'];
        } else {
          usedColumns.push(mappingType);
        }
      }
      this.mapping[ct.name] = {ct, mapping, constant, mappingType};
      if (ct.mandatory) {
        this.mandatory_cts.push({ct, mapping, constant, mappingType});
      } else {
        this.optional_cts.push({ct, mapping, constant, mappingType});
      }
    }
  }

  updateMapping(entry) {
    this.mapping[entry.ct.name] = entry;
    this.recreateMappings();
  }

  recreateMappings() {
    const mapping = [];
    const constants = [];
    let unpivot_target = null;
    const unpivot_columns = [];
    for (const _ct of this.config.taxonomy.columnTypes) {
      if (this.mapping[_ct.name]) {
        const entry = this.mapping[_ct.name];
        if (entry.mappingType === FIELD_CONSTANT) {
          mapping.push(Object.assign(entry.mapping, {name: entry.ct.title}));
          constants.push([entry.ct.title, entry.constant]);
        } else if (entry.mappingType === FIELD_UNPIVOT_TARGET) {
          unpivot_target = entry.ct.title;
          mapping.push(Object.assign(entry.mapping, {name: unpivot_target}));
        } else if (entry.mappingType === FIELD_UNPIVOT_COLUMN) {
          unpivot_columns.push(_ct.title);
          mapping.push(Object.assign(entry.mapping, {name: entry.ct.title}));
        } else if (entry.mappingType === '' ) {
        } else {
          mapping.push(Object.assign(entry.mapping, {name: entry.mappingType}));
        }
      }
    }
    // Add unpivot columns mapping
    if (unpivot_target !== null) {
      if (this.unpivot_fields.length === 0) {
        this.unpivot_fields.push({field_name: this.FIELD_UNPIVOT_DUMMY, mapping: {}});
      }
      for (const unpivot_field of this.unpivot_fields) {
        for (const column of unpivot_columns) {
          unpivot_field.mapping[column] = unpivot_field.mapping[column] || '';
        }
        if (unpivot_field.field_name) {
          mapping.push({
            name: unpivot_field.field_name,
            normalizeTarget: unpivot_target,
            normalize: unpivot_field.mapping
          });
        }
      }
    }

    console.log('RECREATED MAPPING:', mapping);
    this.config.model.mapping = mapping;
    this.config.constants = constants;
    this.processConfig(this.config);
    this.store.setConfig(this.config);
  }

  add_unpivot_field(name) {
    console.log('add_unpivot_field', name);
    this.unpivot_fields = this.unpivot_fields.filter((x) => x.field_name !== name);
    this.unpivot_fields.push({
      field_name: name,
      mapping: {}
    });
    this.recreateMappings();
  }

  delete_unpivot_field(name) {
    this.unpivot_fields = this.unpivot_fields.filter((x) => x.field_name !== name);
    this.recreateMappings();
  }

  ngOnInit() {
  }

}
