import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { DgpOauth2Module } from 'dgp-oauth2-ng';
import { EtlServerRoutingModule } from './routing.module';
import { ConfirmerComponent } from './components/confirmer/confirmer.component';
import { ContainerComponent } from './layout/container/container.component';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { DataRecordEditAuxDirective } from './data-record-edit-aux.directive';
import { DataRecordEditInnerComponent } from './datarecords/data-record-edit-inner/data-record-edit-inner.component';
import { DataRecordEditComponent } from './datarecords/data-record-edit/data-record-edit.component';
import { DataRecordListComponent } from './datarecords/data-record-list/data-record-list.component';
import { DgpWorkbenchButtonsComponent } from './workbench/dgp-workbench-buttons/dgp-workbench-buttons.component';
import { DgpWorkbenchComponent } from './workbench/dgp-workbench/dgp-workbench.component';
import { DynamicFieldsEditorComponent } from './components/dynamic-fields-editor/dynamic-fields-editor.component';
import { EditPipelineComponent } from './pipelines/edit-pipeline/edit-pipeline.component';
import { EtlServerComponent } from './etl-server.component';
import { ExtendableKeyvalueListComponent } from './components/extendable-keyvalue-list/extendable-keyvalue-list.component';
import { ExtraConfigQuestionComponent } from './workbench/extra-config-question/extra-config-question.component';
import { ExtraConfigQuestionsComponent } from './workbench/extra-config-questions/extra-config-questions.component';
import { FailureMarqueeComponent } from './components/failure-marquee/failure-marquee.component';
import { FileListItemComponent } from './files/file-list-item/file-list-item.component';
import { FileUploaderComponent } from './files/file-uploader/file-uploader.component';
import { FilesComponent } from './files/files/files.component';
import { HeaderComponent } from './layout/header/header.component';
import { LoginComponent } from './auth/login/login.component';
import { LogoutComponent } from './auth/logout/logout.component';
import { PipelineListHeadersComponent } from './pipelines/pipeline-list-headers/pipeline-list-headers.component';
import { PipelineListItemComponent } from './pipelines/pipeline-list-item/pipeline-list-item.component';
import { PipelineListSectionComponent } from './pipelines/pipeline-list-section/pipeline-list-section.component';
import { PipelineListComponent } from './pipelines/pipeline-list/pipeline-list.component';
import { PipelineStatusDashboardComponent } from './dashboard/pipeline-status-dashboard/pipeline-status-dashboard.component';
import { PipelineStatusComponent } from './pipelines/pipeline-status/pipeline-status.component';
import { ResultTableComponent } from './workbench/result-table/result-table.component';
import { ResultsTabSelectorComponent } from './workbench/results-tab-selector/results-tab-selector.component';
import { ResultsComponent } from './workbench/results/results.component';
import { StepEnrichComponent } from './workbench/step-enrich/step-enrich.component';
import { StepExtractSourceComponent } from './workbench/step-extract-source/step-extract-source.component';
import { StepExtractStructureComponent } from './workbench/step-extract-structure/step-extract-structure.component';
import { StepFlippedMappingFieldComponent } from './workbench/step-flipped-mapping-field/step-flipped-mapping-field.component';
import { StepFlippedMappingComponent } from './workbench/step-flipped-mapping/step-flipped-mapping.component';
import { StepTaxonomyComponent } from './workbench/step-taxonomy/step-taxonomy.component';
import { TaxonomiesComponent } from './taxonomies/taxonomies/taxonomies.component';
import { TaxonomyItemComponent } from './taxonomies/taxonomy-item/taxonomy-item.component';
import { UserListItemComponent } from './users/user-list-item/user-list-item.component';
import { UsersComponent } from './users/users/users.component';
import { ENVIRONMENT } from './config';
import { DataRecordListInnerComponent } from './datarecords/data-record-list-inner/data-record-list-inner.component';
import { DataRecordDashboardComponent } from './datarecords/data-record-dashboard/data-record-dashboard.component';
import { DataRecordDashboardInnerComponent } from './datarecords/data-record-dashboard-inner/data-record-dashboard-inner.component';
import { DataRecordUserComponent } from './datarecords/data-record-user/data-record-user.component';
import { DataRecordUserInnerComponent } from './datarecords/data-record-user-inner/data-record-user-inner.component';


@NgModule({
  declarations: [
    EtlServerComponent,
    PipelineStatusComponent,
    EditPipelineComponent,
    PipelineListComponent,
    PipelineListItemComponent,
    PipelineStatusDashboardComponent,
    PipelineListHeadersComponent,
    DynamicFieldsEditorComponent,
    DgpWorkbenchComponent,
    StepEnrichComponent,
    ResultsComponent,
    ResultTableComponent,
    StepExtractSourceComponent,
    StepExtractStructureComponent,
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
    FileListItemComponent,
    StepTaxonomyComponent,
    ResultsTabSelectorComponent,
    StepFlippedMappingComponent,
    StepFlippedMappingFieldComponent,
    ConfirmerComponent,
    TaxonomiesComponent,
    TaxonomyItemComponent,
    DataRecordListComponent,
    DataRecordEditComponent,
    DataRecordEditInnerComponent,
    DataRecordEditAuxDirective,
    DgpWorkbenchButtonsComponent,
    PipelineListSectionComponent,
    DataRecordListInnerComponent,
    DataRecordDashboardComponent,
    DataRecordDashboardInnerComponent,
    DataRecordUserComponent,
    DataRecordUserInnerComponent,
  ],
  entryComponents: [
    DataRecordEditInnerComponent
  ],
  imports: [
    BrowserModule,
    EtlServerRoutingModule,
    HttpClientModule,
    FormsModule,
    DgpOauth2Module
  ],
  exports: [
    EtlServerComponent,
    FileUploaderComponent,
  ],
  providers: [],
  bootstrap: [EtlServerComponent]
})
export class EtlServerModule {
  static forRoot(env?: any): ModuleWithProviders<EtlServerModule> {
    return {
        ngModule: EtlServerModule,
        providers: [
            { provide: ENVIRONMENT, useValue: env }
        ]
    };
  }
}
