import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorBoxesComponent } from './error-boxes.component';

describe('ErrorBoxesComponent', () => {
  let component: ErrorBoxesComponent;
  let fixture: ComponentFixture<ErrorBoxesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ErrorBoxesComponent]
    });
    fixture = TestBed.createComponent(ErrorBoxesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
