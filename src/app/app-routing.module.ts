import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: './home/home.module#HomeModule'
  },
  {
    path: 'userlist',
    loadChildren: './userlist/user-list.module#UserListModule'
  },
  {
    path: 'nodewar',
    loadChildren: './nodewarview/nodewarview.module#NodewarviewModule'
  },
  {
    path: 'hololive',
    loadChildren: './hololive/hololive.module#HololiveModule'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
