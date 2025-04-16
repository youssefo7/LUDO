import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MaterialModule } from '../../material.module';
import { Defi } from '../../interfaces/defi.interface';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CreateDefiDialogComponent } from '../../components/general-dialogs/create-defi-dialog/create-defi-dialog.component';
import { CreateEntrepriseDialogComponent } from '../../components/general-dialogs/create-entreprise-dialog/create-entreprise-dialog.component';
import { AuthService } from '../../services/api/auth.service';
import { Template } from '../../interfaces/template.interface';
import { TemplatesService } from '../../services/logic/templates.service';
import { NewTemplateDialogComponent } from '../../components/template/new-template-dialog/new-template-dialog.component';
import { CommonModule } from '@angular/common';
import { DefiService } from '../../services/logic/defi.service';
import { Entreprise } from '../../interfaces/entreprise-interface';
import { NotificationService } from '../../services/state/notification.service';
import { ERROR_MSGS } from '../../constants/error-msg.constant';
import { formatDate } from '../../utils/date-utils';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-selection-defis',
  templateUrl: './selection-defis.component.html',
  styleUrls: ['./selection-defis.component.scss', '../../../styles.scss'],
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
})
export class SelectionDefiComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  selectedTabIndex = 0;
  title = 'LUDO';
  displayedColumns: string[] = [
    'name',
    'entreprise',
    'status',
    'start',
    'end',
    'actions',
  ];
  currentDate: Date = new Date();
  dataSource: MatTableDataSource<Defi>;
  selectedEntrepriseId = '';
  entrepriseAccessList: Entreprise[] = [];

  templateDisplayedColumns: string[] = ['name', 'description', 'creationDate'];
  templatesDataSource: MatTableDataSource<Template>;

  private entrepriseSubscription?: Subscription;

  @ViewChild('templatesPaginator') templatesPaginator!: MatPaginator;
  @ViewChild('templatesSort') templatesSort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('defiSort') sort!: MatSort;

  value!: string;
  templateSearchValue = '';
  searchQuery!: string;
  public isSuperAdmin = false;

  constructor(
    private readonly templatesService: TemplatesService,
    private readonly router: Router,
    protected defiService: DefiService,
    private readonly dialog: MatDialog,
    public authService: AuthService,
    private readonly notificationService: NotificationService,
  ) {
    this.dataSource = new MatTableDataSource();
    this.templatesDataSource = new MatTableDataSource();
  }

  private fetchAllTemplates(): void {
    this.templatesService.getAllTemplates().subscribe({
      next: (data) => {
        if (data.response && Array.isArray(data.response.results)) {
          this.templatesDataSource.data = data.response.results;
        } else if (Array.isArray(data.response)) {
          this.templatesDataSource.data = data.response;
        } else {
          this.templatesDataSource.data = [];
        }
      },
      error: (error) => {
        this.notificationService.error(ERROR_MSGS.TEMPLATE_FETCH_FAILED, error);
        this.templatesDataSource.data = [];
      },
    });
  }

  openTemplateCenter(templateId: string): void {
    this.router.navigate(['/template-center', templateId]);
  }

  openCreateTemplateDialog(): void {
    const dialogRef = this.dialog.open(NewTemplateDialogComponent, {
      width: '500px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'refresh') {
        this.fetchAllTemplates();
      }
    });
  }

  applyTemplateFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.templatesDataSource.filter = filterValue;

    if (this.templatesDataSource.paginator) {
      this.templatesDataSource.paginator.firstPage();
    }
  }

  clearTemplateSearch(): void {
    this.templateSearchValue = '';
    this.templatesDataSource.filter = '';
    this.templatesPaginator?.firstPage();
  }

  ngOnInit(): void {
    this.authService.isSuperAdmin().then((isSuperAdmin) => {
      this.isSuperAdmin = isSuperAdmin;

      if (history.state && history.state.tab === 'template') {
        this.selectedTabIndex = 1;
      }
      this.fetchAllTemplates();

      this.defiService
        .fetchAllDefis()
        .then(() => this.defiService.fetchEntreprises())
        .catch((error) =>
          this.notificationService.error(
            ERROR_MSGS.ENTREPRISES_FETCH_FAILED,
            error,
          ),
        );

      this.entrepriseSubscription = this.defiService.entrepriseList$.subscribe(
        (list) => {
          this.restrictEntreprises(list).then((restrictedList) => {
            this.entrepriseAccessList = restrictedList;
          });
          this.applyEntrepriseFilter();
        },
      );
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.setupSortingAccessor();
    this.dataSource.sort = this.sort;
    this.templatesDataSource.paginator = this.templatesPaginator;
    this.templatesDataSource.sort = this.templatesSort;

    this.dataSource.filterPredicate = (data: Defi, filter: string): boolean => {
      const nom = data.NOM_DÉFI_FR?.toLowerCase() || '';
      return nom.includes(filter);
    };
  }

  async applyEntrepriseFilter(): Promise<void> {
    let filteredDefis = this.defiService.defiList;

    if (!this.isSuperAdmin) {
      const defiPromises = filteredDefis.map(async (defi: Defi) => {
        const canAccessDefi = await this.authService.canAccessDefi(defi._id);
        return canAccessDefi ? defi : null;
      });

      const resolvedDefis = await Promise.all(defiPromises);
      filteredDefis = resolvedDefis.filter(
        (defi: Defi | null): defi is Defi => defi !== null,
      );
    }

    if (this.selectedEntrepriseId) {
      filteredDefis = filteredDefis.filter(
        (defi: Defi) => defi.ENTREPRISE === this.selectedEntrepriseId,
      );
    }

    filteredDefis.sort((a, b) => {
      const dateA = a.DATE_FIN ? new Date(a.DATE_FIN).getTime() : 0;
      const dateB = b.DATE_FIN ? new Date(b.DATE_FIN).getTime() : 0;
      return dateB - dateA;
    });

    this.dataSource.data = filteredDefis;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  async restrictEntreprises(
    entrepriseList: Entreprise[],
  ): Promise<Entreprise[]> {
    if (!this.isSuperAdmin) {
      const accessibleEntreprises = await Promise.all(
        entrepriseList.map(async (entreprise: Entreprise) => {
          const canAccess = await this.authService.canAccessOrganisation(
            entreprise._id,
          );
          return canAccess ? entreprise : null;
        }),
      );
      return accessibleEntreprises.filter(
        (entreprise): entreprise is Entreprise => entreprise !== null,
      );
    }

    return entrepriseList;
  }

  openDefiStats(defiId?: string) {
    const url = defiId ? `/defi-stats/${defiId}` : '/defi-stats';
    this.router.navigateByUrl(url);
  }

  openDefiControl(defiId?: string) {
    const url = defiId ? `/control-center/${defiId}` : '/defi-stats';
    this.router.navigateByUrl(url);
  }

  openEntrepriseCreation(): void {
    const dialogRef = this.dialog.open(CreateEntrepriseDialogComponent, {
      width: '40%',
      data: {},
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'refresh') {
        await this.defiService.fetchAllDefis();
        this.dataSource.data = this.defiService.defiList;
      }
    });
  }

  openCreateDefiDialog(): void {
    const dialogRef = this.dialog.open(CreateDefiDialogComponent, {
      width: '40%',
      data: {},
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'refresh') {
        await this.defiService.fetchAllDefis();
        this.dataSource.data = this.defiService.defiList;
      }
    });
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private setupSortingAccessor(): void {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'name':
          return item.NOM_DÉFI_FR?.toLowerCase() || '';
        case 'entreprise':
          return (
            this.getEntrepriseNameById(item.ENTREPRISE)?.toLowerCase() || ''
          );
        case 'status':
          return this.defiService.getStatusClass(item).statusText;
        case 'start':
          return item.DATE_DEBUT ? new Date(item.DATE_DEBUT).getTime() : 0;
        case 'end':
          return item.DATE_FIN ? new Date(item.DATE_FIN).getTime() : 0;
        default:
          return item.NOM_DÉFI_FR?.toLowerCase() ?? '';
      }
    };
    this.templatesDataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'name':
          return item.NOM?.toLowerCase() || '';
        case 'description':
          return item.DESCRIPTION?.toLowerCase() || '';
        case 'creationDate':
          return item['Created Date']
            ? new Date(item['Created Date']).getTime()
            : 0;
        default:
          return item.NOM?.toLowerCase() ?? '';
      }
    };
  }

  getEntrepriseNameById(entrepriseId: string): string {
    return this.defiService.getEntrepriseNameById(entrepriseId);
  }

  onEntrepriseChange(entrepriseId: string): void {
    this.selectedEntrepriseId = entrepriseId;
    this.applyEntrepriseFilter();
  }

  onStatsClick(element: Defi, event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigateByUrl(`/defi-stats/${element._id}`);
  }

  protected formattedDate(date: Date | string | undefined): string {
    return formatDate(date);
  }

  ngOnDestroy(): void {
    this.entrepriseSubscription?.unsubscribe();
  }
}
