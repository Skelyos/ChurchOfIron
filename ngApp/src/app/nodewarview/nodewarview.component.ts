import { Component, DoCheck, OnChanges } from '@angular/core';
import { subscribeOn } from 'rxjs/operator/subscribeOn';
import { NodewarRetrivalService } from '../services/nodewar-retrival.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-nodewarview',
  templateUrl: './nodewarview.component.html',
  styleUrls: ['./nodewarview.component.scss']
})
export class NodewarviewComponent implements OnChanges {
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
  nodewarCode = '';
  nodewarinfo: any;

  nodewarName: '';
  dateOfNodeWar: Date;


  nodewarObject = {
    code: this.nodewarCode,
    GuildId: ''
  };

  // http://localhost:4200/nodewar/410032498995888128

  constructor(
    public nodewar: NodewarRetrivalService,
    public route: ActivatedRoute
  ) {
    this.route.params.subscribe((result) => {
      this.nodewarObject.GuildId = result.guildId;
    });
  }

  ngOnChanges() {
    if (this.nodewarinfo !== undefined) {
      this.nodewarName = this.nodewarinfo.NodewarName;
      this.dateOfNodeWar = new Date(this.nodewarinfo.DateOfActivity);
    }
  }

  getNodewarWithCode() {
    this.nodewarObject.code = this.nodewarCode;
    this.nodewar.getNodewar(this.nodewarObject).subscribe((result) => {
      this.nodewarinfo = result[0];
      console.log(this.nodewarinfo.NodewarName);
    });
  }

}
