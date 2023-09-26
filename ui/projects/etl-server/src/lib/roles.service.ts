import { Injectable } from '@angular/core';

@Injectable()
export class RolesService {

  public _: any = {};

  constructor() { }

  setRoles(roles: any[]) {
    this._ = {};
    for (const role of roles) {
      this._[role] = true;
    }
  }

  showPipelines(configuration: any) {
    const hasPipelines = configuration && configuration.kinds && configuration.kinds.filter(
      (k: any) => !k.admin || this._.pseudoAdmin
    ).length;
    return this._.pipelinesListPublic && hasPipelines;
  }

  showFiles(configuration: any) {
    return this._.filesListOwn && this.showPipelines(configuration);
  }

  showUsers(configuration: any) {
    return this._.usersList;
  }

  showTaxonomies(configuration: any) {
    const hasTaxonomies = configuration && configuration.kinds && configuration.kinds.filter(
      (k: any) => k.dgp && (!k.admin || this._.pseudoAdmin)
    ).length;
    return this._.taxonomyRead && hasTaxonomies;
  }

  showDatarecords(configuration: any) {
    return this._.datarecordReadAll || this._.datarecordReadOwn || this._.datarecordReadPublic
  }

}
