import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { PatternService } from 'src/app/services/patterns.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-pattern',
  templateUrl: './pattern.component.html',
  styleUrls: ['./pattern.component.css'],
})
export class PatternComponent {
  constructor(
    private patternService: PatternService,
    private toastSerivce: ToastService
  ) {}

  // Handle form submission
  onSubmit(formData: NgForm): void {
    document.getElementById('close-patter-modal')?.click();
    this.patternService.savePattern(formData.value).subscribe(
      (response) => {
        this.toastSerivce.show('add');
        formData.reset();
      },
      (error) => {
        this.toastSerivce.show('error');
      }
    );
  }
}
