import { Component, OnInit } from '@angular/core';
import { PatternService } from '../services/patterns.service';
import { NgForm } from '@angular/forms';
import { ToastService } from '../services/toast.service';
import { ActivatedRoute, ParamMap } from '@angular/router';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css'],
})
export class SideNavComponent implements OnInit {
  [x: string]: any;
  notificationlist: any;
  indicesList: any;
  patterns: any;
  pattern_name: any;
  to_delete_index: any;
  indexName: any;
  to_update_pattern: any;
  constructor(
    private patterService: PatternService,
    private toastService: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.fetchPatterns();
  }

  fetchIndices(pattern: any): void {
    this.patterService.fetchIndicesByPattern(pattern).subscribe(
      (response) => {
        this.indicesList = response;
        console.log(this.indicesList);
      },
      (error) => {
        console.error('Error fetching indices:', error);
      }
    );
  }

  fetchPatterns() {
    this.patterService.queryPatterns('data-center-').subscribe((res) => {
      this.patterns = res?.hits?.hits;
      console.log(this.patterns);
    });
  }

  deleteIndex(): void {
    document.getElementById('close-delete-modal')?.click();
    this.patterService
      .deleteIndexByIndex(this.to_delete_index?.index)
      .subscribe(
        (response) => {
          this.toastService.show('delete');
          this.fetchIndices(this.pattern_name);
          // Handle success response
        },
        (error) => {
          this.toastService.show('error');
          // Handle error response
        }
      );
  }

  onSendFile(fileForm: NgForm): void {
    document.getElementById('close-file-modal')?.click();
    const fileInput = (document.getElementById('file') as HTMLInputElement)
      .files;
    if (!fileForm.valid) return;
    // Ensure a file is selected
    if (fileInput && fileInput.length > 0) {
      console.log(fileInput[0]);
      const file = fileInput[0];
      const formData = new FormData();
      formData.append('logFile', file);
      formData.append('pattern', this.pattern_name);

      // Send the file to the service
      this.patterService.uploadLogFile(formData).subscribe(
        (response) => {
          this.toastService.show('add');
          // Handle success (e.g., close modal, show a success message)
        },
        (error) => {
          this.toastService.show('error');
          // Handle error (e.g., show an error message)
        }
      );
    }
  }

  onUpdatePattern(patternUpdateForm: NgForm): void {
    document.getElementById('close-patter-update-modal')?.click();
    this.to_update_pattern._source.normal_dashboard =
      patternUpdateForm.value?.normal_dashboard;
    if (patternUpdateForm.value?.errors_dashboard) {
      this.to_update_pattern._source.errors_dashboard =
        patternUpdateForm.value?.errors_dashboard;
    }

    const payload = {
      normal_dashboard: this.to_update_pattern._source.normal_dashboard,
      errors_dashboard: this.to_update_pattern._source.errors_dashboard,
    };

    this.patterService
      .updatePattern(this.to_update_pattern._id, payload)
      .subscribe({
        next: (res) => {
          this.toastService.show('edit');
          patternUpdateForm.reset();
        },
        error: (err) => this.toastService.show('error'),
      });
  }
}
