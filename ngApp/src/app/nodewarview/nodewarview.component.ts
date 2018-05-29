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
  nodewarcode = {
    code: 'z3oae'
  };

  constructor(
    public nodewar: NodewarRetrivalService
  ) { }

  ngOnInit() {
    this.nodewar.getNodewar(this.nodewarcode).subscribe((result) => {
      this.nodewarinfo = result;
      debugger;
    });
    console.log(this.nodewarinfo);
    console.log(this.nodewarcode);
  }

}
