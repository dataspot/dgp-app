import { Component, OnInit, OnDestroy } from '@angular/core';

import { StoreService } from '../store.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-step-extract',
  template: `
    <app-step-extract-source [source]='config.source'
                             *ngIf='config.source'
                             (update)='store.setConfig($event ? {source:{path:$event}} : config)'>
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
    this.sub = this.store.getConfig().subscribe(config => this.config = config);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
