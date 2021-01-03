import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent implements OnInit {

  next = 'dashboard';

  constructor(private activatedRoute: ActivatedRoute,
              private router: Router,
              public api: ApiService) {
    this.activatedRoute.queryParamMap.subscribe((params) => {
      if (params.has('next')) {
        const next = params.get('next');
        if (next && next.indexOf('logout') === -1) {
          this.next = next;
        }
      }
    });
    this.api.token.subscribe((token) => {
      if (token) {
        this.router.navigate([this.next]);
      }
    });
  }

  ngOnInit() {
    console.log('LOGIN!!');
  }


  login_href() {
    if (this.api.providers) {
      if (this.api.providers.google) {
        return this.api.providers.google.url;
      } else if (this.api.providers.github) {
        return this.api.providers.github.url;
      }
    }
    return '#';
  }

}
