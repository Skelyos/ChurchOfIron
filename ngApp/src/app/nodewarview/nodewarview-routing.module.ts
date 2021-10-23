import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { NodewarviewComponent } from "./nodewarview.component";

const routes: Routes = [
  {
    path: ":guildId",
    component: NodewarviewComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NodewarviewRoutingModule {}
