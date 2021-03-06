import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { HomeModule } from './home/home.module';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';
import { NodewarviewModule } from './nodewarview/nodewarview.module';
import { UserListModule } from './userlist/user-list.module';
import { WhatToChatOnComponent } from './what-to-chat-on/what-to-chat-on.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    WhatToChatOnComponent,
  ],
  imports: [
    BrowserModule,
    NgbModule,
    HttpClientModule,
    HomeModule,
    NodewarviewModule,
    UserListModule,

    AppRoutingModule,
  ],
  providers: [
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
