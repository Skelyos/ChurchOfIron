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
    const route = this.url + '/api/nodewar/' + nodewarCode.code;
    return this.http.get(route);
  }

  getUserList(guildId) {
    const route = this.url + '/api/userlist/' + guildId.GuildId;
    return this.http.get(route);
  }

}
