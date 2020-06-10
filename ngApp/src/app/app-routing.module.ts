import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { NodewarviewComponent } from './nodewarview/nodewarview.component';
import { UserlistComponent } from './userlist/userlist.component';
import { WhatToChatOnComponent } from './what-to-chat-on/what-to-chat-on.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'whatToChatOn',
    component: WhatToChatOnComponent
  },
  {
    path: 'userlist/:guildId',
    component: UserlistComponent
  },
  {
    path: 'nodewar/:guildId',
    component: NodewarviewComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
