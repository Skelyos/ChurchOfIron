import { Component, inject, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { splitEvery } from "ramda";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { LiveBubbleModalComponent } from "../live-bubble-modal/live-bubble-modal.component";
import { CurrentlyLiveStream } from "../live-bubble-modal/curretly-live.model";

@Component({
  selector: "app-view-screen",
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: "./view-screen.component.html",
  styleUrls: ["./view-screen.component.scss"],
})
export class ViewScreenComponent implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly dialog = inject(MatDialog);

  public innerWidth = 0;
  public innerHeight = 0;
  public displayedVideos: CurrentlyLiveStream[][] = [];

  public maxColumns = 3;

  ngOnInit() {
    this.setHeightAndWidth();
  }

  splitIntoEvenRows(currentLive: CurrentlyLiveStream[]) {
    const evenRows = splitEvery(this.maxColumns, currentLive);
    return evenRows;
  }

  setHeightAndWidth() {
    this.innerWidth = window.innerWidth;
    this.innerHeight = window.innerHeight - 12;
  }

  onWindowResize() {
    this.innerWidth = window.innerWidth;
    this.innerHeight = window.innerHeight - 12;
  }

  getEmbeddedUrl(videoKey: string) {
    const extraDetails = '';
    const generatedUrl = `https://www.youtube.com/embed/${videoKey}${extraDetails}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(generatedUrl);
  }

  getWindowWidth(itemCount: number) {
    const calculatedWidth = this.innerWidth / itemCount;
    return calculatedWidth;
  }

  getWindowHeight() {
    const removeToolbarHeight = 77 / this.displayedVideos.length;
    console.log(removeToolbarHeight);

    const calculatedHeight = (this.innerHeight / this.displayedVideos.length) - removeToolbarHeight;
    return calculatedHeight;
  }

  openDialog(): void {
    const dialogRef = this.dialog.open<
      LiveBubbleModalComponent,
      { currentlyDisplayed: CurrentlyLiveStream[][] },
      CurrentlyLiveStream[]
    >(LiveBubbleModalComponent, {
      height: '85%',
      width: '960px',
      data: { currentlyDisplayed: this.displayedVideos },
    });

    dialogRef.afterClosed().subscribe(result => {
      this.displayedVideos = this.splitIntoEvenRows(result ?? []);
    });
  }
}
