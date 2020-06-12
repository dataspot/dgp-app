import { Component, OnInit, OnDestroy } from '@angular/core';

import { StoreService } from '../store.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-step-mapping',
  template: `
    <h2 class='workbench-subtitle' i18n>Column Mapping</h2>
    <ng-container *ngIf='errors.length > 0'>
      <h3 class='workbench-subsubtitle' i18n>Missing Mappings:</h3>
      <div class='missing'>
        <span>
          <ng-container *ngFor='let error of errors' >
            <span *ngIf='error[0] === 1' [title]='error[1].description'>
              {{ error[1].title }}
            </span>
          </ng-container>
        </span>
      </div>
    </ng-container>
    <h3 class='workbench-subsubtitle' i18n>Constants:</h3>
    <app-extendable-keyvalue-list
        [dataList]='config.constants || []'
        [taxonomy]='config.taxonomy'
        (updateList)='updateConstants($event)'
    ></app-extendable-keyvalue-list>
    <ng-container *ngIf='config.model && config.taxonomy'>
      <h3 class='workbench-subsubtitle'>
        <span i18n>Mapping:</span><br/>
        <button class='btn btn-outline-success btn-sm theme-primary-dark-fg theme-secondary-bg'
                *ngIf='mappingChanged' (click)='changed()' i18n>Update</button>
      </h3>
      <app-step-mapping-field
        *ngFor='let mapping of config.model.mapping'
        [mapping]='mapping'
        [taxonomy]='config.taxonomy'
        (change)='mappingChanged = true'
      >
      </app-step-mapping-field>
    </ng-container>
  `,
  styles: [
    `
        .missing span {
          display: flex;
          flex-flow: row;
        }

        .missing span span {
          font-size: 12px;
          list-style: none;
          display: block;
          padding: 1px 15px;
          margin: 0px 10px;
          margin-start: 0;
          border: solid 1px #400;
          border-radius: 10px;
          background-color: #fcc;
        }

        app-extendable-keyvalue-list {
          width: 100%;
          max-width: 60vw;
        }

        .workbench-subsubtitle {
          display: flex;
          flex-flow: row;
          align-items: center;
        }

        .workbench-subsubtitle button {
          margin: 0 20px;
          cursor: pointer;
        }

    `
      ]
})
export class StepMappingComponent implements OnInit, OnDestroy {

  config: any = null;
  errors: any = [];
  subs: Subscription[] = [];
  mappingChanged = false;

  constructor(private store: StoreService) { }

  ngOnInit() {
    this.subs.push(this.store.getConfig().subscribe(config => this.config = config));
    this.subs.push(this.store.getErrors().subscribe(errors => this.errors = errors));
    this.config.taxonomy = this.config.taxonomy || {};
  }

  changed() {
    this.mappingChanged = false;
    this.store.setConfig(this.config);
  }

  updateConstants(constants) {
    this.config.constants = constants;
    for (const constantTuple of constants) {
      console.log('CONSTANT', constantTuple);
      const constant = constantTuple[0];
      let selected = null;
      for (const mapping of this.config.model.mapping) {
        if (mapping.name === constant) {
          selected = mapping;
          break;
        }
      }
      if (!selected) {
        selected = {name: constant};
        this.config.model.mapping.push(selected);
      }
      for (const ct of this.config.taxonomy.columnTypes) {
        if (ct.title === constant) {
          selected.columnType = ct.name;
          break;
        }
      }
    }
    this.changed();
  }

  ngOnDestroy() {
    for (const s of this.subs) {
      s.unsubscribe();
    }
  }
}
