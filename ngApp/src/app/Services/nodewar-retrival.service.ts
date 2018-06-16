import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class NodewarRetrivalService {
  url = 'http://churchofiron.co.uk:3000';
  // url = 'http://localhost:3000';

  constructor(
    public http: HttpClient
  ) { }

  getNodewar(nodewarCode) {
    const route = this.url + '/api/nodewar';
    return this.http.post(route, nodewarCode);
  }

  getUserList(guildId) {
    const route = this.url + '/api/userlist';
    return this.http.post(route, guildId);
  }

}
