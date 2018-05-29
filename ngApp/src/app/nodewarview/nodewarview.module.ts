import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodewarRetrivalService } from '../services/nodewar-retrival.service';
import { NodewarviewComponent } from './nodewarview.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    NodewarviewComponent
  ],
  providers: [
    NodewarRetrivalService
  ],
})
export class NodewarviewModule { }
