import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { DEFAULT_TIME, MAX_DATE_FALLBACK, ONE_WEEK } from '../../../constants/app.constants';
import { Annonce } from '../../../interfaces/announcement.interface';
import { DefiStateService } from '../../../services/state/defi-state.service';


@Component({
  selector: 'app-new-annonce-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MaterialModule
  ],
  templateUrl: './new-annonce-dialog.component.html',
  styleUrls: ['./new-annonce-dialog.component.scss']
})
export class NewAnnonceDialogComponent implements OnInit {
  minDate!: Date;
  maxDate!: Date;
  selectedDate: Date = new Date();
  selectedTime: string = DEFAULT_TIME;
  protected annonce : Annonce;
  
  constructor(
    public dialogRef: MatDialogRef<NewAnnonceDialogComponent>,
    private stateService: DefiStateService,
  ) {
    this.annonce = {
      DEFI: this.stateService.defiId,
      DATE: new Date(),
    } as Annonce;
  }

  ngOnInit(): void {
    const currentDate = new Date();
    this.maxDate = this.stateService.defi?.DATE_FIN ? new Date(new Date(this.stateService.defi.DATE_FIN).getTime() + 2 * ONE_WEEK) : MAX_DATE_FALLBACK;
    if((this.stateService.defi?.DATE_DEBUT ?? 0) < currentDate)
      this.minDate = new Date(this.stateService.defi?.DATE_DEBUT ?? 0);
    else
      this.minDate = currentDate;
  }

  onCreate(): void {
    const [hours, minutes] = this.selectedTime.split(':').map(Number);
    const publicationDate = new Date(this.selectedDate);
    publicationDate.setHours(hours, minutes, 0, 0);
    this.annonce.DATE = publicationDate;

    this.dialogRef.close(this.annonce);
  }
  
  onCancel(): void {
    this.dialogRef.close(null);
  }
}
