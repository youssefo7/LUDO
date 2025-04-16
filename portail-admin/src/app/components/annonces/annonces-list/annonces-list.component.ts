import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

import { AnnoncesService } from '../../../services/logic/annonces.service';
import {
  Annonce,
} from '../../../interfaces/announcement.interface';

import { NewAnnonceDialogComponent } from '../new-annonce-dialog/new-annonce-dialog.component';
import { AnnonceDetailsDialogComponent } from '../annonce-details-dialog/annonce-details-dialog.component';
import { Defi } from '../../../interfaces/defi.interface';
import { MaterialModule } from '../../../material.module';
import { DefiStateService } from '../../../services/state/defi-state.service';
import { NotificationService } from '../../../services/state/notification.service';
import { SUCCESS_MSGS } from '../../../constants/succes-msg.constant';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';

@Component({
  selector: 'app-annonces-list',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './annonces-list.component.html',
  styleUrls: ['./annonces-list.component.scss'],
})
export class AnnoncesListComponent implements OnInit, OnDestroy {
  currentDefi: Defi | null = null;
  annonces: Annonce[] = [];
  defiId = '';
  private defiSub!: Subscription;

  constructor(
    private readonly stateService: DefiStateService,
    private readonly annoncesService: AnnoncesService,
    private readonly dialog: MatDialog,
    private readonly notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.defiSub = this.stateService.defi$.subscribe(async (defi) => {
      this.defiId = this.stateService.defiId || '';
      if (defi && this.defiId) {
        this.currentDefi = defi;
        this.annonces = await this.annoncesService.getAnnonces(this.defiId);
      }
    });
  }

  ngOnDestroy(): void {
    this.defiSub?.unsubscribe();
  }

  isUpcoming(annonce: Annonce): boolean {
    if (!annonce.DATE) return false;
    const now = new Date();
    return annonce.DATE.getTime() > now.getTime();
  }

  openNewAnnonceDialog(): void {
    const dialogRef = this.dialog.open(NewAnnonceDialogComponent, {
      width: '40%',
      height: '60%'
    });

    dialogRef.afterClosed().subscribe(async (result: Annonce) => {
      if (result) {
        try {
          this.annonces = await this.annoncesService.createAnnonce(result);
          this.notificationService.success(
            SUCCESS_MSGS.ANNONCE_CREATE_SUCCESS,
          );
        } catch (err) {
          this.notificationService.error(
            ERROR_MSGS.ANNONCE_CREATE_FAILED,
            err,
          );
          throw err;
        }
      }
    });
  }

  openAnnonceDetailsDialog(annonce: Annonce): void {
    const dialogRef = this.dialog.open(AnnonceDetailsDialogComponent, {
      width: '40%',
      height: '60%',
      data: { ...annonce }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        if (result.action === 'update') {
          try {
            this.annonces = await this.annoncesService.updateAnnonce(result.annonce);
            this.notificationService.success(
              SUCCESS_MSGS.ANNONCE_UPDATE_SUCCESS,
            );
          } catch (err) {
            this.notificationService.error(
              ERROR_MSGS.ANNONCE_UPDATE_FAILED,
              err,
            );
            throw err;
          }
        } else if (result.action === 'delete') {
          try {
            this.annonces = await this.annoncesService.deleteAnnonceById(result.annonce._id, this.defiId);
            this.notificationService.success(
              SUCCESS_MSGS.ANNONCE_DELETE_SUCCESS,
            );
          } catch (err) {
            this.notificationService.error(
              ERROR_MSGS.ANNONCE_DELETE_FAILED,
              err,
            );
            throw err;
          }
        }
      }
    });
  }
}
