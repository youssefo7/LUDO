import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Annonce } from '../../../interfaces/announcement.interface';
import { MaterialModule } from '../../../material.module';
import { MAX_DATE_FALLBACK, ONE_WEEK } from '../../../constants/app.constants';
import { DefiStateService } from '../../../services/state/defi-state.service';

@Component({
  selector: 'app-annonce-details-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MaterialModule
  ],
  templateUrl: './annonce-details-dialog.component.html',
  styleUrls: ['./annonce-details-dialog.component.scss']
})
export class AnnonceDetailsDialogComponent implements OnInit {
  minDate: Date = new Date();
  maxDate!: Date;
  selectedTime!: string;
  constructor(
    public dialogRef: MatDialogRef<AnnonceDetailsDialogComponent>,
    private stateService: DefiStateService,
    @Inject(MAT_DIALOG_DATA) public annonce: Annonce
  ) {}

  ngOnInit(): void {
    const currentDate =  new Date();
    this.maxDate = this.stateService.defi?.DATE_FIN ? new Date(new Date(this.stateService.defi.DATE_FIN).getTime() + 2 * ONE_WEEK) : MAX_DATE_FALLBACK;
    if((this.stateService.defi?.DATE_DEBUT ?? 0) < currentDate)
      this.minDate = new Date(this.stateService.defi?.DATE_DEBUT ?? 0);
    else
      this.minDate = currentDate;
    
    if (this.annonce.DATE) {
      const currentDate = new Date(this.annonce.DATE);
      const hours = String(currentDate.getHours()).padStart(2, '0');
      const minutes = String(currentDate.getMinutes()).padStart(2, '0');
      this.selectedTime = `${hours}:${minutes}`;
    }
  }

  onUpdate(): void {
    const date: Date = new Date(this.annonce.DATE);
    if (this.selectedTime) {
      const [hours, minutes] = this.selectedTime.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
    }
    this.annonce.DATE = date;
    this.dialogRef.close({ action: 'update', annonce: this.annonce });
  }

  onDelete(): void {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      this.dialogRef.close({ action: 'delete', annonce: this.annonce });
    }
  }

  onClose(): void {
    this.dialogRef.close(null);
  }
}
