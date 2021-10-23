import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { HololiveRoutingModule } from "./hololive-routing.module";
import { ViewScreenComponent } from "./components/view-screen/view-screen.component";
import { HolotoolsService } from "../services/holotools.service";

@NgModule({
  declarations: [ViewScreenComponent],
  imports: [CommonModule, HololiveRoutingModule],
  providers: [HolotoolsService],
})
export class HololiveModule {}
