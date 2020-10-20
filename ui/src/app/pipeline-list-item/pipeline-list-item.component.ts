import { Component, OnInit, Input } from '@angular/core';
import { ApiService } from '../api.service';
import { RolesService } from '../roles.service';
import { AuthService } from 'dgp-oauth2-ng';
import { first, filter, switchMap } from 'rxjs/operators';
import { ConfirmerService } from '../confirmer.service';

@Component({
  selector: 'app-pipeline-list-item',
  templateUrl: './pipeline-list-item.component.html',
  styleUrls: ['./pipeline-list-item.component.less']
})
export class PipelineListItemComponent implements OnInit {

  @Input() item: any;

  status = '';
  userId: string = null;

  constructor(public api: ApiService, public roles: RolesService,
              public auth: AuthService, private confirmer: ConfirmerService) {
    this.auth.getUser().pipe(filter((x) => !!x.profile), first()).subscribe((user) => {
      this.userId = user.profile.id;
    });
  }

  ngOnInit() {
    console.log('ITEM', this.item);
    this.status = (this.item.status && this.item.status.status === 'didnt-run' ? 'Pending' : this.item.status.status)
  }

  canEdit() {
    return (this.item.owner === this.userId && this.roles._.pipelinesEditOwn) || this.roles._.pipelinesEditAll;
  }

  canDelete() {
    return (this.item.owner === this.userId && this.roles._.pipelinesDeleteOwn) || this.roles._.pipelinesDeleteAll;
  }

  delete(e) {
    console.log('DELETING', this.item);
    this.confirmer.confirm(this.confirmer.ACTION_DELETE_TASK, this.item.name)
      .pipe(
        filter((x) => x),
        switchMap(() => this.api.deletePipeline(this.item.id))
      ).subscribe((result) => {
          if (!result) {
            console.log('Failed to DELETE!');
          }
        });
    e.preventDefault();
    return false;
  }

}
