import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StoreService } from './store.service';
import { Observable, of, Subject, BehaviorSubject, from  } from 'rxjs';
import { switchMap, exhaustMap, map, filter, debounceTime } from 'rxjs/operators';
import { EventSourcePolyfill } from 'ng-event-source';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class WorkbenchService {

  private executionId = null;
  private SERVER: string;
  private CONFIGS = this.SERVER + '/configs';

  public configurations = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient,
              private store: StoreService,
              private api: ApiService) {

    this.SERVER = this.api.API_ENDPOINT;
    const events = (<Observable<any>>(this.store.getConfig()))
         .pipe(
            filter((x: any) => !!x),
            debounceTime(3000),
            switchMap((config: any) => this.storeConfig(config)),
            switchMap((response: any) => {
              this.executionId = response.uid;
              console.log('FETCHING EVENTS');
              this.store.addRow({
                kind: -1,
              });
              return this.fetchEvents(this.executionId);
            })
         );
    const that = this;
    const eventObserver = {
      config: null,
      next(event) {
        // console.log('EVENT', event);
        if (event.complete) {
        } else if (event.t) {
          if (event.t === 'c') {
            this.config = event.p;
            if (this.config) {
              const config = this.config;
              this.config = null;
              that.store.setConfig(config, true);
            }
          } else if (event.t === 'r') {
            if (event.i % 1000 === 0 || event.i <= 0) {
              console.log('ROW', event);
            }
            that.store.addRow({
              kind: event.j,
              index: event.i,
              data: event.p,
              errors: event.e
            });
            that.store.setRowCount({
              kind: event.j,
              index: event.i,
            });
          } else if (event.t === 'n') {
            if (event.i % 1000 === 0) {
              console.log('ROW', event);
            }
            that.store.setRowCount({
              kind: event.j,
              index: event.i,
            });
          } else if (event.t === 'd') {
            that.store.addRow({
              kind: event.j,
              index: -2,
            });
          } else if (event.t === 'e') {
            console.log('got error', event.c, event.p, event.e);
            that.store.setErrors(event.e);
          } else if (event.t === 'f') {
            console.log('got FAILURE', event.e);
            that.store.getFailure().next(event.e);
            // that.store.setErrors(event.e);
          }
        }
      },
      error() {
      }
    };
    events.subscribe(eventObserver);
  }

  storeConfig(config: any) {
    if (!config['_result']) {
      const suffix = this.executionId ? '?uid=' + this.executionId : '';
      console.log('OPT', this.api.httpOptions);
      return this.http.post(this.SERVER + '/config' + suffix, config, this.api.httpOptions);
    } else {
      return from([]);
    }
  }

  fetchEvents(executionId: string) {
    this.store.setErrors([]);
    this.store.getFailure().next(null);
    const observable = Observable.create(observer => {

      let eventSource;
      // this.error.emit(null);
      try {
        eventSource = new EventSourcePolyfill(this.SERVER + '/events/' + this.executionId, {
          heartbeatTimeout: 300000,
          errorOnTimeout: false,
          connectionTimeout: 300000,
          headers: this.api.httpOptions.headers,
        });
      } catch (e) {
        // this.error.emit(e.message);
        observer.error(e);
      }
      eventSource.onmessage = x => {
        if (x.data !== 'close') {
          try {
            const parsed: any = JSON.parse(x.data);
            observer.next(parsed);
          } catch (exception) {
            console.log('Warning - bad data received', x);
            throw exception;
          }
        } else {
          observer.next({complete: true});
          observer.complete();
          eventSource.close();
        }
      };
      eventSource.onerror = x => {
        console.log('ERROR', x);
        // this.error.emit(x.message);
        // observer.error(x);
        observer.next({complete: true});
        observer.complete();
      };

      return () => {
        if (eventSource) {
          eventSource.close();
        }
      };
    });
    return observable;
  }
}
