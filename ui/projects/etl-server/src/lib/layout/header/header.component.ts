import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RolesService } from '../../roles.service';
import { ApiService } from '../../api.service';
import { first } from 'rxjs/operators';
import { EXTRA_MAPPING } from '../../config';

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
  extraLinks = [];
  configuration: any = {};

  constructor(private activatedRoute: ActivatedRoute, public roles: RolesService, private api: ApiService, @Inject(EXTRA_MAPPING) private extraMapping) {
    this.activatedRoute.data.subscribe((data) => {
      this.detected = data.name;
    });
    this.activatedRoute.params.subscribe((params) => {
      this.detectedName = params.name;
    });

    this.api.configuration.pipe(first()).subscribe((configuration: any) => {
      this.homepage = configuration.homepage || '/dashboard';
      this.datarecords = configuration.dataRecords || [];
      this.extraLinks = configuration.headerLinks || [];
      this.configuration = configuration;
    });
  }

  ngOnInit() {
  }

  showDatarecord(datarecord) {
    const mapping = this.extraMapping[datarecord.edit_component] || {};
    return mapping.list !== false && (!datarecord.admin || this.roles._.pseudoAdmin);
  }
}
