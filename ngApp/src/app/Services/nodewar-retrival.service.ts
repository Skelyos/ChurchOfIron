import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class NodewarRetrivalService {

  constructor(
    public http: HttpClient
  ) { }

  getNodewar(nodewarCode) {
    const url = 'http://localhost:3000/api/nodewar';
    return this.http.post(url, nodewarCode);
  }

  getUserList(guildId) {
    const url = 'http://localhost:3000/api/userlist';
    return this.http.post(url, guildId);
  }

}
