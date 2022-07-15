import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveBubbleModalComponent } from './live-bubble-modal.component';

describe('LiveBubbleModalComponent', () => {
  let component: LiveBubbleModalComponent;
  let fixture: ComponentFixture<LiveBubbleModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LiveBubbleModalComponent ]
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
