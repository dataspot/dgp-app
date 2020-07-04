import { Component, OnInit } from '@angular/core';
import { StoreService } from '../store.service';
import { first, filter } from 'rxjs/operators';

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
  }

  processConfig(config) {
    this.mandatory_cts = [];
    this.optional_cts = [];
    const usedColumns = [];
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
      let mappingType = constant !== null ? 'constant' : (mapping ? mapping.name : '');
      if (mappingType !== 'constant' && mappingType !== '') {
        if (usedColumns.indexOf(mappingType) >= 0) {
          mappingType = '';
          delete mapping['name'];
        } else {
          usedColumns.push(mappingType);
        }
      }
      this.mapping[ct.name] = {ct, mapping, constant, mappingType};
      if (ct.mandatory) {
        this.mandatory_cts.push({ct, mapping, constant});
      } else {
        this.optional_cts.push({ct, mapping, constant});
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
    for (const _ct of this.config.taxonomy.columnTypes) {
      if (this.mapping[_ct.name]) {
        const entry = this.mapping[_ct.name];
        if (entry.mappingType !== 'constant') {
          mapping.push(Object.assign(entry.mapping, {name: entry.mappingType}));
        } else {
          mapping.push(Object.assign(entry.mapping, {name: entry.ct.title}));
          constants.push([entry.ct.title, entry.constant]);
        }
      }
    }
    this.config.model.mapping = mapping;
    this.config.constants = constants;
    this.processConfig(this.config);
    this.store.setConfig(this.config);
}

  ngOnInit() {
  }

}
