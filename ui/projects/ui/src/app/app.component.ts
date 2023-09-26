import { Component } from '@angular/core';
import { ConfigService } from 'etl-server';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  constructor(private config: ConfigService) {
    this.config.EXTRA_MAPPING ={ nil: [] };
    this.config.ENVIRONMENT = environment;
    console.log('ENVIRONMENT', this.config.ENVIRONMENT);
  }
}
