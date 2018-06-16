import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodewarRetrivalService } from '../services/nodewar-retrival.service';
import { NodewarviewComponent } from './nodewarview.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
  ],
  declarations: [
    NodewarviewComponent
  ],
  providers: [
    NodewarRetrivalService
  ],
})
export class NodewarviewModule { }
