import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { EtlServerModule, EXTRA_MAPPING } from 'projects/etl-server/src/public-api';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    EtlServerModule.forRoot(environment),
  ],
  providers: [{
    provide: EXTRA_MAPPING,
    useValue: {
      nil: []
    }
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
