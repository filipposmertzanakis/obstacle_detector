import { Component, OnInit } from '@angular/core';
import { ObstacleService } from './obstacle.service';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  distance: number = 0;
  warningThreshold = 30;
  chart: any;
  distances: number[] = []; // Array to store distance values for chart
  timeLabels: string[] = []; // Labels for time, can be timestamps or other identifiers

  constructor(private obstacleService: ObstacleService) {}

  ngOnInit() {
    this.fetchDistance();
    setInterval(() => this.fetchDistance(), 3000); // every 3 seconds

    // Initialize the chart
    this.initializeChart();
  }

  speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.cancel(); // stop previous speech
    speechSynthesis.speak(utterance);
  }

  wasInDanger = false;

  fetchDistance() {
    this.obstacleService.getDistance().subscribe(data => {
      this.distance = data;
      this.distances.push(this.distance); // Add the latest distance to chart data
      this.timeLabels.push(new Date().toLocaleTimeString()); // Add timestamp as label
      
      // Limit the length of the data arrays for performance
      if (this.distances.length > 30) {
        this.distances.shift();
        this.timeLabels.shift();
      }

      // Update chart with new data
      this.updateChart();

      const inDanger = this.distance < this.warningThreshold;
      if (inDanger && !this.wasInDanger) {
        this.speak(`Watch out! There is an obstacle at ${this.distance} centimeters.`);
        console.log(`Obstacle detected at ${this.distance} cm`);
      } else if (!inDanger && this.wasInDanger) {
        this.speak(`Safe distance: ${this.distance} centimeters.`);
        console.log(`Safe distance: ${this.distance} cm`);
      }

      this.wasInDanger = inDanger;
    });
  }

  // Initialize the chart
  initializeChart() {
    this.chart = new Chart('distanceChart', {
      type: 'line',
      data: {
        labels: this.timeLabels,
        datasets: [
          {
            label: 'Distance (cm)',
            data: this.distances,
            borderColor: 'rgba(75, 192, 192, 1)',
            fill: false
          }
        ]
      },
      options: {
        scales: {
          y: { beginAtZero: true },
          x: {
            ticks: {
              autoSkip: true,
              maxTicksLimit: 10
            }
          }
        }
      }
    });
  }

  // Update the chart with new data
  updateChart() {
    this.chart.data.labels = this.timeLabels;
    this.chart.data.datasets[0].data = this.distances;
    this.chart.update();
  }
}
