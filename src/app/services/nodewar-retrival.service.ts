import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GuildMember, NodewarInfo } from './nodewar.model';

@Injectable()
export class NodewarRetrivalService {
  url = 'http://churchofiron.co.uk:3000';
  // url = 'http://localhost:3000';

  private readonly httpClient = inject(HttpClient);

  getNodewar(nodewarCode: { code: string }) {
    const route = this.url + '/api/nodewar/' + nodewarCode.code;
    return this.httpClient.get<NodewarInfo[]>(route);
  }

  getUserList(guildId: { GuildId: string }) {
    const route = this.url + '/api/userlist/' + guildId.GuildId;
    return this.httpClient.get<GuildMember[]>(route);
  }

}
