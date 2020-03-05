import { Component, OnInit } from '@angular/core';
import { AuthService } from 'budgetkey-ng2-auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.less']
})
export class LogoutComponent implements OnInit {

  constructor(private auth: AuthService) { }

  ngOnInit() {
    this.auth.logout('/').subscribe((result) => {
      console.log('logged out', result);
      window.location.href = '/';
    });
  }

}
