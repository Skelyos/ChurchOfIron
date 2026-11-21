import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-planner-panel',
  imports: [MatCardModule],
  template: `
    <mat-card appearance="outlined" class="planner-card">
      <mat-card-header>
        <mat-card-title>{{ heading() }}</mat-card-title>
        <mat-card-subtitle>{{ subtitle() }}</mat-card-subtitle>
        <div class="header-actions"><ng-content select="[panel-actions]" /></div>
      </mat-card-header>
      <mat-card-content><ng-content /></mat-card-content>
    </mat-card>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .planner-card {
      min-width: 0;
      height: auto;
      border-color: var(--mat-sys-outline-variant, #494650);
      border-radius: 18px;
      background: color-mix(in srgb, var(--mat-sys-surface-container, #333) 82%, transparent);
      box-shadow: 0 12px 30px rgb(0 0 0 / 12%);
    }
    .planner-card mat-card-content { padding-top: 14px; }
    .header-actions { margin-left: auto; }
  `,
})
export class PlannerPanelComponent {
  readonly heading = input.required<string>();
  readonly subtitle = input.required<string>();
}
