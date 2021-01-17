import { Component, ComponentFactoryResolver, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, Type, ViewChild } from '@angular/core';
import { ApiService } from '../../api.service';
import { DataRecordEditAuxDirective } from '../../data-record-edit-aux.directive';
import { RolesService } from '../../roles.service';
import { EXTRA_MAPPING } from '../../config';
import { ReplaySubject, Subscription } from 'rxjs';
import { DataRecordUserInnerComponent } from '../data-record-user-inner/data-record-user-inner.component';

@Component({
  selector: 'lib-data-record-user',
  templateUrl: './data-record-user.component.html',
  styleUrls: ['./data-record-user.component.less']
})
export class DataRecordUserComponent implements OnInit, OnDestroy{

  @Input() def: any = {};
  @Input() record: any = {};
  @Output() updated = new EventEmitter<void>();

  @ViewChild(DataRecordEditAuxDirective, { static: true }) inner: DataRecordEditAuxDirective;
  sub: Subscription = null;

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
    this.sub = componentRef.instance.updated.subscribe(() => {
      this.updated.next();
    });
  }

  ngOnDestroy() {
    if (this.sub !== null) {
      this.sub.unsubscribe();
      this.sub = null;
    }
  }

}
