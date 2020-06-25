import { Component, OnInit, OnDestroy } from '@angular/core';

import { StoreService } from '../store.service';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

@Component({
  selector: 'app-step-mapping',
  templateUrl: 'step-mapping.component.html',
  styleUrls: ['step-mapping.component.less']
})
export class StepMappingComponent implements OnInit, OnDestroy {

  config: any = null;
  errors: any = [];
  badSample: any = {};
  subs: Subscription[] = [];
  changedStream = new Subject<void>();
  _mappingChanged = false;

  SAMPLE_SIZE = 5;

  constructor(private store: StoreService) {
    this.changedStream.pipe(
      debounceTime(5000)
    ).subscribe(() => {
      this.changed();
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

  ngOnInit() {
    this.subs.push(this.store.getConfig().subscribe(config => this.config = config));
    this.subs.push(this.store.getErrors().subscribe(errors => this.errors = errors));
    this.config.taxonomy = this.config.taxonomy || {};
  }

  set mappingChanged(value) {
    if (value) {
      this.changedStream.next(null);
    }
    this._mappingChanged = value;
  }

  get mappingChanged() {
    return this._mappingChanged;
  }

  changed() {
    this.mappingChanged = false;
    this.store.setConfig(this.config);
  }

  updateConstants(constants) {
    this.config.constants = constants;
    for (const constantTuple of constants) {
      console.log('CONSTANT', constantTuple);
      const constant = constantTuple[0];
      let selected = null;
      for (const mapping of this.config.model.mapping) {
        if (mapping.name === constant) {
          selected = mapping;
          break;
        }
      }
      if (!selected) {
        selected = {name: constant};
        this.config.model.mapping.push(selected);
      }
      for (const ct of this.config.taxonomy.columnTypes) {
        if (ct.title === constant) {
          selected.columnType = ct.name;
          break;
        }
      }
    }
    this.changed();
  }

  ngOnDestroy() {
    for (const s of this.subs) {
      s.unsubscribe();
    }
  }
}
