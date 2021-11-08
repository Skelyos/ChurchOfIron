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
  public selectedLivers = [];

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
    // const extraDetails = '?enablejsapi=1&autoplay=0&modestbranding=1&iv_load_policy=3&widget_referrer=localhost:4200/hololive';
    const extraDetails = '';
    const generatedUrl = `https://www.youtube.com/embed/${videoKey}${extraDetails}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(generatedUrl);
  }

  getWindowWidth(itemCount) {
    const calculatedWidth = this.innerWidth / itemCount;
    return calculatedWidth;
  }

  getWindowHeight(itemCount) {
    const removeToolbarHeight = 77 / this.splitIntoEvenRows(this.selectedLivers).length;
    const calculatedHeight = (this.innerHeight / itemCount) - removeToolbarHeight;
    return calculatedHeight;
  }

  handleImageSelected(object) {
    const foundIndex = this.selectedLivers.findIndex((liver) => liver.id === object.id);
    if (foundIndex != -1) {
      return this.selectedLivers.splice(foundIndex, 1);
    }
    this.selectedLivers.push(object);
  }

  findImageSelected(currentStream) {
    const foundIndex = this.selectedLivers.findIndex((liver) => liver.id === currentStream.id);
    return foundIndex != -1 ? true : false;
  }
}
