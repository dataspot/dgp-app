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

  showPipelines(configuration) {
    const hasPipelines = configuration && configuration.kinds && configuration.kinds.filter(
      k => !k.admin || this._.pseudoAdmin
    ).length;
    return this._.pipelinesListPublic && hasPipelines;
  }

  showFiles(configuration) {
    return this._.filesListOwn && this.showPipelines(configuration);
  }

  showUsers(configuration) {
    return this._.usersList;
  }

  showTaxonomies(configuration) {
    const hasTaxonomies = configuration && configuration.kinds && configuration.kinds.filter(
      k => k.dgp && (!k.admin || this._.pseudoAdmin)
    ).length;
    return this._.taxonomyRead && hasTaxonomies;
  }

  showDatarecords(configuration) {
    return this._.datarecordReadAll || this._.datarecordReadOwn || this._.datarecordReadPublic
  }

}
