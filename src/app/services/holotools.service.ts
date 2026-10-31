import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { CurrentlyLiveModel } from "../hololive/components/live-bubble-modal/curretly-live.model";

@Injectable({
  providedIn: "root",
})
export class HolotoolsService {
  private holoToolsUrl = "https://api.holotools.app/v1/";

  private readonly httpClient = inject(HttpClient);

  getHololiveLives() {
    const route = `${this.holoToolsUrl}/live`;
    return this.httpClient.get<CurrentlyLiveModel>(route);
  }
}
