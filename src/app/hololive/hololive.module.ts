import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { HololiveRoutingModule } from "./hololive-routing.module";
import { ViewScreenComponent } from "./components/view-screen/view-screen.component";
import { HolotoolsService } from "../services/holotools.service";
import { MatButtonModule, MatDialogModule } from "@angular/material";
import { LiveBubbleModalComponent } from "./components/live-bubble-modal/live-bubble-modal.component";

@NgModule({
  declarations: [ViewScreenComponent, LiveBubbleModalComponent],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    HololiveRoutingModule,
  ],
  providers: [HolotoolsService],
  entryComponents: [LiveBubbleModalComponent],
})
export class HololiveModule {}
