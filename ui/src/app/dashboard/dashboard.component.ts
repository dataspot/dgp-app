import { Component, OnInit } from '@angular/core';
import { AuthService } from 'budgetkey-ng2-auth';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent implements OnInit {

  profile = null;

  constructor(public auth: AuthService) {
    this.auth.getUser().subscribe((user) => {
      if (user) {
        this.profile = user.profile;
        console.log(this.profile);
      }
    });
  }

  ngOnInit() {
  }

}
