import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ApiService } from './api.service';


function compare(obj1, obj2, prefix) {
  if (!obj1 || !obj2) {
    return false;
  }
  if (!prefix) {
    prefix = '';
  }

  try {
    // Loop through properties in object 1
    for (const p of Object.keys(obj1)) {
      // ignore properties starting with '_'
      if (p[0] === '_') { continue; }
      // Check property exists on both objects
      if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) { return false; }

      switch (typeof (obj1[p])) {
        // Deep compare objects
        case 'object':
          if (obj1[p]) {
            if (!compare(obj1[p], obj2[p], prefix + p + '.')) { return false; }
          } else {
            if (obj2[p]) {
              return false;
            }
          }
          break;
        // Compare values
        default:
          if (obj1[p] !== obj2[p]) {
            console.log('mismatch', prefix + p);
            return false;
          }
      }
    }

    // Check object 2 for any extra properties
    for (const p in obj2) {
      if (typeof (obj1[p]) === 'undefined') { return false; }
    }
  } catch (e) {
    console.log('error in', prefix, e);
  }
  return true;
}



@Injectable({
  providedIn: 'root'
})
export class StoreService {

  public BASE_CONFIG = {
    source: {
      path: '',
    },
    loader: {
    },
    constants: {}, model: {},
  };
  private _config = new BehaviorSubject<any>(Object.assign({}, this.BASE_CONFIG));
  private currentConfig = JSON.parse(JSON.stringify(this._config.getValue()));
  private _rows = new Subject<any>();
  private _rowcount = new Subject<any>();
  private _errors = new BehaviorSubject<any>([]);
  private _failure = new Subject<string>();
  private pipeline = null;

  constructor(private api: ApiService) {
    this._config.subscribe((config) => {
      console.log('GOT CONFIG, pipeline is', this.pipeline);
      if (this.pipeline) {
        this.pipeline.params.dgpConfig = this.currentConfig;
        this.api.savePipeline(this.pipeline)
          .subscribe(() => {
            console.log('SAVED CONFIGURATION');
          });
      }
    });
  }

  getPipelineId() {
    return this.pipeline && this.pipeline.id;
  }

  setPipelineId(pipelineId) {
    this.pipeline = null;
    if (pipelineId) {
      this.api.queryPipeline(pipelineId)
      .subscribe((result) => {
        this.pipeline = result;
        if (result && result.params && result.params.dgpConfig) {
          this.setConfig(result.params.dgpConfig);
        }
      });
    }
  }

  getConfig(): BehaviorSubject<any> {
    return this._config;
  }

  getRows(): Subject<any> {
    return this._rows;
  }

  getRowCount(): Subject<any> {
    return this._rowcount;
  }

  getErrors(): BehaviorSubject<any> {
    return this._errors;
  }

  getFailure(): Subject<string> {
    return this._failure;
  }

  newConfig() {
    this.setConfig(this.BASE_CONFIG);
  }

  setConfig(newConfig: any, result?: boolean) {
    if (!newConfig) {
      console.log('clearing configuration', newConfig);
      this._config.next(newConfig);
      return;
    }
    if (!compare(this.currentConfig, newConfig, null)) {
      newConfig['_result'] = !!result;
      this.currentConfig = JSON.parse(JSON.stringify(newConfig));
      console.log('setting new configuration', this.currentConfig);
      this._config.next(newConfig);
    } else {
      console.log('new configuration identical', this.currentConfig, newConfig);
    }
  }

  setErrors(newErrors: any) {
    console.log(newErrors);
    this._errors.next(newErrors);
  }

  addRow(row: any) {
    this._rows.next(row);
  }

  setRowCount(count: any) {
    this._rowcount.next(count);
  }
}
