import { AfterViewChecked, AfterViewInit, Component, ComponentFactoryResolver, OnInit, Type, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, ReplaySubject } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { ConfirmerService } from '../confirmer.service';
import { RolesService } from '../roles.service';

import { extraMapping } from '../extras/extras';
import { DataRecordEditInnerComponent } from '../data-record-edit-inner/data-record-edit-inner.component';
import { DataRecordEditAuxDirective } from '../data-record-edit-aux.directive';

@Component({
  selector: 'app-data-record-edit',
  templateUrl: './data-record-edit.component.html',
  styleUrls: ['./data-record-edit.component.less']
})
export class DataRecordEditComponent implements OnInit {

  def: any = {};
  datarecord: any = {};
  kind = '';
  editComponent =  new ReplaySubject<Type<any>>(1);
  @ViewChild(DataRecordEditAuxDirective, {}) inner: DataRecordEditAuxDirective;


  constructor(public api: ApiService, public roles: RolesService,
             private activatedRoute: ActivatedRoute, private router: Router, private confirmer: ConfirmerService,
             private componentFactoryResolver: ComponentFactoryResolver) {
    let datarecords = null;
    this.api.configuration.pipe(
      switchMap((configuration) => {
        datarecords = configuration.dataRecords || [];
        return this.activatedRoute.params;
      }),
      switchMap((params) => {
        this.kind = params.name;
        const id = params.id;
        for (const def of datarecords) {
          if (def.name === this.kind) {
            this.def = def;
            this.editComponent.next(extraMapping[def.edit_component] || DataRecordEditInnerComponent);
            if (id === 'new') {
              return of({value: {}});
            } else {
              return this.api.queryDatarecord(this.kind, id);
            }
          }
        }
      }),
      first()
    )
    .subscribe((datarecord) => {
      this.datarecord = datarecord.value;
    });
    console.log('constructed DataRecordEditComponent!');
  }

  ngOnInit() {
    console.log(this.inner);
    this.editComponent.subscribe((editComponent) => {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(editComponent);

      const viewContainerRef = this.inner.viewContainerRef;
      viewContainerRef.clear();

      const componentRef = viewContainerRef.createComponent<any>(componentFactory);
      componentRef.instance.datarecord = this.datarecord;
      componentRef.instance.def = this.def;
    });
  }

  _save() {
    this.datarecord.id = this.datarecord.id || this.datarecord[this.def.id];
    return this.api.saveDatarecord(this.kind, this.datarecord);
  }

  save() {
    this._save()
        .subscribe((result) => {
          if (result.id) {
            this.router.navigate(['/datarecords/', this.kind]);
          } else {
            console.log('Failed to SAVE Datarecord!', this.kind);
          }
        });
  }
}
