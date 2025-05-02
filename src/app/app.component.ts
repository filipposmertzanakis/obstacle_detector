import { Component, OnInit } from '@angular/core';
import { ObstacleService } from './obstacle.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  distance: number = 0;
  warningThreshold = 30;

  constructor(private obstacleService: ObstacleService) {}

  ngOnInit() {
    this.fetchDistance();
    setInterval(() => this.fetchDistance(), 3000); // κάθε 3 δευτερόλεπτα
  }

  speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.cancel(); // σταματά προηγούμενη ομιλία
    speechSynthesis.speak(utterance);
  }
  
  wasInDanger = false;

  fetchDistance() {
  this.obstacleService.getDistance().subscribe(data => {
    this.distance = data;

    const inDanger = this.distance < this.warningThreshold;
    if (inDanger && !this.wasInDanger) {
      this.speak(`watch out there is an obstacle in  ${this.distance} centimeters`);
      console.log(`Obstacle detected at ${this.distance} cm`);
    } else if (!inDanger && this.wasInDanger) {
      this.speak(`safe distance: ${this.distance} centimeters`);
      console.log(`Safe distance: ${this.distance} cm`);
    }

    this.wasInDanger = inDanger;
  });
}
}
