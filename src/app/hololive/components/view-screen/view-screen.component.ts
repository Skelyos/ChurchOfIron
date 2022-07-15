import { Component, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { splitEvery } from "ramda";
import { MatDialog } from "@angular/material";
import { LiveBubbleModalComponent } from "../live-bubble-modal/live-bubble-modal.component";

@Component({
  selector: "app-view-screen",
  templateUrl: "./view-screen.component.html",
  styleUrls: ["./view-screen.component.scss"],
})
export class ViewScreenComponent implements OnInit {

  public innerWidth = 0;
  public innerHeight = 0;
  public displayedVideos = [];

  public maxColumns = 3;

  constructor(
    private sanitizer: DomSanitizer,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.setHeightAndWidth();
  }

  splitIntoEvenRows(currentLive) {
    const evenRows = splitEvery(this.maxColumns, currentLive);
    return evenRows;
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
    const removeToolbarHeight = 77 / this.displayedVideos.length;
    console.log(removeToolbarHeight);

    const calculatedHeight = (this.innerHeight / this.displayedVideos.length) - removeToolbarHeight;
    return calculatedHeight;
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(LiveBubbleModalComponent, {
      height: '85%',
      width: '960px',
      data: { currentlyDisplayed: this.displayedVideos },
    });

    dialogRef.afterClosed().subscribe(result => {
      this.displayedVideos = result;
      debugger;
    });
  }
}
