import { Component, OnInit } from '@angular/core';
import { ObstacleService } from './obstacle.service';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  distance: number = 0;
  previousDistance: number = 0;
  wasInDanger: boolean = false;


  warningThreshold = 300; // in cm
  cautionThreshold = 150;
  criticalThreshold = 50;
  isAudioMuted = false;

  distances: number[] = [];
  timeLabels: string[] = [];
  chart: any;

  // Audio
  audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  oscillator: OscillatorNode | null = null;
  gainNode: GainNode | null = null;
  beepingInterval: any = null;

  constructor(private obstacleService: ObstacleService) {}

  ngOnInit() {
    Chart.register(...registerables);
    this.initializeChart();
    this.fetchDistance();
    setInterval(() => this.fetchDistance(), 15000); // every 1.5 sec
  }
  
  fetchDistance() {
    this.obstacleService.getDistance().subscribe(data => {
      this.previousDistance = this.distance;
      this.distance = data;

      this.distances.push(this.distance);
      this.timeLabels.push(new Date().toLocaleTimeString());

      if (this.distances.length > 100) {
        this.distances.shift();
        this.timeLabels.shift();
      }

      this.updateChart();

      const inDanger = this.distance < this.warningThreshold;

      if (inDanger && !this.isAudioMuted) {
        this.startOrUpdateBeeping();
      } else {
        this.stopBeeping();
      }

      // Looming detection
      const delta = this.previousDistance - this.distance;
      if (delta > 30) {
        this.speak("Rapid approach detected!");
      }

      // Clear path confirmation
      if (!inDanger && this.wasInDanger) {
        setTimeout(() => {
          if (this.distance >= this.warningThreshold) {
            this.speak("Safe distance.");
          }
        }, 2000);
      }

      this.wasInDanger = inDanger;
    }, error => {
      console.error('Error fetching distance:', error);
    });
  }

  // Audio alert system
  startOrUpdateBeeping() {
    if (this.beepingInterval) return;

    const beep = () => {
      if (this.isAudioMuted) return;

      const zone = this.getDangerZone();
      const frequency = this.calculatePitch(zone);
      const interval = this.calculateBeepInterval(zone);
      const waveform = this.getWaveform(zone);

      this.playBeep(frequency, waveform);
      this.stopBeepAfter(0.2); // seconds

      this.beepingInterval = setTimeout(() => {
        this.beepingInterval = null;
        this.startOrUpdateBeeping();
      }, interval);
    };

    beep();
  }

  stopBeeping() {
    if (this.beepingInterval) {
      clearTimeout(this.beepingInterval);
      this.beepingInterval = null;
    }
    this.stopBeep();
  }

  playBeep(frequency: number, type: OscillatorType) {
  this.oscillator = this.audioCtx.createOscillator();
  this.gainNode = this.audioCtx.createGain();

  this.oscillator.type = type;
  this.oscillator.frequency.value = frequency;

  const now = this.audioCtx.currentTime;
  const duration = 0.4; // seconds

  // Set up soft fade-in and fade-out
  this.gainNode.gain.setValueAtTime(0, now);
  this.gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05); // fade in
  this.gainNode.gain.linearRampToValueAtTime(0, now + duration); // fade out

  this.oscillator.connect(this.gainNode);
  this.gainNode.connect(this.audioCtx.destination);

  this.oscillator.start(now);
  this.oscillator.stop(now + duration);
}

stopBeepAfter(duration: number) {
  if (this.oscillator) {
    this.oscillator.stop(this.audioCtx.currentTime + duration);
  }
}

stopBeep() {
  if (this.oscillator) {
    try {
      this.oscillator.stop();
      this.oscillator.disconnect();
    } catch (_) {}
  }
  if (this.gainNode) {
    this.gainNode.disconnect();
  }
}

getDangerZone(): 'caution' | 'warning' | 'critical' {
  if (this.distance < this.criticalThreshold) return 'critical';
  if (this.distance < this.cautionThreshold) return 'warning';
  return 'caution';
}

calculatePitch(zone: string): number {
  switch (zone) {
    case 'critical': return 600;   
    case 'warning': return 450;    
    case 'caution': return 300;    
    default: return 250;
  }
}

calculateBeepInterval(zone: string): number {
  switch (zone) {
    case 'critical': return 500;   
    case 'warning': return 1000;
    case 'caution': return 2000;
    default: return 3000;
  }
}

getWaveform(zone: string): OscillatorType {
  switch (zone) {
    case 'critical': return 'triangle';   
    case 'warning': return 'sine';       
    case 'caution': return 'sine';       
    default: return 'sine';
  }
}

  speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }

  // Chart setup
  initializeChart() {
    this.chart = new Chart('distanceChart', {
      type: 'line',
      data: {
        labels: this.timeLabels,
        datasets: [{
          label: 'Distance (cm)',
          data: this.distances,
          borderColor: 'rgba(75, 192, 192, 1)',
          fill: false
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true },
          x: {
            ticks: {
              autoSkip: true,
              maxTicksLimit: 100
            }
          }
        }
      }
    });
  }

  updateChart() {
    if (!this.chart) return;
    this.chart.data.labels = [...this.timeLabels];
    this.chart.data.datasets[0].data = [...this.distances];
    this.chart.update();
  }

  // UI logic (bind to class)
  getAlertSeverityClass(): string {
    if (this.distance < this.criticalThreshold) return 'alert-critical';
    if (this.distance < this.cautionThreshold) return 'alert-warning';
    return 'alert-caution';
  }

  toggleMute() {
    this.isAudioMuted = !this.isAudioMuted;
    if (this.isAudioMuted) {
      this.stopBeeping();
    } else if (this.distance < this.warningThreshold) {
      this.startOrUpdateBeeping();
    }
  }
}
