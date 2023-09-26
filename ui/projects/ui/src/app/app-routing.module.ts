import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EtlServerModule } from 'etl-server';

const routes: Routes = [
  { path: '**', loadChildren: () => EtlServerModule}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
