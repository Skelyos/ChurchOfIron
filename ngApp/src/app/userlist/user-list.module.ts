import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserlistComponent } from './userlist.component';
import { NodewarRetrivalService } from '../services/nodewar-retrival.service';
import { FormsModule } from '@angular/forms';

// Material
import { MatSlideToggleModule } from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    // Material
    MatSlideToggleModule
  ],
  declarations: [
    UserlistComponent,
  ],
  providers: [
    NodewarRetrivalService
  ],

})
export class UserListModule { }
