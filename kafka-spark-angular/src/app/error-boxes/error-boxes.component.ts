import { Component, OnDestroy, OnInit } from '@angular/core';
import { PatternService } from '../services/patterns.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-error-boxes',
  templateUrl: './error-boxes.component.html',
  styleUrls: ['./error-boxes.component.css'],
})
export class ErrorBoxesComponent implements OnInit, OnDestroy {
  indexName: any;
  indices: any;
  error: any;
  remainingTime: number = 5;
  intervalId: any;
  isAllowedEmail: boolean = false;
  constructor(
    private elasticService: PatternService,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.indexName = params.get('id');
      this.indices = null;

      // Clear existing intervals before starting new polling
      this.clearIntervals();

      this.getIndicesMetadata(this.indexName);
      // Start polling for index updates
      this.startPollingForIndexUpdates(this.indexName!);
    });
  }

  getIndicesMetadata(pattern: string): void {
    this.elasticService.fetchIndicesError(pattern).subscribe({
      next: (response) => {
        this.indices = response.map((index: any) => {
          const previousIndex = this.indices?.find(
            (i: any) => i?.name === index?.index
          );

          const newIndex = {
            name: index?.index,
            docCount: index?.['docs.count'],
            fileSize: index?.['store.size'],
            health: index?.health,
            previousDocCount: previousIndex?.docCount || null, // Preserve previous doc count
            newDocCountAlert: previousIndex
              ? previousIndex.docCount !== index?.['docs.count']
              : false, // Check for changes
          };

          if (this.isAllowedEmail && newIndex.newDocCountAlert) {
            const emailData = {
              subject: 'Index Update Alert',
              body: 'The index has new data.',
              previous_count: newIndex?.previousDocCount,
              new_count: newIndex?.newDocCountAlert
                ? newIndex?.newDocCountAlert
                : newIndex?.previousDocCount,
              index_name: newIndex?.name,
            };

            this.sendEmail(emailData);
          }

          return newIndex;
        });
      },
      error: (error) => {
        console.error('Error fetching index metadata:', error);
        this.error = 'Unable to fetch index metadata.';
      },
    });
  }

  startPollingForIndexUpdates(pattern: string): void {
    // Ensure all intervals are cleared before starting new ones
    this.clearIntervals();

    // Polling interval for fetching data
    const fetchInterval = setInterval(() => {
      this.getIndicesMetadata(pattern); // Fetch data

      // Reset countdown timer
      this.remainingTime = 5;
    }, 5000);

    // Countdown timer for updating `remainingTime`
    const countdownInterval = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--; // Decrease remaining time by 1 second
      }
    }, 1000);

    // Store both intervals
    this.intervalId = { fetch: fetchInterval, countdown: countdownInterval };
  }

  clearIntervals(): void {
    // Clear fetch and countdown intervals if they exist
    if (this.intervalId) {
      clearInterval(this.intervalId.fetch);
      clearInterval(this.intervalId.countdown);
    }
  }

  sendEmail(emailData: any): void {
    this.elasticService.sendEmail(emailData).subscribe({
      next: (response) => {
        this.toastService.show('add');
      },
      error: (error) => {
        this.toastService.show('error');
      },
    });
  }

  ngOnDestroy(): void {
    // Clear intervals when the component is destroyed
    this.clearIntervals();
  }
}
