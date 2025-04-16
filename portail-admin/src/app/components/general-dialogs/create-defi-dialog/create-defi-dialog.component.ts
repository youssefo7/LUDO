import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { DefiService } from '../../../services/logic/defi.service';
import { DEFI_FIELDS } from '../../../constants/app.constants';
import { Template } from '../../../interfaces/template.interface';
import { TemplatesService } from '../../../services/logic/templates.service';
import { NotificationService } from '../../../services/state/notification.service';
import { SUCCESS_MSGS } from '../../../constants/succes-msg.constant';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';
import { firstValueFrom } from 'rxjs';
import { ApiResponse } from '../../../interfaces/api-response.interface';
import { CreateEntrepriseDialogComponent } from '../create-entreprise-dialog/create-entreprise-dialog.component';
import { Entreprise } from '../../../interfaces/entreprise-interface';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule],
  templateUrl: './create-defi-dialog.component.html',
  styleUrls: ['./create-defi-dialog.component.scss'],
})
export class CreateDefiDialogComponent implements OnInit {
  defiForm!: FormGroup;
  templatesList: Template[] = [];
  entrepriseList: Entreprise[] = [];
  isSubmitting = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<CreateDefiDialogComponent>,
    protected defiService: DefiService,
    private readonly templatesService: TemplatesService,
    @Inject(MAT_DIALOG_DATA) public defiId: string,
    private readonly notificationService: NotificationService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.defiForm = this.fb.group({
      [DEFI_FIELDS.NAME]: ['', Validators.required],
      [DEFI_FIELDS.ENTREPRISE]: ['', Validators.required],
      [DEFI_FIELDS.START_DATE]: [null, Validators.required],
      [DEFI_FIELDS.END_DATE]: [null, Validators.required],
      [DEFI_FIELDS.IS_EQUIPE_LIBRE]: [false],
      [DEFI_FIELDS.TAILLE_EQUIPE]: [10, Validators.required], // Default value set to 1
      template: [''],
    });
    this.fetchTemplates();

    this.defiService.entrepriseList$.subscribe((list) => {
      this.entrepriseList = list;
    });
    this.defiService.fetchEntreprises().catch((error) => {
      this.notificationService.error(
        ERROR_MSGS.ENTREPRISES_FETCH_FAILED,
        error,
      );
    });
  }

  private fetchTemplates(): void {
    this.templatesService.getAllTemplates().subscribe({
      next: (data: ApiResponse<Template>) => {
        this.templatesList = data.response.results;
      },
      error: (err) => {
        this.notificationService.error(ERROR_MSGS.TEMPLATE_FETCH_FAILED, err);
        this.templatesList = [];
      },
    });
  }

  get minStartDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  get minEndDate(): Date {
    const startControl = this.defiForm.get('dateDebut');
    if (startControl?.value) {
      const startDate = new Date(startControl.value);
      startDate.setHours(0, 0, 0, 0);
      return startDate;
    }
    return this.minStartDate;
  }

  async onSubmit(): Promise<void> {
    if (this.defiForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      try {
        const dateDebut = new Date(this.defiForm.value.dateDebut);
        const dateFin = new Date(this.defiForm.value.dateFin);
        const templateId = this.defiForm.value.template;

        await firstValueFrom(
          this.defiService.createDefi(
            this.defiForm.value.name,
            dateDebut,
            dateFin,
            this.defiForm.value.isEquipeLibre,
            templateId,
            this.defiForm.value.entreprise,
            this.defiForm.value.tailleEquipe,
          ),
        );

        this.notificationService.success(SUCCESS_MSGS.DEFI_CREATE_SUCCESS);
        this.dialogRef.close('refresh');
      } catch (err) {
        this.notificationService.error(ERROR_MSGS.DEFI_CREATE_FAILED, err);
        this.isSubmitting = false;
      }
    }
  }

  openCreateEntrepriseDialog(): void {
    const dialogRef = this.dialog.open(CreateEntrepriseDialogComponent, {
      width: '40%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.defiForm.patchValue({
          entreprise: result.entrepriseId,
        });
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
