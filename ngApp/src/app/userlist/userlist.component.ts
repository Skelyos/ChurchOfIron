import { Component, OnInit } from '@angular/core';
import { NodewarRetrivalService } from '../services/nodewar-retrival.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-userlist',
  templateUrl: './userlist.component.html',
  styleUrls: ['./userlist.component.scss']
})
export class UserlistComponent implements OnInit {

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
  guildList: any;
  guildIdObject = {
    GuildId: ''
  };

  showAllTickBox = false;

  // Good test stuff
  // http://localhost:4200/userlist/405861356252692481

  constructor(
    public nodewar: NodewarRetrivalService,
    public route: ActivatedRoute
  ) {
    this.route.params.subscribe((result) => {
      this.guildIdObject.GuildId = result.guildId;
    });
  }

  ngOnInit() {
    this.showUsernames();
    this.getUserList();
  }

  getUserList() {
    this.nodewar.getUserList(this.guildIdObject).subscribe((result) => {
      this.guildList = result;
    });
  }

  showUsernames() {
    if (this.showAllTickBox) {
      this.headers.unshift('Username');
    }
    if (!this.showAllTickBox) {
      const usernameIndex = this.headers.indexOf('Username');
      if (usernameIndex !== -1) {
        this.headers.splice(usernameIndex, 1);
      }
    }
  }

  changeToggleVariable() {
    this.showAllTickBox = !this.showAllTickBox;
    this.showUsernames();
  }

}
