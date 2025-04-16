import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BubbleApiService } from '../../../services/api/bubble-api.service';
import { MaterialModule } from '../../../material.module';
import { NotificationService } from '../../../services/state/notification.service';
import { SUCCESS_MSGS } from '../../../constants/succes-msg.constant';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';
import { TeamService } from '../../../services/logic/team.service';

@Component({
  selector: 'app-team-creation-form',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
  templateUrl: './team-creation-form.component.html',
  styleUrls: ['./team-creation-form.component.scss'],
})
export class TeamCreationFormComponent implements OnInit {
  teamForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly bubbleApiService: BubbleApiService,
    private readonly teamService: TeamService,
    public dialogRef: MatDialogRef<TeamCreationFormComponent>,
    private readonly notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public defiId: string,
  ) { }

  ngOnInit(): void {
    this.teamForm = this.fb.group({
      teamName: ['', Validators.required],
      teamImage: [''],
      teamBanner: [''],
      teamSlogan: [''],
    });
  }

  onSubmit(): void {
    if (this.teamForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const newTeam = {
        NOM: this.teamForm.value.teamName,
        IMAGE: this.teamForm.value.teamImage,
        BANNIERE: this.teamForm.value.teamBanner,
        SLOGAN: this.teamForm.value.teamSlogan,
        DEFI: this.defiId,
      };

      this.teamService.createTeam(newTeam).subscribe({
        next: () => {
          this.notificationService.success(SUCCESS_MSGS.TEAM_CREATE_SUCCESS);
          this.teamService.fetchTeams(this.defiId);
          this.dialogRef.close();
        },
        error: (err) => {
          this.notificationService.error(ERROR_MSGS.TEAM_CREATE_FAILED, err);
          this.isSubmitting = false;
        },
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
