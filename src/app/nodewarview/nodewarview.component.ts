import { Component, OnInit } from '@angular/core';

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

  constructor() { }

  ngOnInit() {
  }

}
