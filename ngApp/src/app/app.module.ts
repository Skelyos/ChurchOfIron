import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { NodewarviewComponent } from './nodewarview/nodewarview.component';
import { HomeModule } from './home/home.module';

import { NgbModule, NgbCarouselModule, NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';
import { NodewarRetrivalService } from './Services/nodewar-retrival.service';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NodewarviewComponent
  ],
  imports: [
    BrowserModule,
    NgbModule,
    HttpClientModule,
    HomeModule,

    AppRoutingModule,
  ],
  providers: [
    NodewarRetrivalService
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
