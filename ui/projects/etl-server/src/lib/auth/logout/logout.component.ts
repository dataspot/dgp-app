import { Component, OnInit } from '@angular/core';
import { AuthService } from 'dgp-oauth2-ng';
import { Router } from '@angular/router';

@Component({
  selector: 'etl-logout',
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
