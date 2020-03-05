import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RolesService } from '../roles.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less']
})
export class HeaderComponent implements OnInit {

  detected = '';

  constructor(private activatedRoute: ActivatedRoute, public roles: RolesService) {
    this.activatedRoute.data.subscribe((data) => {
      this.detected = data.name;
    });
  }

  ngOnInit() {
  }

}
