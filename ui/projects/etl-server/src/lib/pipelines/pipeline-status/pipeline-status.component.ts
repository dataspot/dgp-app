import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../api.service';
import { switchMap, first, filter } from 'rxjs/operators';
import { RolesService } from '../../roles.service';
import { AuthService } from 'dgp-oauth2-ng';
import dayjs from 'dayjs';

@Component({
  selector: 'etl-pipeline-status',
  templateUrl: './pipeline-status.component.html',
  styleUrls: ['./pipeline-status.component.less']
})
export class PipelineStatusComponent implements OnInit, OnDestroy {

  item: any = {status: {}};
  visible = false;
  userId = null;
  _t = dayjs;
  status = '';

  constructor(private route: ActivatedRoute, private api: ApiService, public roles: RolesService, public auth: AuthService) {
    this.auth.getUser().pipe(filter((x) => x && !!x.profile), first()).subscribe((user) => {
      this.userId = user.profile.id;
    });
    this.refresh();
  }

  refresh() {
    this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get('id') || '__non_existent__';
        return this.api.queryPipeline(id);
      })
    ).subscribe((pipeline) => {
      this.item = pipeline;
      if (this.item.status.status === 'running' && this.visible) {
        setTimeout(() => { this.refresh(); }, 1000);
      }
      this.status = (this.item.status && this.item.status.status === 'didnt-run' ? 'Pending for Approval' : this.item.status.status);
    });
  }

  ngOnInit() {
    this.visible = true;
  }

  ngOnDestroy() {
    this.visible = false;
  }

  canEdit() {
    return (this.item.owner === this.userId && this.roles._.pipelinesEditOwn) || this.roles._.pipelinesEditAll;
  }

  trigger() {
    this.api.triggerPipeline(this.item.id)
      .subscribe((result) => {
        this.refresh();
      });
  }

}
