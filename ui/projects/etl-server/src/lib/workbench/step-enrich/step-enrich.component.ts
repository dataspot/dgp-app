import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { StoreService } from '../../store.service';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
  selector: 'etl-step-enrich',
  templateUrl: 'step-enrich.component.html',
  styleUrls: ['step-enrich.component.less']
})
export class StepEnrichComponent implements OnInit {

  @Input() params: any = null;
  fields = null;

  constructor(private store: StoreService) {}

  ngOnInit() {
    this.store.getConfig()
      .pipe(
        first()
      )
      .subscribe((config) => {
        const transformConfig = (
          config &&
          config.taxonomy &&
          config.taxonomy.settings &&
          config.taxonomy.settings['extra-config'] &&
          config.taxonomy.settings['extra-config'].metadata
        );
        if (transformConfig) {
          this.fields = transformConfig;
        }
      });
  }

}
