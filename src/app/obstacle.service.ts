import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ObstacleService {
  getDistance(): Observable<number> {
    // Εδώ μπορείς να κάνεις HTTP call στο API σου αργότερα
    const fakeDistance = Math.floor(Math.random() * 100); // Τυχαία απόσταση για δοκιμή
    return of(fakeDistance);
  }
}
