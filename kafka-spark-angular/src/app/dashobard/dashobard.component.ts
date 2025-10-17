import { Component } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { PatternService } from '../services/patterns.service';

@Component({
  selector: 'app-dashobard',
  templateUrl: './dashobard.component.html',
  styleUrls: ['./dashobard.component.css'],
})
export class DashobardComponent {
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
        const url = res?._source?.normal_dashboard;
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
