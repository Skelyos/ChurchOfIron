import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatToChatOnComponent } from './what-to-chat-on.component';

describe('WhatToChatOnComponent', () => {
  let component: WhatToChatOnComponent;
  let fixture: ComponentFixture<WhatToChatOnComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WhatToChatOnComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WhatToChatOnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
