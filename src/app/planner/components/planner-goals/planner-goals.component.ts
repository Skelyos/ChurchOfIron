import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { GAMES, Goal, PlannerEntity } from '../../models/planner.model';
import { isGoalCompatible, pathPosition } from '../../services/calc';

export interface GoalGroup {
  game: (typeof GAMES)[number];
  goals: Goal[];
}

@Component({
  selector: 'app-planner-goals',
  imports: [MatButtonModule, MatCardModule],
  templateUrl: './planner-goals.component.html',
  styleUrls: ['../../planner-common.scss', './planner-goals.component.scss'],
})
export class PlannerGoalsComponent {
  readonly groups = input.required<GoalGroup[]>();
  readonly entities = input.required<Map<string, PlannerEntity>>();
  readonly edit = output<Goal>();
  readonly remove = output<string>();
  readonly isGoalCompatible = isGoalCompatible;
  readonly pathPosition = pathPosition;
}
