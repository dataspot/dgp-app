import { Component, OnInit, OnDestroy } from '@angular/core';
import { StoreService } from '../store.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-step-publish',
  template: `
    <app-extra-config-questions [questions]='questions'></app-extra-config-questions>
    <a class='btn btn-primary' (click)='finalize()' i18n>
      Finalize Configuration
    </a>
  `,
  styles: [`
    :host {
      padding: 20px;
      min-width: 50%;
    }
  `]
})
export class StepPublishComponent implements OnInit, OnDestroy {

  config: any = null;
  sub: Subscription = null;
  questions = [];

  constructor(private store: StoreService, private router: Router) {}

  ngOnInit() {
    this.sub = this.store.getConfig()
      .subscribe((config) => {
        const publishConfig = (
          config &&
          config.taxonomy &&
          config.taxonomy.settings &&
          config.taxonomy.settings['extra-config'] &&
          config.taxonomy.settings['extra-config'].publish
        );
        if (publishConfig) {
          this.questions = publishConfig;
        }
        this.config = config;
      });
  }

  finalize() {
    // this.config['publish'] = {allowed: true};
    this.store.setConfig(this.config);
    this.router.navigate(['/status/' + this.store.getPipelineId()]);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
