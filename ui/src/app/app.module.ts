import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PipelineStatusComponent } from './pipeline-status/pipeline-status.component';
import { EditPipelineComponent } from './edit-pipeline/edit-pipeline.component';
import { PipelineListComponent } from './pipeline-list/pipeline-list.component';
import { PipelineListItemComponent } from './pipeline-list-item/pipeline-list-item.component';
import { PipelineStatusDashboardComponent } from './pipeline-status-dashboard/pipeline-status-dashboard.component';
import { PipelineListHeadersComponent } from './pipeline-list-headers/pipeline-list-headers.component';

@NgModule({
  declarations: [
    AppComponent,
    PipelineStatusComponent,
    EditPipelineComponent,
    PipelineListComponent,
    PipelineListItemComponent,
    PipelineStatusDashboardComponent,
    PipelineListHeadersComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
