import { Component, ComponentFactoryResolver, Inject, OnInit, Type, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReplaySubject } from 'rxjs';
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
              private componentFactoryResolver: ComponentFactoryResolver,
              @Inject(EXTRA_MAPPING) private extraMapping) {
    let defs = null;
    this.api.configuration.pipe(
      switchMap((configuration) => {
        defs = configuration.dataRecords || [];
        return this.activatedRoute.params;
      }),
      switchMap((params) => {
        const detectedName = params.name;
        for (const def of defs) {
          if (def.name === detectedName) {
            this.def = def;
            return this.api.queryDatarecords(detectedName);
          }
        }
      })
    )
    .subscribe((datarecords) => {
      this.datarecords = datarecords;
      this.listComponent.next(this.extraMapping[this.def.edit_component].list || DataRecordListInnerComponent);
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
