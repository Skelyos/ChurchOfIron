import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';
import { HomeComponent } from './home.component';
import { HomeRoutingModule } from './home-routing.module';

@NgModule({
  imports: [
    CommonModule,
    HomeRoutingModule
  ],
  declarations: [
    HomeComponent
  ],
  providers: [
    NgbCarouselConfig,
  ]
})
export class HomeModule { }