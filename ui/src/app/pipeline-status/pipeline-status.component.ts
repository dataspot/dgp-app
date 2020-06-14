import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../api.service';
import { switchMap } from 'rxjs/operators';
import * as moment from 'moment';
import { RolesService } from '../roles.service';

@Component({
  selector: 'app-pipeline-status',
  templateUrl: './pipeline-status.component.html',
  styleUrls: ['./pipeline-status.component.less']
})
export class PipelineStatusComponent implements OnInit, OnDestroy {

  item: any = {status: {}};
  visible = false;
  _moment: any;

  constructor(private route: ActivatedRoute, private api: ApiService, public roles: RolesService) {
    this.refresh();
    this._moment = moment;
  }

  refresh() {
    this.route.paramMap.pipe(
      switchMap((params) => {
        return this.api.queryPipeline(params.get('id'));
      })
    ).subscribe((pipeline) => {
      this.item = pipeline;
      if (this.item.status.status === 'running' && this.visible) {
        setTimeout(() => { this.refresh(); }, 1000);
      }
    });
  }

  ngOnInit() {
    this.visible = true;
  }

  ngOnDestroy() {
    this.visible = false;
  }

  trigger() {
    this.api.triggerPipeline(this.item.id)
      .subscribe((result) => {
        this.refresh();
      });
  }

}
