import { Component, OnInit } from "@angular/core";
import { HolotoolsService } from "./../../../services/holotools.service";
import { CurrentlyLiveModel } from "./curretly-live.model";

@Component({
  selector: "app-live-bubble-modal",
  templateUrl: "./live-bubble-modal.component.html",
  styleUrls: ["./live-bubble-modal.component.scss"],
})
export class LiveBubbleModalComponent implements OnInit {
  public loading = true;
  public currentlyLive: CurrentlyLiveModel;
  public selectedLivers = [];

  constructor(private holotoolsService: HolotoolsService) {}

  ngOnInit() {
    this.holotoolsService.getHololiveLives().subscribe((information: CurrentlyLiveModel) => {
      this.currentlyLive = information;
      this.loading = false;
    });
  }
  
  handleImageSelected(object) {
    const foundIndex = this.selectedLivers.findIndex((liver) => liver.id === object.id);
    if (foundIndex != -1) {
      this.selectedLivers.splice(foundIndex, 1);
      return;
    }
    this.selectedLivers.push(object);
  }

  clear() {
    this.selectedLivers = [];
  }

  findImageSelected(currentStream) {
    const foundIndex = this.selectedLivers.findIndex(
      (liver) => liver.id === currentStream.id
    );
    return foundIndex != -1 ? true : false;
  }
}
