import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { EtlServerModule } from 'projects/etl-server/src/public-api';
import { environment } from 'src/environments/environment';
import { EXTRA_MAPPING } from 'etl-server';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    EtlServerModule.forRoot(environment),
  ],
  providers: [{
    provide: EXTRA_MAPPING,
    useValue: {}
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
