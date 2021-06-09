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
  public ACTION_CUSTOM = 4;

  action: number = null;
  actionText: string = null;
  what: string = null;
  active = false;

  result = new Subject<boolean>();

  constructor() { }

  confirm(action, what, actionText?) {
    this.action = action;
    this.actionText = actionText;
    this.what = what;
    this.active = true;
    return this.result.pipe(
      first(),
      map((result) => {
        this.action = null;
        this.actionText = null;
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
