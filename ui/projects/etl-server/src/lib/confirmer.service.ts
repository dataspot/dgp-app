import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { first, map } from 'rxjs/operators';

@Injectable()
export class ConfirmerService {

  public ACTION_DELETE_USER = 0;
  public ACTION_DELETE_TASK = 1;
  public ACTION_DELETE_FILE = 2;
  public ACTION_DELETE_DATARECORD = 3;
  public ACTION_EXECUTE_ALL = 4;
  public ACTION_CUSTOM = 5;

  action: number | null = null;
  actionText: string | null = null;
  what: string | null = null;
  active = false;

  result = new Subject<boolean>();

  constructor() { }

  confirm(action: number, what: string | null, actionText: string | null = null) {
    this.action = action;
    this.actionText = actionText || null;
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

  choose(result: boolean) {
    this.result.next(result);
  }
}
