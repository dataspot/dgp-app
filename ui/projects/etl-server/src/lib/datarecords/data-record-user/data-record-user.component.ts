import { Component, ComponentFactoryResolver, Inject, OnInit, Type, ViewChild } from '@angular/core';
import { ApiService } from 'dist/etl-server/lib/api.service';
import { DataRecordEditAuxDirective } from 'dist/etl-server/lib/data-record-edit-aux.directive';
import { EXTRA_MAPPING, RolesService } from 'etl-server';
import { ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DataRecordUserInnerComponent } from '../data-record-user-inner/data-record-user-inner.component';

@Component({
  selector: 'lib-data-record-user',
  templateUrl: './data-record-user.component.html',
  styleUrls: ['./data-record-user.component.less']
})
export class DataRecordUserComponent implements OnInit {

  def: any = {};
  record: any = {};
  editComponent =  new ReplaySubject<Type<any>>(1);
  @ViewChild(DataRecordEditAuxDirective, { static: true }) inner: DataRecordEditAuxDirective;

  constructor(public api: ApiService, public roles: RolesService,
              private componentFactoryResolver: ComponentFactoryResolver,
              @Inject(EXTRA_MAPPING) private extraMapping) {}

  ngOnInit(): void {
    const editComponent = this.extraMapping[this.def.edit_component].user || DataRecordUserInnerComponent;
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(editComponent);

    const viewContainerRef = this.inner.viewContainerRef;
    viewContainerRef.clear();

    const componentRef = viewContainerRef.createComponent<any>(componentFactory);
    componentRef.instance.datarecord = this.record;
    componentRef.instance.def = this.def;
  }

}
