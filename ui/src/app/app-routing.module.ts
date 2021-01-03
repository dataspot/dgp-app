import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EtlServerComponent } from 'projects/etl-server/src/public-api';

const routes: Routes = [
  { path: '', component: EtlServerComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
