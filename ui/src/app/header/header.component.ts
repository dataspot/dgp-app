import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RolesService } from '../roles.service';
import { ApiService } from '../api.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less']
})
export class HeaderComponent implements OnInit {

  detected = '';
  detectedName = '';
  homepage: string;
  datarecords = [];

  constructor(private activatedRoute: ActivatedRoute, public roles: RolesService, private api: ApiService) {
    this.activatedRoute.data.subscribe((data) => {
      this.detected = data.name;
    });
    this.activatedRoute.params.subscribe((params) => {
      this.detectedName = params.name;
    });

    this.api.configuration.pipe(first()).subscribe((configuration: any) => {
      this.homepage = configuration.homepage || '/dashboard';
      this.datarecords = configuration.dataRecords || [];
      console.log(configuration);
    });
  }

  ngOnInit() {
  }

}
