import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GAMES, GameId } from '../../models/planner.model';

export interface StaminaDisplay {
  game: (typeof GAMES)[number];
  current: number;
  max: number;
  timeToReady: string;
}

@Component({
  selector: 'app-planner-stamina',
  imports: [FormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './planner-stamina.component.html',
  styleUrls: ['../../planner-common.scss', './planner-stamina.component.scss'],
})
export class PlannerStaminaComponent {
  readonly rows = input.required<StaminaDisplay[]>();
  readonly currentChange = output<{ game: GameId; value: number }>();
}
