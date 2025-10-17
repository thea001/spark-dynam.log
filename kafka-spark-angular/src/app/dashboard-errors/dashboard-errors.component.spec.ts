import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardErrorsComponent } from './dashboard-errors.component';

describe('DashboardErrorsComponent', () => {
  let component: DashboardErrorsComponent;
  let fixture: ComponentFixture<DashboardErrorsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardErrorsComponent]
    });
    fixture = TestBed.createComponent(DashboardErrorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
