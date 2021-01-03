import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RolesService {

  public _: any = {};

  constructor() { }

  setRoles(roles) {
    this._ = {};
    for (const role of roles) {
      this._[role] = true;
    }
  }
}
