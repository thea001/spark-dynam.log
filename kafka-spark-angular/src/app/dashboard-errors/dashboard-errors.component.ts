import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { PatternService } from '../services/patterns.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard-errors',
  templateUrl: './dashboard-errors.component.html',
  styleUrls: ['./dashboard-errors.component.css'],
})
export class DashboardErrorsComponent implements OnInit {
  indexName: any;
  pattern: any;
  dashboard_src: SafeResourceUrl | null = null; // Use SafeResourceUrl
  constructor(
    private route: ActivatedRoute,
    private patterService: PatternService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.pattern = params.get('pattern');
      this.indexName = params.get('id');
      this.fetchPatterns();
    });
  }

  fetchPatterns(): void {
    this.patterService.fetchDocumentById('patterns', this.pattern).subscribe({
      next: (res) => {
        const url = res?._source?.errors_dashboard;
        if (url) {
          // Sanitize the URL before assigning it to the iframe
          this.dashboard_src =
            this.sanitizer.bypassSecurityTrustResourceUrl(url);
        }
      },
      error: (error) => {
        console.error('Error fetching pattern:', error);
      },
    });
  }
}
