import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PrimeNgModule } from '@/app/prime-ng.module';
import DatabaseService from '@services/database.service';
import { type DbDomain } from '@typings/Database';
import { DomainUtils } from '@services/domain-utils.service';
import { DomainFaviconComponent } from '@components/misc/favicon.component'; 
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { LoadingComponent } from '@components/misc/loading.component';
import { GlobalMessageService } from '@services/messaging.service';
import { ErrorHandlerService } from '@/app/services/error-handler.service';
import { DomainSparklineComponent } from '@/app/components/monitor/sparklines/sparklines.component';
import { UptimeHistoryComponent } from '@/app/components/monitor/uptime-history/uptime-history.component';
import { FeatureService } from '@/app/services/features.service';
import { FeatureNotEnabledComponent } from '@components/misc/feature-not-enabled.component';

@Component({
  standalone: true,
  selector: 'app-domain-details',
  imports: [CommonModule, PrimeNgModule, DomainFaviconComponent, LoadingComponent, DomainSparklineComponent, UptimeHistoryComponent, FeatureNotEnabledComponent ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './[domain].page.html',
})
export default class DomainDetailsPage implements OnInit {
  domain: DbDomain | null = null;
  domainId: string | null = null;
  name: string | null = null;
  domainNotFound = false;
  monitorEnabled$ = this.featureService.isFeatureEnabled('domainMonitor');

  constructor(
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    public domainUtils: DomainUtils,
    private featureService: FeatureService,
    private router: Router,
    private globalMessageService: GlobalMessageService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit() {
    this.route.params.pipe(
      switchMap(params => {
        const domainName = params['domain'];
        this.name = domainName;
        return this.databaseService.getDomain(domainName).pipe(
          catchError(error => {
            this.domainNotFound = true;
            this.errorHandler.handleError({
              error,
              message: 'Failed to load domain details',
              showToast: true,
              location: 'Domain',
            });
            return of(null);
          })
        );
      })
    ).subscribe(domain => {
      this.domain = domain;
      if (domain) this.domainId = domain.id;
    });
  }
}
