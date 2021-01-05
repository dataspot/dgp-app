import { Component, OnInit } from '@angular/core';
import { AuthService } from 'dgp-oauth2-ng';
import { first } from 'rxjs/operators';
import { ApiService } from '../../api.service';
import { RolesService } from '../../roles.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent implements OnInit {

  profile = null;
  configuration: any;

  constructor(public auth: AuthService, private api: ApiService, public roles: RolesService) {
    this.auth.getUser().subscribe((user) => {
      if (user) {
        this.profile = user.profile;
      }
    });
    this.api.configuration.pipe(first()).subscribe(
      (configuration) => {
        this.configuration = configuration;
      }
    )
  }

  ngOnInit() {
  }

}
