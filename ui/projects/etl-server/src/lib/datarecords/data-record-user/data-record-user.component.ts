import { AfterViewInit, Component, ComponentFactoryResolver, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, Type, ViewChild } from '@angular/core';
import { ApiService } from '../../api.service';
import { DataRecordEditAuxDirective } from '../../data-record-edit-aux.directive';
import { RolesService } from '../../roles.service';
import { EXTRA_MAPPING } from '../../config';
import { ReplaySubject, Subscription } from 'rxjs';
import { DataRecordUserInnerComponent } from '../data-record-user-inner/data-record-user-inner.component';
import { delay, first } from 'rxjs/operators';

@Component({
  selector: 'etl-data-record-user',
  templateUrl: './data-record-user.component.html',
  styleUrls: ['./data-record-user.component.less']
})
export class DataRecordUserComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() def: any = {};
  @Input() record: any = {};
  @Output() updated = new EventEmitter<void>();

  editComponent = new ReplaySubject<Type<any>>(1);
  @ViewChild(DataRecordEditAuxDirective, { static: true }) inner: DataRecordEditAuxDirective;
  sub: Subscription | null = null;

  constructor(public api: ApiService, public roles: RolesService,
              // private componentFactoryResolver: ComponentFactoryResolver,
              @Inject(EXTRA_MAPPING) private extraMapping: any) {}

  ngOnInit(): void {
    const mapping = this.extraMapping[this.def.edit_component] || {};
    const component = mapping.user || DataRecordUserInnerComponent;
    this.editComponent.next(component);
  }

  ngAfterViewInit() {
    this.editComponent.pipe(first(),delay(0)).subscribe((editComponent) => {
      // const componentFactory = this.componentFactoryResolver.resolveComponentFactory(editComponent);

      const viewContainerRef = this.inner.viewContainerRef;
      viewContainerRef.clear();
  
      const componentRef = viewContainerRef.createComponent(editComponent);
      componentRef.instance.datarecord = this.record;
      componentRef.instance.def = this.def;
      this.sub = componentRef.instance.updated.subscribe(() => {
        console.log('data-record-user updated');
        this.updated.next();
      });
    });
  }

  ngOnDestroy() {
    if (this.sub !== null) {
      this.sub.unsubscribe();
      this.sub = null;
    }
  }

}
