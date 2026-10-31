import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';

import { ViewScreenComponent } from './view-screen.component';

describe('ViewScreenComponent', () => {
  let component: ViewScreenComponent;
  let fixture: ComponentFixture<ViewScreenComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ViewScreenComponent],
      providers: [{ provide: MatDialog, useValue: { open: jasmine.createSpy('open') } }],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
