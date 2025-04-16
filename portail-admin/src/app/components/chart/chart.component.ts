import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ChartOptions, ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { StatsService } from '../../services/logic/stats.service';
import { DefiStateService } from '../../services/state/defi-state.service';
import { PRIMARY_COLOR_HEX } from '../../constants/app.constants';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [BaseChartDirective, CommonModule],
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
})
export class ChartComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;
  title = 'ng2-charts-demo';
  private defiSubscription!: Subscription;
  isDataLoaded = false; // Track whether data is ready

  constructor(
    private statsService: StatsService,
    private readonly stateService: DefiStateService,
  ) {}

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Series A',
        fill: true,
        tension: 0.5,
        borderColor: 'black',
        backgroundColor: PRIMARY_COLOR_HEX,
      },
    ],
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Nombre d'invitations par jour",
        color: '#ffffff',
        font: {
          size: 18,
          weight: 'bold',
        },
        padding: {
          bottom: 5,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: '#e0e0e0',
        },
        ticks: {
          color: '#ffffff',
        },
        title: {
          display: true,
          text: 'Date',
          color: '#ffffff',
          font: {
            size: 14,
          },
        },
      },
      y: {
        grid: {
          display: true,
          color: '#e0e0e0',
        },
        ticks: {
          color: '#ffffff',
        },
        title: {
          display: true,
          text: '# Invitations',
          color: '#ffffff',
          font: {
            size: 14,
          },
        },
      },
    },
  };

  public lineChartLegend = false;

  async ngOnInit() {
    this.defiSubscription = this.stateService.dates$.subscribe(async () => {
      await this.statsService.fetchChart();

      // Update chart data
      this.lineChartData.labels = this.statsService.chart.labels.map(
        (ts: string) => {
          const date = new Date(Number(ts));
          return date.toLocaleDateString('fr-CA', {
            day: '2-digit',
            month: '2-digit',
          });
        },
      );
      this.lineChartData.datasets[0].data = this.statsService.chart.data;
      this.lineChartData.datasets[0].label = 'Invitations';

      // Ensure the chart updates
      if (this.chart) {
        this.chart.update();
      }

      // Mark data as loaded
      this.isDataLoaded = true;
    });
  }

  ngOnDestroy() {
    if (this.defiSubscription) {
      this.defiSubscription.unsubscribe();
    }
  }
}
