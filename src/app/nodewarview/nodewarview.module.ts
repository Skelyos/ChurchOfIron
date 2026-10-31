import { NgModule } from '@angular/core';
import { NodewarRetrivalService } from '../services/nodewar-retrival.service';
import { NodewarviewComponent } from './nodewarview.component';
import { NodewarviewRoutingModule } from './nodewarview-routing.module';

@NgModule({
  imports: [
    NodewarviewComponent,
    NodewarviewRoutingModule
  ],
  providers: [
    NodewarRetrivalService
  ],
})
export class NodewarviewModule { }
