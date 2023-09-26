import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EtlServerModule } from 'etl-server';
import { environment } from '../environments/environment';

const routes: Routes = [
  { path: '**', loadChildren: () => EtlServerModule },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
