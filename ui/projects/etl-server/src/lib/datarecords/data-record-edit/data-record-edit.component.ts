import { Component, ComponentFactoryResolver, Inject, OnInit, Type, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, ReplaySubject } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { ApiService } from '../../api.service';
import { RolesService } from '../../roles.service';

import { EXTRA_MAPPING } from '../../config';
import { DataRecordEditInnerComponent } from '../data-record-edit-inner/data-record-edit-inner.component';
import { DataRecordEditAuxDirective } from '../../data-record-edit-aux.directive';

@Component({
  selector: 'app-data-record-edit',
  templateUrl: './data-record-edit.component.html',
  styleUrls: ['./data-record-edit.component.less']
})
export class DataRecordEditComponent implements OnInit {

  def: any = {};
  datarecord: any = {};
  editComponent = new ReplaySubject<Type<any>>(1);
  @ViewChild(DataRecordEditAuxDirective, { static: true }) inner: DataRecordEditAuxDirective;


  constructor(public api: ApiService, public roles: RolesService,
             private activatedRoute: ActivatedRoute,
             private componentFactoryResolver: ComponentFactoryResolver,
             @Inject(EXTRA_MAPPING) private extraMapping) {
    let datarecords = null;
    this.api.configuration.pipe(
      switchMap((configuration) => {
        datarecords = configuration.dataRecords || [];
        return this.activatedRoute.params;
      }),
      switchMap((params) => {
        const kind = params.name;
        const id = params.id;
        for (const def of datarecords) {
          if (def.name === kind) {
            this.def = def;
            if (id === 'new') {
              return of({value: {}});
            } else {
              return this.api.queryDatarecord(kind, id);
            }
          }
        }
      }),
      first()
    )
    .subscribe((datarecord) => {
      this.datarecord = datarecord.value;
      const mapping = this.extraMapping[this.def.edit_component] || {};
      this.editComponent.next(mapping.detail || DataRecordEditInnerComponent);
    });
    console.log('constructed DataRecordEditComponent!');
  }

  ngOnInit() {
    this.editComponent.subscribe((editComponent) => {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(editComponent);

      const viewContainerRef = this.inner.viewContainerRef;
      viewContainerRef.clear();

      const componentRef = viewContainerRef.createComponent<any>(componentFactory);
      componentRef.instance.datarecord = this.datarecord;
      componentRef.instance.def = this.def;
    });
  }

}
