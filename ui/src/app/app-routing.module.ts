import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PipelineStatusComponent } from './pipeline-status/pipeline-status.component';
import { EditPipelineComponent } from './edit-pipeline/edit-pipeline.component';
import { PipelineListComponent } from './pipeline-list/pipeline-list.component';
import { DgpWorkbenchComponent } from './dgp-workbench/dgp-workbench.component';

const routes: Routes = [
  { path: 'edit/:id', component: EditPipelineComponent },
  { path: 'status/:id', component: PipelineStatusComponent },
  { path: 'dgp/:id', component: DgpWorkbenchComponent },
  {path: '', component: PipelineListComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
