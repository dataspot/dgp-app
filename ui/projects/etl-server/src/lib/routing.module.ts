import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PipelineStatusComponent } from './pipeline-status/pipeline-status.component';
import { EditPipelineComponent } from './edit-pipeline/edit-pipeline.component';
import { PipelineListComponent } from './pipeline-list/pipeline-list.component';
import { DgpWorkbenchComponent } from './dgp-workbench/dgp-workbench.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LogoutComponent } from './logout/logout.component';
import { UsersComponent } from './users/users.component';
import { FilesComponent } from './files/files.component';
import { TaxonomiesComponent } from './taxonomies/taxonomies.component';
import { DataRecordListComponent } from './data-record-list/data-record-list.component';
import { DataRecordEditComponent } from './data-record-edit/data-record-edit.component';

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
