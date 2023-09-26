import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RolesService } from '../../roles.service';
import { ApiService } from '../../api.service';
import { first } from 'rxjs/operators';
import { ConfigService } from '../../config.service';

@Component({
  selector: 'etl-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less']
})
export class HeaderComponent implements OnInit {

  detected = '';
  detectedName = '';
  homepage: string;
  datarecords: any[] = [];
  extraLinks: any[] = [];
  configuration: any = {};

  constructor(
    private activatedRoute: ActivatedRoute, public roles: RolesService, private api: ApiService,
    private config: ConfigService,
  ) {
    this.activatedRoute.data.subscribe((data: any) => {
      this.detected = data.name;
    });
    this.activatedRoute.params.subscribe((params: any) => {
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

  showDatarecord(datarecord: any) {
    const mapping = this.config.EXTRA_MAPPING[datarecord.edit_component] || {};
    return mapping.list !== false && (!datarecord.admin || this.roles._.pseudoAdmin);
  }
}
