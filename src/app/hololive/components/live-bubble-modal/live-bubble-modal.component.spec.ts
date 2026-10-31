import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { HolotoolsService } from '../../../services/holotools.service';

import { LiveBubbleModalComponent } from './live-bubble-modal.component';

describe('LiveBubbleModalComponent', () => {
  let component: LiveBubbleModalComponent;
  let fixture: ComponentFixture<LiveBubbleModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LiveBubbleModalComponent],
      providers: [
        {
          provide: HolotoolsService,
          useValue: { getHololiveLives: () => of({ upcoming: [] }) },
        },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LiveBubbleModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
