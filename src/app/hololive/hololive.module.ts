import { NgModule } from "@angular/core";
import { HololiveRoutingModule } from "./hololive-routing.module";
import { ViewScreenComponent } from "./components/view-screen/view-screen.component";
import { HolotoolsService } from "../services/holotools.service";
import { LiveBubbleModalComponent } from "./components/live-bubble-modal/live-bubble-modal.component";

@NgModule({
  imports: [
    ViewScreenComponent,
    LiveBubbleModalComponent,
    HololiveRoutingModule,
  ],
  providers: [HolotoolsService],
})
export class HololiveModule {}
