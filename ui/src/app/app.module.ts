import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { BudgetkeyNg2AuthModule, getAuthServiceConfigProvider } from 'budgetkey-ng2-auth';
import { AppComponent } from './app.component';
import { PipelineStatusComponent } from './pipeline-status/pipeline-status.component';
import { EditPipelineComponent } from './edit-pipeline/edit-pipeline.component';
import { PipelineListComponent } from './pipeline-list/pipeline-list.component';
import { PipelineListItemComponent } from './pipeline-list-item/pipeline-list-item.component';
import { PipelineStatusDashboardComponent } from './pipeline-status-dashboard/pipeline-status-dashboard.component';
import { PipelineListHeadersComponent } from './pipeline-list-headers/pipeline-list-headers.component';
import { DynamicFieldsEditorComponent } from './dynamic-fields-editor/dynamic-fields-editor.component';
import { DgpWorkbenchComponent } from './dgp-workbench/dgp-workbench.component';
import { StepsComponent } from './steps/steps.component';
import { StepExtractComponent } from './step-extract/step-extract.component';
import { StepMappingComponent } from './step-mapping/step-mapping.component';
import { StepEnrichComponent } from './step-enrich/step-enrich.component';
import { StepPublishComponent } from './step-publish/step-publish.component';
import { ResultsComponent } from './results/results.component';
import { ResultTabsComponent } from './result-tabs/result-tabs.component';
import { ResultTableComponent } from './result-table/result-table.component';
import { StepTabsComponent } from './step-tabs/step-tabs.component';
import { StepExtractSourceComponent } from './step-extract-source/step-extract-source.component';
import { StepExtractStructureComponent } from './step-extract-structure/step-extract-structure.component';
import { StepMappingFieldComponent } from './step-mapping-field/step-mapping-field.component';
import { ExtendableKeyvalueListComponent } from './extendable-keyvalue-list/extendable-keyvalue-list.component';
import { FailureMarqueeComponent } from './failure-marquee/failure-marquee.component';
import { ExtraConfigQuestionComponent } from './extra-config-question/extra-config-question.component';
import { ExtraConfigQuestionsComponent } from './extra-config-questions/extra-config-questions.component';
import { LoginComponent } from './login/login.component';
import { HeaderComponent } from './header/header.component';
import { ContainerComponent } from './container/container.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LogoutComponent } from './logout/logout.component';
import { UsersComponent } from './users/users.component';
import { UserListItemComponent } from './user-list-item/user-list-item.component';
import { FilesComponent } from './files/files.component';
import { FileUploaderComponent } from './file-uploader/file-uploader.component';
import { FileListItemComponent } from './file-list-item/file-list-item.component';

@NgModule({
  declarations: [
    AppComponent,
    PipelineStatusComponent,
    EditPipelineComponent,
    PipelineListComponent,
    PipelineListItemComponent,
    PipelineStatusDashboardComponent,
    PipelineListHeadersComponent,
    DynamicFieldsEditorComponent,
    DgpWorkbenchComponent,
    StepsComponent,
    StepExtractComponent,
    StepMappingComponent,
    StepEnrichComponent,
    StepPublishComponent,
    ResultsComponent,
    ResultTabsComponent,
    ResultTableComponent,
    StepTabsComponent,
    StepExtractSourceComponent,
    StepExtractStructureComponent,
    StepMappingFieldComponent,
    ExtendableKeyvalueListComponent,
    FailureMarqueeComponent,
    ExtraConfigQuestionComponent,
    ExtraConfigQuestionsComponent,
    LoginComponent,
    HeaderComponent,
    ContainerComponent,
    DashboardComponent,
    LogoutComponent,
    UsersComponent,
    UserListItemComponent,
    FilesComponent,
    FileUploaderComponent,
    FileListItemComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BudgetkeyNg2AuthModule,
  ],
  providers: [
    getAuthServiceConfigProvider(''),
    // getAuthServiceConfigProvider('http://localhost:5000'),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
