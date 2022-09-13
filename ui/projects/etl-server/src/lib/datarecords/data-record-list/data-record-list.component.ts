import { Component, ComponentFactoryResolver, Inject, OnInit, Type, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { from, ReplaySubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ApiService } from '../../api.service';
import { EXTRA_MAPPING } from '../../config';
import { DataRecordEditAuxDirective } from '../../data-record-edit-aux.directive';
import { RolesService } from '../../roles.service';
import { DataRecordListInnerComponent } from '../data-record-list-inner/data-record-list-inner.component';

@Component({
  selector: 'app-data-record-list',
  templateUrl: './data-record-list.component.html',
  styleUrls: ['./data-record-list.component.less']
})
export class DataRecordListComponent implements OnInit {

  datarecords = [];
  def: any = {};
  listComponent =  new ReplaySubject<Type<any>>(1);
  @ViewChild(DataRecordEditAuxDirective, { static: true }) inner: DataRecordEditAuxDirective;

  constructor(public api: ApiService, public roles: RolesService, private activatedRoute: ActivatedRoute,
              private componentFactoryResolver: ComponentFactoryResolver, private router: Router,
              @Inject(EXTRA_MAPPING) private extraMapping: any) {
    let defs: any[] = [];
    this.api.configuration.pipe(
      switchMap((configuration) => {
        defs = configuration.dataRecords || [];
        return this.activatedRoute.params;
      }),
      switchMap((params: any) => {
        const detectedName = params.name;
        for (const def of defs) {
          if (def.name === detectedName) {
            const mapping = this.extraMapping[def.edit_component] || {};
            if (mapping.list === false || (def.admin && !this.roles._.pseudoAdmin)) {
              this.router.navigate(['/']);
              return from([]);
            }
            this.def = def;
            return this.api.queryDatarecords(detectedName);
          }
        }
        return from([]);
      })
    )
    .subscribe((datarecords) => {
      this.datarecords = datarecords;
      const mapping = this.extraMapping[this.def.edit_component] || {};
      this.listComponent.next(mapping.list || DataRecordListInnerComponent);
    });
  }

  ngOnInit() {
    this.listComponent.subscribe((listComponent) => {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(listComponent);

      const viewContainerRef = this.inner.viewContainerRef;
      viewContainerRef.clear();

      const componentRef = viewContainerRef.createComponent<any>(componentFactory);
      componentRef.instance.datarecords = this.datarecords;
      componentRef.instance.def = this.def;
    });
  }

}
