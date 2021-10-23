import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ViewScreenComponent } from "./components/view-screen/view-screen.component";

const routes: Routes = [
  {
    path: "",
    component: ViewScreenComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HololiveRoutingModule {}
