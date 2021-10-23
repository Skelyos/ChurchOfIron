import { Component, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { HolotoolsService } from "./../../../services/holotools.service";

@Component({
  selector: "app-view-screen",
  templateUrl: "./view-screen.component.html",
  styleUrls: ["./view-screen.component.scss"],
})
export class ViewScreenComponent implements OnInit {
  public innerWidth = 0;
  public innerHeight= 0;
  public currentlyLive = {};

  public maxColumns = 3

  constructor(
    private holotoolsService: HolotoolsService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.setHeightAndWidth();
    this.holotoolsService.getHololiveLives().subscribe((information) => {
      this.currentlyLive = information;

      // Temp push of repeated data
      for (let index = 0; index < 8; index++) {
        this.currentlyLive['live'].push(information['live'][0])
      }
    });
  }

  splitIntoEvenRows() {
    
  }

  setHeightAndWidth() {
    this.innerWidth = window.innerWidth;
    this.innerHeight = window.innerHeight;
  }

  onWindowResize(event) {
    this.innerWidth = event.target.innerWidth;
    this.innerHeight= event.target.innerHeight;
  }

  getEmbeddedUrl(videoKey) {
    const generatedUrl = `https://www.youtube.com/embed/${videoKey}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(generatedUrl);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.currentlyLive['live'], event.previousIndex, event.currentIndex);
  }

  getWindowWidth(itemCount) {
    const calculatedWidth = (this.innerWidth / itemCount) - 36;
    return calculatedWidth
  }

  getWindowHeight(itemCount) {
    const calculatedHeight = (this.innerHeight / itemCount);
    return calculatedHeight
  }
}
