import { Component, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { HolotoolsService } from "./../../../services/holotools.service";
import { splitEvery } from "ramda";

@Component({
  selector: "app-view-screen",
  templateUrl: "./view-screen.component.html",
  styleUrls: ["./view-screen.component.scss"],
})
export class ViewScreenComponent implements OnInit {
  public loading = true;

  public innerWidth = 0;
  public innerHeight = 0;
  public currentlyLive = {};

  public maxColumns = 3;

  constructor(
    private holotoolsService: HolotoolsService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.setHeightAndWidth();
    this.holotoolsService.getHololiveLives().subscribe((information) => {
      this.currentlyLive = information;
      this.loading = false;
    });
  }

  splitIntoEvenRows(currentLive) {
    return splitEvery(this.maxColumns, currentLive);
  }

  setHeightAndWidth() {
    this.innerWidth = window.innerWidth;
    this.innerHeight = window.innerHeight - 12;
  }

  onWindowResize(event) {
    this.innerWidth = event.target.innerWidth;
    this.innerHeight = event.target.innerHeight;
  }

  getEmbeddedUrl(videoKey) {
    const generatedUrl = `https://www.youtube.com/embed/${videoKey}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(generatedUrl);
  }

  getWindowWidth(itemCount) {
    const calculatedWidth = this.innerWidth / itemCount;
    return calculatedWidth;
  }

  getWindowHeight(itemCount) {
    const calculatedHeight = this.innerHeight / itemCount - 4;
    return calculatedHeight;
  }
}
