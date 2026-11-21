import { Component, inject, signal, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { GAMES, GameId, PlannerEvent } from '../../models/planner.model';

export interface EventsModalData {
  filter: Signal<GameId | 'all'>;
  event?: PlannerEvent;
  save: (event: PlannerEvent) => void;
}

interface EventDraft {
  id: string;
  game: GameId;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
}

@Component({
  selector: 'app-events-modal',
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './events-modal.component.html',
  styleUrls: ['../../planner-common.scss', '../modal-common.scss', './events-modal.component.scss'],
})
export class EventsModalComponent {
  readonly data = inject<EventsModalData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<EventsModalComponent, string>);
  private readonly initialFilter = this.data.filter();
  readonly games = GAMES;
  readonly eventGame = signal<GameId>(this.data.event?.game ?? (this.initialFilter === 'all' ? 'zzz' : this.initialFilter));
  readonly eventError = signal('');
  readonly eventMessage = signal('');
  readonly keepEventOpen = signal(false);
  private readonly eventDrafts: Partial<Record<GameId, EventDraft>> = {};
  eventDraft: EventDraft = this.data.event ? {
    ...this.data.event,
    startsAt: new Date(this.data.event.startsAt).toISOString().slice(0, -1),
    endsAt: new Date(this.data.event.endsAt).toISOString().slice(0, -1),
  } : this.emptyEventDraft();

  selectEventGame(game: GameId): void {
    this.eventDrafts[this.eventGame()] = this.eventDraft;
    this.eventGame.set(game);
    this.eventDraft = this.eventDrafts[game] ?? this.emptyEventDraft();
    this.eventError.set('');
    this.eventMessage.set('');
  }

  private emptyEventDraft(): EventDraft {
    return { id: '', game: this.eventGame(), name: '', description: '', startsAt: '', endsAt: '' };
  }

  cancelEvent(): void {
    this.eventDraft = this.emptyEventDraft();
    this.eventError.set('');
    this.eventMessage.set('');
  }

  saveEvent(): void {
    const draft = this.eventDraft;
    const start = new Date(`${draft.startsAt}Z`);
    const end = new Date(`${draft.endsAt}Z`);
    this.eventMessage.set('');
    if (!draft.name.trim() || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) ||
        end.getTime() <= start.getTime()) {
      this.eventError.set('Enter a name and valid dates; the end must be after the start.');
      return;
    }
    this.data.save({
      id: draft.id || crypto.randomUUID(),
      game: draft.game,
      name: draft.name.trim(),
      description: draft.description.trim(),
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      source: 'manual',
    });
    this.cancelEvent();
    const filter = this.data.filter();
    const visible = filter === 'all' || filter === draft.game;
    if (this.keepEventOpen()) {
      this.eventMessage.set(visible
        ? 'Event saved. Close this dialog to view it on the planner.'
        : 'Event saved. Close this dialog and change the planner game filter to view it.');
    } else {
      this.ref.close(visible ? 'Event saved.' : 'Event saved. Change the planner game filter to view it.');
    }
  }
}
