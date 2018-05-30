import { Component, OnInit } from '@angular/core';
import { subscribeOn } from 'rxjs/operator/subscribeOn';
import { NodewarRetrivalService } from '../services/nodewar-retrival.service';
import { ActivatedRoute } from '@angular/router';

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

  nodewarcode = {
    code: 'yhcnb',
    GuildId: ''
  };

  // http://localhost:4200/nodewar/410032498995888128

  constructor(
    public nodewar: NodewarRetrivalService,
    public route: ActivatedRoute
  ) {
    this.route.params.subscribe((result) => {
      this.nodewarcode.GuildId = result.guildId;
    });
  }

  ngOnInit() {
    this.nodewar.getNodewar(this.nodewarcode).subscribe((result) => {
      this.nodewarinfo = result;
    });
  }

}
