import { Component, OnInit } from '@angular/core';
import { TeamsListComponent } from '../../components/teams/teams-list/teams-list.component';
import { AnnoncesListComponent } from '../../components/annonces/annonces-list/annonces-list.component';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Defi } from '../../interfaces/defi.interface';
import { DefiService } from '../../services/logic/defi.service';
import { DefiStateService } from '../../services/state/defi-state.service';
import { DefiSelectorComponent } from '../../components/defi-selector/defi-selector.component';
import { MaterialModule } from '../../material.module';
import { DefiInfoDialogComponent } from '../../components/general-dialogs/defi-info-dialog/defi-info-dialog.component';
import { MissionsListComponent } from '../../components/missions/missions-list/missions-list.component';

@Component({
  selector: 'app-control-center',
  standalone: true,
  imports: [
    CommonModule,
    TeamsListComponent,
    AnnoncesListComponent,
    MissionsListComponent,
    DefiSelectorComponent,
    MaterialModule,
  ],
  templateUrl: './control-center.component.html',
  styleUrls: ['./control-center.component.scss'],
})
export class ControlCenterComponent implements OnInit {
  defiCode: string | undefined;
  defi: Defi | null = null;

  constructor(
    private readonly router: Router,
    private readonly defiService: DefiService,
    private readonly stateService: DefiStateService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.defiService
      .setDefi(this.activatedRoute.snapshot.params['id'])
      .then(() => {
        this.defi = this.stateService.defi;
        this.defiCode = this.defi?.CODE;
      });
    this.defi = this.stateService.defi;
    this.defiCode = this.defi?.CODE;
  }

  openDefiInfoDialog(): void {
    if (this.defi) {
      const dialogRef = this.dialog.open(DefiInfoDialogComponent, {
        width: '40%',
        data: {
          defiCode: this.defiCode,
          defiId: this.defi._id,
          defiName: this.defi.NOM_DÉFI_FR,
          defiStartDate: this.defi.DATE_DEBUT,
          defiEndDate: this.defi.DATE_FIN,
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'refresh') {
          this.defiService
            .setDefi(this.activatedRoute.snapshot.params['id'])
            .then(() => {
              this.defi = this.stateService.defi;
              this.defiCode = this.defi?.CODE;
            });
        }
      });
    }
  }

  openDefiStats(): void {
    this.router.navigateByUrl(`/defi-stats/${this.stateService.defiId}`);
  }
}
