import { Component, OnInit, OnDestroy } from '@angular/core';
import { StoreService } from '../store.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-step-enrich',
  template: `
    <p i18n>
      Loading taxonomy specific enrichments...
    </p>
    <app-extra-config-questions [questions]='questions'></app-extra-config-questions>
  `,
  styles: [
    `
        :host {
          padding: 10px;
          min-width: 50%;
        }
    `
      ]
})
export class StepEnrichComponent implements OnInit, OnDestroy {

  sub: Subscription = null;
  questions = [];

  constructor(private store: StoreService) {}

  ngOnInit() {
    this.sub = this.store.getConfig()
      .subscribe((config) => {
        const transformConfig = (
          config &&
          config.taxonomy &&
          config.taxonomy.settings &&
          config.taxonomy.settings['extra-config'] &&
          config.taxonomy.settings['extra-config'].transform
        );
        if (transformConfig) {
          this.questions = transformConfig;
        }
      });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
