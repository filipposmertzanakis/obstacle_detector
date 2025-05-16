import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';

interface DistanceResponse {
  feeds: { field1: string }[]; // Array of feeds containing field1 as a string
}

@Injectable({
  providedIn: 'root'
})
export class ObstacleService {
  private readonly apiUrl = 'https://api.thingspeak.com/channels/2955606/fields/1.json?api_key=WMG4LZ2CEPJ8X8TW&results=2';

  constructor(private httpClient: HttpClient) {}

  // Fetching the distance data from the API
  getDistance(): Observable<number> {
    return this.httpClient.get<DistanceResponse>(this.apiUrl).pipe(
      tap(response => console.log('API Response:', response)), // Log the full response for debugging
      map(response => {
        // Access the last feed and convert field1 to a number
        const lastFeed = response.feeds[response.feeds.length - 1];
        return lastFeed ? parseFloat(lastFeed.field1) : 0; // Return 0 if no feed is available
      })
    );
  }
}
