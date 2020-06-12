import { Component, OnInit, OnDestroy } from '@angular/core';

import { StoreService } from '../store.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-step-extract',
  template: `
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

}
