import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { StatsService } from '../../../services/logic/stats.service';
import { DefiStateService } from '../../../services/state/defi-state.service';
import {
  DISCOVER_DATA_TYPE,
  METRIC_TYPE,
} from '../../../interfaces/discover-data-type';
import { Subscription, distinctUntilChanged } from 'rxjs';
import { MetricsService } from '../../../services/logic/metrics.service';
import { TimeSlotComponentComponent } from '../../time-slot-component/time-slot-component.component';

@Component({
  selector: 'app-metrics-stats-chart',
  standalone: true,
  templateUrl: './metrics-stats-chart.component.html',
  styleUrls: ['./metrics-stats-chart.component.scss'],
  imports: [
    CommonModule,
    BarChartComponent,
    MaterialModule,
    TimeSlotComponentComponent,
  ],
})
export class MetricsStatsChartComponent implements OnInit, OnDestroy {
  public METRIC_GROUP = METRIC_TYPE;

  selectedMetric: DISCOVER_DATA_TYPE | null = null;
  weeklyGraphLabels: string[] = [];
  weeklyGraphData: number[] = [];
  chartTitle = '';

  activeCategory = 'global';
  activeMetricType: METRIC_TYPE = METRIC_TYPE.GLOBAL;

  metricValues = new Map<DISCOVER_DATA_TYPE, string>();
  metricColors = new Map<DISCOVER_DATA_TYPE, string>();

  isLoading = true;
  loadingError = false;

  private readonly subscriptions: Subscription[] = [];

  constructor(
    public readonly statsService: StatsService,
    private readonly stateService: DefiStateService,
    public readonly metricsService: MetricsService,
  ) {}

  ngOnInit(): void {
    this.loadMetricsData();

    this.subscriptions.push(
      this.stateService.dates$
        .pipe(
          distinctUntilChanged((prev, curr) => {
            return (
              prev.start?.getTime() === curr.start?.getTime() &&
              prev.end?.getTime() === curr.end?.getTime()
            );
          }),
        )
        .subscribe(() => {
          this.updateAllMetricValues();
          if (this.selectedMetric) {
            this.onStatTileClick(this.selectedMetric);
          }
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  public async loadMetricsData(): Promise<void> {
    try {
      this.isLoading = true;
      this.loadingError = false;

      await this.statsService.fetchDiscoverData();

      if (this.statsService.metricsSqueleton.length === 0) {
        this.loadingError = true;
        return;
      }

      this.initializeMetricValues();
      this.initializeDefaultMetric();
    } catch {
      this.loadingError = true;
    } finally {
      this.isLoading = false;
    }
  }

  private initializeMetricValues(): void {
    if (
      !this.stateService.startDate ||
      !this.stateService.endDate ||
      !this.stateService.defiId
    ) {
      return;
    }

    this.getStatsForGroup(this.activeMetricType).forEach((metric) => {
      this.metricColors.set(metric, this.metricsService.getMetricColor(metric));
      this.metricValues.set(metric, '0');
      this.fetchMetricValue(metric);
    });
  }

  private async fetchMetricValue(metric: DISCOVER_DATA_TYPE): Promise<void> {
    if (
      !this.stateService.startDate ||
      !this.stateService.endDate ||
      !this.stateService.defiId
    ) {
      return;
    }
    const params = new HttpParams()
      .set('START_DATE', this.stateService.startDate.toISOString())
      .set('END_DATE', this.stateService.endDate.toISOString())
      .set('DEFI', this.stateService.defiId);

    const response = await this.statsService.fetchMetric(
      metric.ENDPOINT,
      params,
    );
    if (response?.response?.METRIC !== undefined) {
      this.metricValues.set(metric, response.response.METRIC);
    }
  }

  selectCategory(category: string): void {
    this.activeCategory = category;

    switch (category) {
      case 'global':
        this.activeMetricType = METRIC_TYPE.GLOBAL;
        break;
      case 'invitation':
        this.activeMetricType = METRIC_TYPE.INVITATION;
        break;
      case 'social':
        this.activeMetricType = METRIC_TYPE.SOCIAL;
        break;
      default:
        this.activeMetricType = METRIC_TYPE.GLOBAL;
    }
    const metrics = this.getStatsForGroup(this.activeMetricType);
    if (
      metrics.length > 0 &&
      (!this.selectedMetric ||
        this.selectedMetric.METRIC_TYPE !== this.activeMetricType)
    ) {
      this.onStatTileClick(metrics[0]);
    }

    if (
      !Array.from(this.metricValues.keys()).some(
        (m: DISCOVER_DATA_TYPE) =>
          m.METRIC_TYPE === this.selectedMetric?.METRIC_TYPE,
      )
    ) {
      metrics.forEach((metric) => {
        this.metricColors.set(
          metric,
          this.metricsService.getMetricColor(metric),
        );
        this.fetchMetricValue(metric);
      });
    }
  }

  getMetricValue(metric: DISCOVER_DATA_TYPE): string {
    const value = this.metricValues.get(metric);
    if (value === undefined) {
      return '-';
    }
    if (metric.KPI_TYPE === 'POURCENTAGE') {
      return `${Math.round(parseFloat(value))}%`;
    }
    return value;
  }

  getMetricColor(metric: DISCOVER_DATA_TYPE): string {
    return this.metricColors.get(metric) ?? '';
  }

  getMetricIcon(metric: DISCOVER_DATA_TYPE): string {
    return this.metricsService.getMetricIcon(metric);
  }

  private initializeDefaultMetric(): void {
    const globalMetrics = this.getStatsForGroup(METRIC_TYPE.GLOBAL);
    this.selectCategory('global');
    this.onStatTileClick(globalMetrics[0]);
  }

  getStatsForGroup(groupName: METRIC_TYPE): DISCOVER_DATA_TYPE[] {
    return this.statsService.metricsSqueleton
      .filter((item) => item.METRIC_TYPE === groupName)
      .sort((a, b) => a.RANG - b.RANG);
  }

  async onStatTileClick(metric: DISCOVER_DATA_TYPE): Promise<void> {
    this.selectedMetric = metric;
    this.chartTitle = `Évolution des ${metric.LABEL_FR} par semaine`;

    // Reset chart data to empty arrays
    this.weeklyGraphLabels = [];
    this.weeklyGraphData = [];

    const chartData = await this.statsService.fetchWeeklyGraphData(
      metric.ENDPOINT,
    );

    if (
      chartData &&
      chartData.labels &&
      chartData.labels.length > 0 &&
      chartData.data &&
      chartData.data.length > 0
    ) {
      // Set chart data if available
      this.weeklyGraphLabels = chartData.labels;
      this.weeklyGraphData = chartData.data;
    } else {
      // Create a fallback chart with the current metric value
      const value = this.metricValues.get(metric);
      if (value) {
        const numValue = parseFloat(value);
        this.weeklyGraphLabels = ['Total'];
        this.weeklyGraphData = [isNaN(numValue) ? 0 : numValue];
      } else {
        this.weeklyGraphLabels = ['Pas de données'];
        this.weeklyGraphData = [0];
      }
    }
  }

  private updateAllMetricValues(): void {
    Array.from(this.metricValues.keys()).forEach((metric) => {
      this.fetchMetricValue(metric);
    });
  }
}
