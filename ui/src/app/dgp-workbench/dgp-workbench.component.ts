import { Component, OnInit, OnDestroy } from '@angular/core';
import { WorkbenchService } from '../workbench.service';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '../store.service';
import { switchMap } from 'rxjs/operators';
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
  params = null;
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
      switchMap(() => {
        return this.store.setPipelineId(this.id);
      })
    ).subscribe((pipeline) => {
      this.params = pipeline.params;
      console.log('got pipeline', this.params);
    });
    this.store.getConfig().subscribe((config) => {
      this.config = config;
      this.config.source = this.config.source || {};
      this.config.loader = this.config.loader || {};
      this.config.taxonomy = this.config.taxonomy || {};
      setTimeout(() => {
        this.calculateStage(config);
      }, 0);
    });

    this.store.getRows().subscribe((row) => {
      if (row.index === -2) {
        if (this.hasErrors) {
          this.complete = 'errors';
        } else {
          this.complete = row.kind === 2 ? 'complete' : 'incomplete';
        }
      } else if (row.kind === -1) {
        this.complete = 'progress';
        this.hasErrors = false;
      } else if (row.errors && row.errors.length > 0) {
        this.hasErrors = true;
      }
    });

  }

  get status() {
    if ((!this.config.source || !this.config.source.path) &&
        (!this.config.loader || !this.config.loader.filename)) {
      return 'no-source';
    }
    if (this.complete === null) {
      return 'progress';
    } else {
      return this.complete;
    }
  }

  updateUrl(config) {
    this.store.setConfig(config ? Object.assign({}, this.store.BASE_CONFIG, config) : this.config);
  }

  calculateStage(config: any): any {
    this.stage = this.STAGE_SPECIFY_SOURCE;
    if (config.source && config.source.path && config.structure) {
      this.stage = this.STAGE_SOURCE_PARAMETERS;
    }
    if (config.taxonomy && config.taxonomy.options) {
      this.stage = this.STAGE_SELECT_TAXONOMY;
    }
    if (config.taxonomy && config.taxonomy.id) {
      this.stage = this.STAGE_MAPPING;
    }
    if (config.model && config.model.mapping) { // TODO: use validation instead
      this.stage = this.STAGE_METADATA;
    }
    console.log('CALCULATE STAGE:', this.stage, config);
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.store.setPipelineId(null).subscribe(() => {
      console.log('set pipeline to null');
    });
  }

  finalize(submit) {
    submit = !!submit;
    this.config.__submit = submit;
    this.store.setConfig(this.config);
    this.config.__submit = false;
    if (this.roles._.pipelinesExecute && this.status === 'complete') {
      this.router.navigate(['/status/' + this.store.getPipelineId()]);
    } else {
      this.router.navigate(['/pipelines/']);
    }
  }

}
