import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { first, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConfirmerService {

  public ACTION_DELETE_USER = 0;
  public ACTION_DELETE_TASK = 1;
  public ACTION_DELETE_FILE = 2;
  public ACTION_DELETE_DATARECORD = 3;

  action: number = null;
  what: string = null;
  active = false;

  result = new Subject<boolean>();

  constructor() { }

  confirm(action, what) {
    this.action = action;
    this.what = what;
    this.active = true;
    return this.result.pipe(
      first(),
      map((result) => {
        this.action = null;
        this.what = null;
        this.active = false;
        return result;
      })
    );
  }

  choose(result) {
    this.result.next(result);
  }
}
