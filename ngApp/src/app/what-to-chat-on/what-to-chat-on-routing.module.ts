import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { WhatToChatOnComponent } from "./what-to-chat-on.component";

const routes: Routes = [
  {
    path: "",
    component: WhatToChatOnComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WhatToChatOnRoutingModule {}
