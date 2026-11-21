import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PlannerEvent } from '../../models/planner.model';

export interface EventDisplay {
  event: PlannerEvent;
  gameName: string;
  countdown: string;
  start: string;
  end: string;
}

@Component({
  selector: 'app-planner-events',
  imports: [MatButtonModule, MatCardModule],
  templateUrl: './planner-events.component.html',
  styleUrls: ['../../planner-common.scss', './planner-events.component.scss'],
})
export class PlannerEventsComponent {
  readonly events = input.required<EventDisplay[]>();
  readonly edit = output<PlannerEvent>();
  readonly remove = output<string>();
}
