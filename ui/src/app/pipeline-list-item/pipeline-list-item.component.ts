import { Component, OnInit, Input } from '@angular/core';
import { ApiService } from '../api.service';
import { RolesService } from '../roles.service';
import { AuthService } from 'budgetkey-ng2-auth';

@Component({
  selector: 'app-pipeline-list-item',
  templateUrl: './pipeline-list-item.component.html',
  styleUrls: ['./pipeline-list-item.component.less']
})
export class PipelineListItemComponent implements OnInit {

  @Input() item: any;

  userId: string = null;

  constructor(public api: ApiService, public roles: RolesService, public auth: AuthService) {
    this.auth.getUser().subscribe((user) => {
      this.userId = user.profile.id;
    });
  }

  ngOnInit() {
    console.log('ITEM', this.item);
    this.item.status = this.item.status || {status: 'Didn\'t run'};
  }

  canEdit() {
    console.log('canEdit?', this.item.name, this.item.owner, this.userId);
    return this.item.owner === this.userId || this.roles._.pipelinesEditAll;
  }

}
