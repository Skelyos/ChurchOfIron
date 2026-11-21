import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GAMES, GameId, StaminaConfig } from '../../models/planner.model';
import { isStaminaConfig, staminaRules } from '../../services/stamina';

export interface StaminaSettingsModalData {
  settings: Partial<Record<GameId, StaminaConfig>>;
}

@Component({
  selector: 'app-stamina-settings-modal',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  templateUrl: './stamina-settings-modal.component.html',
  styleUrls: ['../../planner-common.scss', '../modal-common.scss', './stamina-settings-modal.component.scss'],
})
export class StaminaSettingsModalComponent {
  readonly data = inject<StaminaSettingsModalData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<StaminaSettingsModalComponent, Record<GameId, StaminaConfig>>);
  readonly games = GAMES;
  readonly error = signal('');
  private readonly customMax: Record<GameId, boolean>;
  readonly draft: Record<GameId, StaminaConfig> = {
    zzz: { level: 1, max: null, ...this.data.settings.zzz },
    wuwa: { level: 1, max: null, ...this.data.settings.wuwa },
    endfield: { level: 1, max: null, ...this.data.settings.endfield },
  };

  constructor() {
    this.customMax = {
      zzz: this.data.settings.zzz?.max != null,
      wuwa: this.data.settings.wuwa?.max != null,
      endfield: this.data.settings.endfield?.max != null,
    };
    for (const game of this.games) {
      if (this.draft[game.id].level === null) {
        this.draft[game.id].level = 1;
      }
      if (!this.customMax[game.id]) {
        this.draft[game.id].max = this.defaultMax(game.id);
      }
    }
  }

  defaultMax(game: GameId): number | null {
    const config = this.draft[game];
    if (game === 'endfield' && !isStaminaConfig(game, { ...config, max: null })) return null;
    return staminaRules(game, { level: config.level, max: null }).max;
  }

  onLevelChange(game: GameId): void {
    if (game === 'endfield' && !this.customMax.endfield) {
      this.draft.endfield.max = this.defaultMax(game);
    }
  }

  onLevelInput(game: GameId, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.draft[game].level = value === '' ? null : Number(value);
    this.onLevelChange(game);
  }

  onMaxChange(game: GameId, value: number | null): void {
    this.customMax[game] = value != null;
  }

  save(): void {
    for (const game of this.games) {
      if (!isStaminaConfig(game.id, this.draft[game.id])) {
        this.error.set(`${game.name}: enter a whole-number maximum above zero and a valid account level${game.id === 'endfield' ? ' from 1 to 60' : ' above zero'}.`);
        return;
      }
    }
    this.ref.close(structuredClone(this.draft));
  }
}
