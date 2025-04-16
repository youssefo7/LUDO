import { AuthService } from './../../services/api/auth.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DefiService } from '../../services/logic/defi.service';
import { MissionStatsComponent } from '../../components/missions/mission-stats/mission-stats.component';
import { StatsService } from '../../services/logic/stats.service';
import { DefiStateService } from '../../services/state/defi-state.service';
import { DefiSelectorComponent } from '../../components/defi-selector/defi-selector.component';
import { CommonModule } from '@angular/common';
import { ParticipantLeaderboardComponent } from '../../components/stats/participant-leaderboard/participant-leaderboard.component';
import { CompetitionLeaderboardComponent } from '../../components/stats/competition-leaderboard/competition-leaderboard.component';
import { MaterialModule } from '../../material.module';
import { MetricsStatsChartComponent } from '../../components/stats/metrics-stats-chart/metrics-stats-chart.component';

@Component({
  selector: 'app-defi-stats',
  standalone: true,
  templateUrl: './defi-stats.component.html',
  styleUrls: ['./defi-stats.component.scss'],
  imports: [
    CommonModule,
    MissionStatsComponent,
    DefiSelectorComponent,
    ParticipantLeaderboardComponent,
    CompetitionLeaderboardComponent,
    MaterialModule,
    MetricsStatsChartComponent,
  ],
})
export class DefiStatsComponent implements OnInit {
  isDataLoaded = false;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    protected readonly defiService: DefiService,
    public readonly statsService: StatsService,
    private readonly stateService: DefiStateService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.authService.isSuperAdmin().then((isSuperAdmin) => {
      if (!isSuperAdmin && this.isGlobal()) {
        this.router.navigateByUrl('/access-denied');
      }

      this.defiService
        .setDefi(this.activatedRoute.snapshot.params['id'] ?? '')
        .then(async () => {
          this.isDataLoaded = true;
        });
    });
  }

  protected isGlobal(): boolean {
    return !this.route.snapshot.paramMap.has('id');
  }

  openControlCenter() {
    this.router.navigateByUrl(`/control-center/${this.stateService.defiId}`);
  }
}
