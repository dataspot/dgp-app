import { Component, OnInit, OnDestroy } from '@angular/core';
import { WorkbenchService } from '../workbench.service';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '../store.service';
import { switchMap, map } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { RolesService } from '../roles.service';

@Component({
  selector: 'app-dgp-workbench',
  templateUrl: 'dgp-workbench.component.html',
  styleUrls: ['dgp-workbench.component.less']
})
export class DgpWorkbenchComponent implements OnInit, OnDestroy {

  id = null;
  config = null;
  stage = 0;

  STAGE_SPECIFY_SOURCE = 0;
  STAGE_SOURCE_PARAMETERS = 10;
  STAGE_SELECT_TAXONOMY = 20;
  STAGE_MAPPING = 30;
  STAGE_METADATA = 40;

  complete: any = null;
  hasErrors = false;

  constructor(private route: ActivatedRoute, private workbench: WorkbenchService,
              private roles: RolesService, public store: StoreService,
              private api: ApiService, private router: Router) {
    this.route.paramMap.pipe(
      switchMap((params) => {
        this.id = params.get('id');
        return this.api.queryFiles(false);
      }),
    ).subscribe(() => {
      this.store.setPipelineId(this.id);
    });
    this.store.getConfig().subscribe((config) => {
      this.config = config;
      this.config.source = this.config.source || {};
      this.config.loader = this.config.loader || {};
      this.config.taxonomy = this.config.taxonomy || {};
      this.calculateStage(config);
    });

    this.store.getRows().pipe(
      map((row) => {
        if (row.index === -2 && row.kind === 2) {
          this.complete = !this.hasErrors;
        } else if (row.index === -1 && row.kind === 0) {
          this.complete = 'progress';
          this.hasErrors = false;
        } else if (row.errors && row.errors.length > 0) {
          this.hasErrors = true;
        }
      })
    ).subscribe(() => { console.log('collected sample!'); });

  }

  updateUrl(config) {
    this.store.setConfig(config ? Object.assign({}, this.store.BASE_CONFIG, config) : this.config);
  }

  calculateStage(config: any): any {
    this.stage = this.STAGE_SPECIFY_SOURCE;
    if (config.source && config.source.path) {
      this.stage = this.STAGE_SOURCE_PARAMETERS;
    }
    if (config.taxonomy && config.taxonomy.options) {
      this.stage = this.STAGE_SELECT_TAXONOMY;
    }
    if (config.taxonomy && config.taxonomy.id) {
      this.stage = this.STAGE_MAPPING;
    }
    if (config.mapping) { // TODO: use validation instead
      this.stage = this.STAGE_METADATA;
    }
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.store.setPipelineId(null);
  }

  finalize() {
    this.store.setConfig(this.config);
    if (this.roles._.pipelinesExecute && this.complete === true) {
      this.router.navigate(['/status/' + this.store.getPipelineId()]);
    } else {
      this.router.navigate(['/pipelines/']);
    }
  }

}
