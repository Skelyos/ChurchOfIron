import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';
import { WhatToChatOnComponent } from './what-to-chat-on.component';
import { WhatToChatOnRoutingModule } from './what-to-chat-on-routing.module';

@NgModule({
  imports: [
    CommonModule,
    WhatToChatOnRoutingModule
  ],
  declarations: [
    WhatToChatOnComponent
  ],
  providers: [
    NgbCarouselConfig,
  ]
})
export class WhatToChatOnModule { }
