import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: './contact/home.module#HomeModule'
  },
  {
    path: 'userlist',
    loadChildren: './contact/user-list.module#UserListModule'
  },
  {
    path: 'nodewar',
    loadChildren: './contact/nodewarview.module#NodewarviewModule'
  },
  {
    path: 'hololive',
    loadChildren: './contact/hololive.module#HololiveModule'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
