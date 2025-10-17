import { Component } from '@angular/core';
import { PatternService } from '../services/patterns.service';
import { ActivatedRoute, ParamMap } from '@angular/router';

@Component({
  selector: 'app-errors-info',
  templateUrl: './errors-info.component.html',
  styleUrls: ['./errors-info.component.css'],
})
export class ErrorsInfoComponent {
  indexName: any;
  doc_count: any;
  file_size: any;
  indexDetails: any;
  data: any[] = []; // Holds the fetched data
  displayedColumns: string[] = [
    '_id',
    'error_type',
    'destination_host',
    'local_host',
  ]; // Replace with your fields

  constructor(
    private elasticService: PatternService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.indexName = params.get('id');
    });
    this.loadData();
    this.loadIndexMetaData();
  }

  loadData(): void {
    const query = {
      query: {
        match_all: {},
      },
      size: 10, // Number of records to fetch
    };

    this.elasticService.fetchErrors(this.indexName, query).subscribe({
      next: (response) => {
        this.data = response.hits.hits.map((hit: any) => ({
          _id: hit._id,
          ...hit._source,
        }));
        console.log(response);
        this.doc_count = response.hits.total?.value || 0; // Ensure total exists and fallback to 0 if unavailable
        this.file_size = response._shards?.total?.store?.size || 'Unknown'; // Adjust path based on the actual response structure
      },
      error: (error) => {
        console.error('Error fetching data from Elasticsearch:', error);
      },
    });
  }

  loadIndexMetaData() {
    this.elasticService.fetchIndexDetails(this.indexName).subscribe({
      next: (data) => {
        this.indexDetails = data[0]; // _cat/indices returns an array
        console.log('Index Metadata:', this.indexDetails);
      },
      error: (err) => {
        console.error('Error fetching index metadata:', err);
      },
    });
  }
}
