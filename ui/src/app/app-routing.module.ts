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

const routes: Routes = [
  { path: 'edit/:id', component: EditPipelineComponent,  data: {name: 'pipeline-edit'} },
  { path: 'status/:id', component: PipelineStatusComponent, data: {name: 'pipeline-status'} },
  { path: 'dgp/:id', component: DgpWorkbenchComponent,  data: {name: 'workbench'} },
  { path: 'dashboard', component: DashboardComponent, data: {name: 'dashboard'} },
  { path: 'pipelines', component: PipelineListComponent, data: {name: 'pipelines'} },
  { path: 'users', component: UsersComponent, data: {name: 'users'} },
  { path: 'logout', component: LogoutComponent, data: {name: 'logout'} },
  { path: '', component: LoginComponent, data: {name: 'login'} }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
