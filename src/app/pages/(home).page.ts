// src/app/pages/home.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../prime-ng.module';
import DatabaseService from '@services/database.service';
import { SupabaseService } from '@services/supabase.service';
import { DbDomain } from '@/types/Database';
import { MessageService } from 'primeng/api';
import AssetListComponent from '@components/misc/asset-list.component';
import { DomainExpirationBarComponent } from '@components/charts/domain-expiration-bar/domain-expiration-bar.component';
import { DomainCollectionComponent } from '@components/domain-collection/domain-collection.component';
import { Subscription } from 'rxjs';
import { LoadingComponent } from '@components/misc/loading.component';
import { WelcomeComponent } from '@components/getting-started/welcome.component';
import { DomainPieChartsComponent } from '@components/charts/domain-pie/domain-pie.component';
import { DomainTagCloudComponent } from '@components/charts/tag-cloud/tag-cloud.component';
import { HostMapComponent } from '@components/charts/host-map/host-map.component';
import { EppStatusChartComponent } from '@components/charts/domain-epp-status/domain-epp-status.component';
import { TagGridComponent } from '@components/tag-grid/tag-grid.component';


@Component({
  standalone: true,
  imports: [
    CommonModule,
    PrimeNgModule,
    AssetListComponent,
    DomainCollectionComponent,
    DomainExpirationBarComponent,
    LoadingComponent,
    WelcomeComponent,
    DomainPieChartsComponent,
    HostMapComponent,
    EppStatusChartComponent,
    DomainTagCloudComponent,
    TagGridComponent,
  ],
  templateUrl: './home.page.html',
  styles: [`::ng-deep .p-divider-content { border-radius: 4px; }`],
})
export default class HomePageComponent implements OnInit {
  domains: DbDomain[] = [];
  loading: boolean = true;
  isAuthenticated: boolean = false;
  showInsights: boolean = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService,
    public supabaseService: SupabaseService,
  ) {}

  ngOnInit() {
    this.loadDomains();
    this.subscriptions.add(
      this.supabaseService.authState$.subscribe(isAuthenticated => {
        this.isAuthenticated = isAuthenticated;
      })
    );
  }

  loadDomains() {
    this.loading = true;
    this.databaseService.listDomains().subscribe({
      next: (domains) => {
        this.domains = domains;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching domains:', error);
        this.loading = false;
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Couldn\'t fetch domains from database' 
        });
      }
    });
  }

  toggleInsights() {
    this.showInsights = !this.showInsights;
  }

  features = [
    { icon: 'pi-chart-line', text: 'Keep track of all your domains in a simple dashboard' },
    { icon: 'pi-lock', text: 'Check security and privacy configurations for each domain' },
    { icon: 'pi-send', text: 'Get notified of upcoming domain expirations or config updates' },
    { icon: 'pi-wave-pulse', text: 'Monitor changes in name servers, DNS, WhoIs and more' },
    { icon: 'pi-sparkles', text: 'Easy data import and export, no vendor lock-in' },
  ];
}
