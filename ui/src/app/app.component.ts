import { Component } from '@angular/core';
import { AuthService } from 'dgp-oauth2-ng';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  constructor(private theme: ThemeService, private auth: AuthService) {
    auth.configure({
      authServerUrl: '/',
      jwtLocalStorageKey: 'jwt',
      jwtQueryParam: 'jwt',
      profilePagePath: '/p/'
    });
  }
}
