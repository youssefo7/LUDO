import { NotificationService } from './../state/notification.service';
import { Injectable } from '@angular/core';
import { BubbleApiService } from '../api/bubble-api.service';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ChartDataMetrics } from '../../interfaces/metric.interface';
import { DefiStateService } from '../state/defi-state.service';
import { DISCOVER_DATA_TYPE } from '../../interfaces/discover-data-type';
import { DefiTimeState, ONE_WEEK } from '../../constants/app.constants';
import { ERROR_MSGS } from '../../constants/error-msg.constant';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  chart!: ChartDataMetrics;
  metricsSqueleton: DISCOVER_DATA_TYPE[] = [];
  private chartCache: Record<string, ChartDataMetrics> = {};
  private chartWeeksLimit = 4; // Number of weeks to fetch data for chart

  constructor(
    private readonly apiService: BubbleApiService,
    private readonly stateService: DefiStateService,
    private readonly notificationService: NotificationService,
  ) {}

  async fetchChart() {
    const defiId = this.stateService.defiId;
    const startDate = this.stateService.startDate;
    const endDate = this.stateService.endDate;

    if (defiId && startDate && endDate) {
      const params = new HttpParams()
        .set('DEFI', defiId)
        .set('DAY_INTERVAL', '1')
        .set('START_DATE', startDate.toISOString())
        .set('END_DATE', endDate.toISOString());

      this.chart = (
        await firstValueFrom(
          this.apiService.fetchSingleApi('invitation', params),
        )
      ).response as ChartDataMetrics;
    } else {
      this.notificationService.error(ERROR_MSGS.STATS_CHART_MISSING_INFO);
    }
  }

  async fetchDiscoverData() {
    this.metricsSqueleton =
      await this.apiService.fetchAllDataApiPaginated<DISCOVER_DATA_TYPE>(
        'discover_data_type',
      );
  }

  async fetchMetric(endpoint: string, params: HttpParams) {
    // TODO: Find way to keep data in service
    return (await firstValueFrom(
      this.apiService.fetchSingleApi(endpoint, params),
    )) as { response: { METRIC: string } };
  }

  async fetchWeeklyGraphData(
    endpoint: string,
  ): Promise<ChartDataMetrics | undefined> {
    const defiId = this.stateService.defiId;
    const defiStartDate = this.stateService.defi?.DATE_DEBUT;
    const defiEndDate = this.stateService.defi?.DATE_FIN;

    if (!defiId || !defiStartDate || !defiEndDate) {
      this.notificationService.error(ERROR_MSGS.STATS_CHART_MISSING_INFO);
      return undefined;
    }

    const cacheKey = `${endpoint}-${defiId}-${defiStartDate}-${defiEndDate}`;

    if (this.chartCache[cacheKey]) {
      console.log(`Returning cached data for ${cacheKey}`);
      return this.chartCache[cacheKey];
    }

    const currentStartDate = new Date(defiStartDate);
    const finalEndDate = new Date(defiEndDate);

    const weeklyData: number[] = [];
    const weeklyLabels: string[] = [];
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: '2-digit',
    };

    //fetch pre-defi data
    // Pre-defi data is 8 weeks before start date to start date of defi
    const currentDate = new Date();
    const preDefiStartDate = new Date(currentStartDate.getTime() - 8 * ONE_WEEK)
    preDefiStartDate.setDate(currentDate.getDate());
    const preDefiEndtDate = new Date(currentStartDate);
    preDefiEndtDate.setDate(currentStartDate.getDate() - 1);

    const params = new HttpParams()
      .set('DEFI', defiId)
      .set('START_DATE', preDefiStartDate.toISOString())
      .set('END_DATE', preDefiEndtDate.toISOString());

    const dateLabel = `${DefiTimeState.PRE_DEFI}`;
    try {
      const response = (await firstValueFrom(
        this.apiService.fetchSingleApi(endpoint, params),
      )) as { response: { METRIC: string } };

      weeklyData.push(parseInt(response.response.METRIC, 10) || 0);
      weeklyLabels.push(dateLabel);
    } catch (error) {
      console.error(
        `Failed to fetch data from ${endpoint} for week ${dateLabel}`,
        error,
      );
      weeklyData.push(0);
      weeklyLabels.push(dateLabel);
    }

    //fetch defi data
    // Defi data is from the start date to the end date of the defi
    let weekCounter = 0;
    while (currentStartDate <= finalEndDate && weekCounter <= this.chartWeeksLimit && currentStartDate <= currentDate) {
      weekCounter++;
      const currentEndDate = new Date(currentStartDate);
      currentEndDate.setDate(currentStartDate.getDate() + 6);

      if (currentEndDate > finalEndDate) {
        currentEndDate.setTime(finalEndDate.getTime());
      }
      const params = new HttpParams()
        .set('DEFI', defiId)
        .set('START_DATE', currentStartDate.toISOString())
        .set('END_DATE', currentEndDate.toISOString());

      const dateLabel = `${currentStartDate.toLocaleDateString('fr-CA', options)} - ${currentEndDate.toLocaleDateString('fr-CA', options)}`;
      try {
        const response = (await firstValueFrom(
          this.apiService.fetchSingleApi(endpoint, params),
        )) as { response: { METRIC: string } };

        // Store data
        weeklyData.push(parseInt(response.response.METRIC, 10) || 0);
        weeklyLabels.push(dateLabel);
      } catch (error) {
        console.error(
          `Failed to fetch data from ${endpoint} for week ${dateLabel}`,
          error,
        );
        weeklyData.push(0);
        weeklyLabels.push(dateLabel);
      }

      currentStartDate.setDate(currentStartDate.getDate() + 7);
    }

    const chartData: ChartDataMetrics = {
      data: weeklyData,
      labels: weeklyLabels,
    };
    this.chartCache[cacheKey] = chartData;

    return chartData;
  }
}
