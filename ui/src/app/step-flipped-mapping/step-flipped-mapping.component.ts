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

  constructor(private store: StoreService) {
    this.store.getConfig().pipe(
      filter(config => config && config.taxonomy && config.taxonomy.columnTypes && config.taxonomy.columnTypes.length),
    ).subscribe(config => {
      if (!this.taxonomy_id !== config.taxonomy.id ) {
        this.processConfig(config);
        this.taxonomy_id = config.taxonomy.id;
      }
      console.log('CONFIG MAPPING', config.model ? config.model.mapping : null);
      this.config = config;
    });
  }

  processConfig(config) {
    console.log('GOT TX CONFIG', config);
    for (const ct of config.taxonomy.columnTypes) {
      let mapping = null;
      for (const _mapping of config.model.mapping) {
        if (_mapping.columnType === ct.name) {
          mapping = _mapping;
          break;
        }
      }
      if (ct.mandatory) {
        this.mandatory_cts.push({ct, mapping});
      } else {
        this.optional_cts.push({ct, mapping});
      }
    }
  }

  ngOnInit() {
  }

}
