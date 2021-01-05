import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PipelineStatusComponent } from './pipelines/pipeline-status/pipeline-status.component';
import { EditPipelineComponent } from './pipelines/edit-pipeline/edit-pipeline.component';
import { PipelineListComponent } from './pipelines/pipeline-list/pipeline-list.component';
import { DgpWorkbenchComponent } from './workbench/dgp-workbench/dgp-workbench.component';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LogoutComponent } from './auth/logout/logout.component';
import { UsersComponent } from './users/users/users.component';
import { FilesComponent } from './files/files/files.component';
import { TaxonomiesComponent } from './taxonomies/taxonomies/taxonomies.component';
import { DataRecordListComponent } from './datarecords/data-record-list/data-record-list.component';
import { DataRecordEditComponent } from './datarecords/data-record-edit/data-record-edit.component';

const routes: Routes = [
  { path: 'edit/:id', component: EditPipelineComponent,  data: {name: 'pipeline-edit'} },
  { path: 'status/:id', component: PipelineStatusComponent, data: {name: 'pipeline-status'} },
  { path: 'dgp/:id', component: DgpWorkbenchComponent,  data: {name: 'workbench'} },
  { path: 'dashboard', component: DashboardComponent, data: {name: 'dashboard'} },
  { path: 'pipelines', component: PipelineListComponent, data: {name: 'pipelines'} },
  { path: 'users', component: UsersComponent, data: {name: 'users'} },
  { path: 'files', component: FilesComponent, data: {name: 'files'} },
  { path: 'taxonomies', component: TaxonomiesComponent, data: {name: 'taxonomies'} },
  { path: 'datarecords/:name', component: DataRecordListComponent, data: {name: 'datarecords'} },
  { path: 'datarecords/:name/:id', component: DataRecordEditComponent, data: {name: 'datarecords'} },
  { path: 'logout', component: LogoutComponent, data: {name: 'logout'} },
  { path: '', component: LoginComponent, data: {name: 'login'} }
];

export const routerModule = RouterModule.forRoot(routes)

@NgModule({
  imports: [routerModule],
  exports: [RouterModule]
})
export class EtlServerRoutingModule { }
