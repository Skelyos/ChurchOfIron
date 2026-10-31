import { NgModule } from '@angular/core';
import { UserlistComponent } from './userlist.component';
import { NodewarRetrivalService } from '../services/nodewar-retrival.service';
import { UserListRoutingModule } from './user-list-routing.module';

@NgModule({
  imports: [
    UserlistComponent,
    UserListRoutingModule
  ],
  providers: [
    NodewarRetrivalService
  ],

})
export class UserListModule { }
