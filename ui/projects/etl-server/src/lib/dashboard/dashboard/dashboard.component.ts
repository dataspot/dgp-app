import { Component, OnInit } from '@angular/core';
import { AuthService } from 'dgp-oauth2-ng';
import { RolesService } from '../../roles.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent implements OnInit {

  profile = null;

  constructor(public auth: AuthService, public roles: RolesService) {
    this.auth.getUser().subscribe((user) => {
      if (user) {
        this.profile = user.profile;
      }
    });
  }

  ngOnInit() {
  }

}
