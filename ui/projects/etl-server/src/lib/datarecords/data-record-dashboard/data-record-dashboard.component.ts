import { Component, ComponentFactoryResolver, Inject, Input, OnInit, Type, ViewChild } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { ApiService } from '../../api.service';
import { EXTRA_MAPPING } from '../../config';
import { DataRecordEditAuxDirective } from '../../data-record-edit-aux.directive';
import { DataRecordDashboardInnerComponent } from '../data-record-dashboard-inner/data-record-dashboard-inner.component';

@Component({
  selector: 'app-data-record-dashboard',
  templateUrl: './data-record-dashboard.component.html',
  styleUrls: ['./data-record-dashboard.component.less']
})
export class DataRecordDashboardComponent implements OnInit {

  @Input() def;
  datarecords = [];
  dashComponent =  new ReplaySubject<Type<any>>(1);
  @ViewChild(DataRecordEditAuxDirective, { static: true }) inner: DataRecordEditAuxDirective;

  constructor(private api: ApiService, 
              private componentFactoryResolver: ComponentFactoryResolver,
              @Inject(EXTRA_MAPPING) private extraMapping) {
  }

  ngOnInit(): void {
    this.api.queryDatarecords(this.def.name)
        .subscribe((datarecords) => {
          this.datarecords = datarecords;
          const mapping = this.extraMapping[this.def.edit_component] || {}
          this.dashComponent.next(mapping.dashboard || DataRecordDashboardInnerComponent);
        });

    this.dashComponent.subscribe((listComponent) => {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(listComponent);

      const viewContainerRef = this.inner.viewContainerRef;
      viewContainerRef.clear();

      const componentRef = viewContainerRef.createComponent<any>(componentFactory);
      componentRef.instance.datarecords = this.datarecords;
      componentRef.instance.def = this.def;
    });
    
  }

}
