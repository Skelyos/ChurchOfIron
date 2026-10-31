import { Component, inject, OnInit } from "@angular/core";
import { HolotoolsService } from "./../../../services/holotools.service";
import { CurrentlyLiveModel, CurrentlyLiveStream } from "./curretly-live.model";

@Component({
  selector: "app-live-bubble-modal",
  standalone: true,
  templateUrl: "./live-bubble-modal.component.html",
  styleUrls: ["./live-bubble-modal.component.scss"],
})
export class LiveBubbleModalComponent implements OnInit {
  private readonly holotoolsService = inject(HolotoolsService);
  public loading = true;
  public currentlyLive?: CurrentlyLiveModel;
  public selectedLivers: CurrentlyLiveStream[] = [];

  ngOnInit() {
    this.holotoolsService.getHololiveLives().subscribe((information: CurrentlyLiveModel) => {
      this.currentlyLive = information;
      this.loading = false;
    });
  }
  
  handleImageSelected(object: CurrentlyLiveStream) {
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

  findImageSelected(currentStream: CurrentlyLiveStream) {
    const foundIndex = this.selectedLivers.findIndex(
      (liver) => liver.id === currentStream.id
    );
    return foundIndex != -1 ? true : false;
  }
}
