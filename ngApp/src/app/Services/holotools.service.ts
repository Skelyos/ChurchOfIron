import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class HolotoolsService {
  private holoToolsUrl = "https://api.holotools.app/v1/";

  constructor(public httpClient: HttpClient) {}

  getHololiveLives() {
    const route = `${this.holoToolsUrl}/live`;
    return this.httpClient.get(route);
  }
}
