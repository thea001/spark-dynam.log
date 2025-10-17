import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashobardComponent } from './dashobard.component';

describe('DashobardComponent', () => {
  let component: DashobardComponent;
  let fixture: ComponentFixture<DashobardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DashobardComponent]
    });
    fixture = TestBed.createComponent(DashobardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
