import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PatternService {
  private apiUrl = 'http://localhost:5000/'; // Flask backend endpoint
  private elasticsearchUrl = 'http://localhost:9200';
  constructor(private http: HttpClient) {}

  savePattern(patternData: any): Observable<any> {
    return this.http.post(this.apiUrl + 'save-pattern', patternData);
  }

  updatePattern(patternId: any, updatedPattern: any): Observable<any> {
    const url = `${this.elasticsearchUrl}/patterns/_update/${patternId}`; // API endpoint for updating the pattern
    const body = { doc: updatedPattern }; // Wrap updates in a "doc" field

    return this.http.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  fetchIndicesByPattern(patternName: string): Observable<any> {
    const url = `${this.elasticsearchUrl}/_cat/indices/${patternName}-*/?format=json`;
    return this.http.get<any>(url).pipe(
      catchError((error) => {
        console.error('Error fetching indices:', error);
        return throwError(error); // Rethrow the error so it can be handled in the component
      })
    );
  }

  // Function to query the patterns index
  queryPatterns(patternName: string): Observable<any> {
    const url = `${this.elasticsearchUrl}/patterns/_search`;
    const query = {
      query: {
        match: {
          pattern_name: patternName,
        },
      },
    };

    return this.http.post<any>(url, query);
  }

  // Method to upload log file
  uploadLogFile(formData: FormData): Observable<any> {
    const headers = new HttpHeaders();
    // No Content-Type header for FormData, the browser sets it automatically with the boundary
    return this.http.post(this.apiUrl + 'upload-log', formData, { headers });
  }

  deleteIndexByIndex(id: string): Observable<any> {
    const url = `${this.elasticsearchUrl}/${id}`; // Adjust endpoint as needed
    return this.http.delete(url);
  }

  // Fetch data Erros from a specific index
  fetchErrors(indexName: string, query: any = {}): Observable<any> {
    const url = `${this.elasticsearchUrl}/${indexName}/_search`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.http.post(url, query, { headers });
  }
  fetchIndexDetails(indexName: string): Observable<any> {
    // Using _cat/indices for metadata
    return this.http.get(
      `${this.elasticsearchUrl}/_cat/indices/${indexName}?v=true&format=json`
    );
  }

  // Fetch index metadata
  fetchIndicesError(pattern: string): Observable<any> {
    const url = `${this.elasticsearchUrl}/_cat/indices/${pattern}-*-errors?v&format=json`;
    return this.http.get(url);
  }

  sendEmail(emailData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'send-email', emailData);
  }

  fetchDocumentById(index: string, id: string): Observable<any> {
    const url = `${this.elasticsearchUrl}/${index}/_doc/${id}`;
    return this.http.get(url);
  }
}
