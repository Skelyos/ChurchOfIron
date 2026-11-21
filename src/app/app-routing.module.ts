import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./home/home.component").then((m) => m.HomeComponent),
  },
  {
    path: "userlist",
    loadComponent: () => import("./userlist/userlist.component").then((m) => m.UserlistComponent),
  },
  {
    path: "nodewar",
    loadComponent: () => import("./nodewarview/nodewarview.component").then((m) => m.NodewarviewComponent),
  },
  {
    path: "hololive",
    loadComponent: () => import("./hololive/components/view-screen/view-screen.component").then((m) => m.ViewScreenComponent),
  },
  {
    path: "planner",
    loadComponent: () => import("./planner/planner.component").then((m) => m.PlannerComponent),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
