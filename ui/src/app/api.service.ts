import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  public pipelines = new BehaviorSubject<any[]>([]);
  public configuration = new ReplaySubject(1);
  public currentConfig: any = null;

  API_ENDPOINT = '//localhost:5000/api';

  constructor(private http: HttpClient) {
    this.getConfiguration();
  }

  createMap(obj, field, target) {
    const ret = {};
    for (const item of obj[field]) {
      ret[item.name] = item;
    }
    obj[target] = ret;
  }

  getConfiguration() {
    this.http.get(`${this.API_ENDPOINT}/configuration`)
      .subscribe((result) => {
        const configuration = result['result'];
        this.createMap(configuration, 'kinds', 'kinds_map');
        this.createMap(configuration, 'schedules', 'schedules_map');
        this.configuration.next(configuration);
        this.currentConfig = configuration;
      });
  }

  queryPipelines() {
    this.configuration.pipe(
      switchMap(() => this.http.get(`${this.API_ENDPOINT}/pipelines`)),
      map((result: any) => {
        if (result.success) {
          return result['result'];
        }
        return [];
      })
    ).subscribe((pipelines) => {
      console.log('pipelines', pipelines);
      for (const x of pipelines) {
        x['params'] = x['params'] || {};
        x['status'] = x['status'] || {};
      }
      this.pipelines.next(pipelines);
    });
  }

  queryPipeline(id: string) {
    return this.configuration.pipe(
      switchMap(() => this.http.get(`${this.API_ENDPOINT}/pipeline/${id}`)),
      map((result: any) => {
        if (result.success) {
          return result['result'];
        }
        return {};
      })
    );
  }

  savePipeline(pipeline: any) {
    return this.http.post(`${this.API_ENDPOINT}/pipeline`, pipeline)
      .pipe(
        map((result: any) => {
          if (result.success) {
            this.queryPipelines();
            return result['result'];
          }
          return {};
        })
      );
  }

  deletePipeline(id: any) {
    return this.http.delete(`${this.API_ENDPOINT}/pipeline/${id}`)
      .pipe(
        map((result: any) => {
          if (result.success) {
            this.queryPipelines();
          }
          return result.success;
        })
      );
  }

  triggerPipeline(id: any) {
    return this.http.post(`${this.API_ENDPOINT}/pipeline/start/${id}`, {})
      .pipe(
        map((result: any) => {
          if (result.success) {
            this.queryPipelines();
          }
          return result.success;
        })
      );
  }


}
