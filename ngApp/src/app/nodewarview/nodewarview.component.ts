import { Component, OnInit } from '@angular/core';
import { subscribeOn } from 'rxjs/operator/subscribeOn';
import { NodewarRetrivalService } from '../services/nodewar-retrival.service';

@Component({
  selector: 'app-nodewarview',
  templateUrl: './nodewarview.component.html',
  styleUrls: ['./nodewarview.component.scss']
})
export class NodewarviewComponent implements OnInit {
  headers = [
    'Class',
    'Level',
    'FamilyName',
    'IGN',
    'AP',
    'AWAP',
    'DP',
    'RS'
  ];

  nodewarinfo; any;
  guildList: any;

  nodewarcode = {
    code: 'yhcnb',
    GuildId: '410032498995888128'
  };
  guildId = {
    GuildId: '410032498995888128'
  };

  constructor(
    public nodewar: NodewarRetrivalService
  ) { }

  ngOnInit() {
    this.nodewar.getNodewar(this.nodewarcode).subscribe((result) => {
      this.nodewarinfo = result;
      debugger;
    });
    this.nodewar.getUserList(this.guildId).subscribe((result) => {
      this.guildList = result;
      debugger;
    });
  }

}
