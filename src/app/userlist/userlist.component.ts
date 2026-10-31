import { Component, inject, OnInit } from '@angular/core';
import { NodewarRetrivalService } from '../services/nodewar-retrival.service';
import { GuildMember } from '../services/nodewar.model';
import { ActivatedRoute } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

interface FilterOption {
  text: string;
  value: number;
  checked: boolean;
}

@Component({
  selector: 'app-userlist',
  standalone: true,
  imports: [MatSlideToggleModule],
  templateUrl: './userlist.component.html',
  styleUrls: ['./userlist.component.scss']
})
export class UserlistComponent implements OnInit {
  private readonly nodewar = inject(NodewarRetrivalService);
  private readonly route = inject(ActivatedRoute);

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
  guildList: GuildMember[] = [];
  filteredList: GuildMember[] = [];
  guildIdObject = {
    GuildId: ''
  };

  showAllTickBox = false;
  filtersShowing = false;

  filterBar: FilterOption[] = [
    {
      text: 'Filter by class',
      value: 0,
      checked: false
    },
    {
      text: 'Filter by level',
      value: 1,
      checked: false
    },
    {
      text: 'Filter by family name',
      value: 2,
      checked: false
    },
    {
      text: 'Filter by IGN',
      value: 3,
      checked: false
    },
    {
      text: 'Filter by AP',
      value: 4,
      checked: false
    },
    {
      text: 'Filter by AWAP',
      value: 5,
      checked: false
    },
    {
      text: 'Filter by DP',
      value: 6,
      checked: false
    },
    {
      text: 'Filter by RS',
      value: 7,
      checked: false
    }
  ];

  // Good test stuff
  // http://localhost:4200/userlist/405861356252692481

  constructor() {
    this.route.params.subscribe((result) => {
      this.guildIdObject.GuildId = result.guildId;
    });
  }

  ngOnInit() {
    this.showUsernames();
    this.getUserList();
  }

  cloneArray<T>(array: T[]): T[] {
    return array.slice(0);
  }

  getUserList() {
    this.nodewar.getUserList(this.guildIdObject).subscribe((result) => {
      this.guildList = result;
      this.filteredList = this.cloneArray(this.guildList);
    });
  }

  changeToggleVariable() {
    this.showAllTickBox = !this.showAllTickBox;
    this.showUsernames();
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

  showFilters() {
    this.filtersShowing = !this.filtersShowing;

    if (!this.filtersShowing) {
      this.filteredList = this.cloneArray(this.guildList);
      this.setFiltersToDefault(null);
    }
  }

  setFiltersToDefault(value: number | null) {
    this.filterBar.forEach((filter) => {
      if (value === null || value !== filter.value) {
        filter.checked = false;
      }
    });
  }

  filterValues(filter: FilterOption) {
    switch (filter.value) {
      case 0:
        filter.checked = !filter.checked;
        this.setFiltersToDefault(filter.value);
        this.orderArray('CharClass', filter.checked);
        break;
      case 1:
        filter.checked = !filter.checked;
        this.setFiltersToDefault(filter.value);
        this.orderArray('CharLevel', filter.checked);
        break;
      case 2:
        filter.checked = !filter.checked;
        this.setFiltersToDefault(filter.value);
        this.orderArray('FamilyName', filter.checked);
        break;
      case 3:
        filter.checked = !filter.checked;
        this.setFiltersToDefault(filter.value);
        this.orderArray('IGN', filter.checked);
        break;
      case 4:
        filter.checked = !filter.checked;
        this.setFiltersToDefault(filter.value);
        this.orderArray('AP', filter.checked);
        break;
      case 5:
        filter.checked = !filter.checked;
        this.setFiltersToDefault(filter.value);
        this.orderArray('AWAP', filter.checked);
        break;
      case 6:
        filter.checked = !filter.checked;
        this.setFiltersToDefault(filter.value);
        this.orderArray('DP', filter.checked);
        break;
      case 7:
        filter.checked = !filter.checked;
        this.setFiltersToDefault(filter.value);
        this.orderArray('RenownScore', filter.checked);
        break;
    }
  }

  orderArray(keyToSearchBy: keyof GuildMember, toggledOn: boolean) {
    if (toggledOn) {
      this.filteredList.sort((a, b) => {
        const nameA = a[keyToSearchBy];
        const nameB = b[keyToSearchBy];

        if (typeof nameA === 'string' && typeof nameB === 'string') {
          return this.filterTextAStart(nameA.toLocaleUpperCase(), nameB.toLocaleUpperCase());
        }

        return this.filterHighestInts(Number(nameA), Number(nameB));
      });

      return;
    }

    this.filteredList = this.cloneArray(this.guildList);
    return;
  }

  /**
   * TO ONLY BE USED IN .SORT() FUNCTION
   * Filters text A to Z
   * @param nameA
   * @param nameB
   */
  private filterTextAStart(nameA: string, nameB: string) {
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  }

  /**
   * TO ONLY BE USED IN .SORT() FUNCTION
   * Filters ints highest first and lowest last
   * @param int1
   * @param int2
   */
  private filterHighestInts(int1: number, int2: number) {
    if (int1 < int2) {
      return 1;
    }
    if (int1 > int2) {
      return -1;
    }
    return 0;
  }

}
