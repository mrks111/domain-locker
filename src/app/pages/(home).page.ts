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
import { DomainCollectionComponent } from '@components/domain-things/domain-collection/domain-collection.component';
import { Subscription } from 'rxjs';
import { LoadingComponent } from '@components/misc/loading.component';
import { WelcomeComponent } from '@components/getting-started/welcome.component';
import { DomainPieChartsComponent } from '@components/charts/domain-pie/domain-pie.component';
import { DomainTagCloudComponent } from '@components/charts/tag-cloud/tag-cloud.component';
import { HostMapComponent } from '@components/charts/host-map/host-map.component';
import { EppStatusChartComponent } from '@components/charts/domain-epp-status/domain-epp-status.component';
import { DomainGanttChartComponent } from '@components/charts/registration-lifespan/registration-lifespan.component';
import { TagGridComponent } from '@components/tag-grid/tag-grid.component';
import { SponsorMessageComponent } from '@components/sponsor-thanks/sponsor-thanks.component';
import { FeatureCarouselComponent } from '@components/home-things/feature-carousel/feature-carousel.component';
import { FeaturesGridComponent } from '@components/home-things/feature-grid/feature-grid.component';
import { PricingCardsComponent } from '@/app/components/home-things/pricing-cards/pricing-cards.component';
import { CtaComponent } from '@components/home-things/cta/cta.component';
import { HeroComponent } from '@components/home-things/hero/hero.component';

import { TranslateModule } from '@ngx-translate/core';
import { ErrorHandlerService } from '@/app/services/error-handler.service';

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
    DomainGanttChartComponent,
    TagGridComponent,
    TranslateModule,
    SponsorMessageComponent,
    FeatureCarouselComponent,
    FeaturesGridComponent,
    PricingCardsComponent,
    CtaComponent,
    HeroComponent,
  ],
  templateUrl: './home.page.html',
  styles: [`
  ::ng-deep .p-divider-content { border-radius: 4px; }
  ::ng-deep .gantt-domain-name { background: var(--surface-50) !important; }
  `],
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
    private errorHandlerService: ErrorHandlerService,
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

  newDomainAdded(event: any) {
    console.log('New domain added:', event);
  }

  toggleInsights() {
    this.showInsights = !this.showInsights;
  }
}
