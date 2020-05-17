import { Component, OnInit, OnDestroy } from '@angular/core';

import { StoreService } from '../store.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-step-extract',
  template: `
    <app-step-extract-source [source]='config.source'
                             [loader]='config.loader'
                             *ngIf='config.source'
                             (update)='updateUrl($event)'>
    </app-step-extract-source>
    <app-step-extract-structure [structure]='config.structure'
                                *ngIf='config.structure'
                                (change)='store.setConfig(config)'>
    </app-step-extract-structure>
  `,
  styles: [
`
    :host {
      padding: 10px;
    }
`
  ]
})
export class StepExtractComponent implements OnInit, OnDestroy {

  config: any = null;
  sub: Subscription = null;

  constructor(private store: StoreService) { }

  ngOnInit() {
    this.sub = this.store.getConfig().subscribe(config => {
      this.config = config;
      this.config.source = this.config.source || {};
      this.config.loader = this.config.loader || {};
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  updateUrl(config) {
    console.log('UPDATE, got config', config);
    if (config) {
      console.log('UPDATE, new config', Object.assign({}, config));
    }

    this.store.setConfig(config ? Object.assign({}, this.store.BASE_CONFIG, config) : this.config);
  }
}
