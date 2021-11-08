import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./home/home.module').then( m => m.HomeModule)
  },
  {
    path: 'whatToChatOn',
    loadChildren: () => import('./what-to-chat-on/what-to-chat-on.module').then( m => m.WhatToChatOnModule)
  },
  {
    path: 'userlist',
    loadChildren: () => import('./userlist/user-list.module').then( m => m.UserListModule)
  },
  {
    path: 'nodewar',
    loadChildren: () => import('./nodewarview/nodewarview.module').then( m => m.NodewarviewModule)
  },
  {
    path: 'hololive',
    loadChildren: () => import('./hololive/hololive.module').then( m => m.HololiveModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
