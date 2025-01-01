  import { Component, OnInit } from '@angular/core';
  import { ActivatedRoute } from '@angular/router';
  import { CommonModule } from '@angular/common';
  import { SubdomainListComponent } from '@/app/pages/assets/subdomains/subdomain-list.component';
  import DatabaseService from '@/app/services/database.service';
  import { PrimeNgModule } from '@/app/prime-ng.module';
  import { ErrorHandlerService } from '@/app/services/error-handler.service';
  import { NotFoundComponent } from '@components/misc/domain-not-found.component';
  import { HttpClient } from '@angular/common/http';
  import { GlobalMessageService } from '@services/messaging.service';
  import { catchError, finalize, map, Observable, of, switchMap, tap } from 'rxjs';
  import { autoSubdomainsReadyForSave, filterOutIgnoredSubdomains } from '../subdomain-utils';

  @Component({
    standalone: true,
    selector: 'app-subdomains-domain',
    imports: [CommonModule, SubdomainListComponent, PrimeNgModule, NotFoundComponent],
    templateUrl: './index.page.html',
  })
  export default class SubdomainsDomainPageComponent implements OnInit {
    domain: string = '';
    subdomains: any[] = [];
    loading: boolean = true;
    validDomain: boolean = true;

    constructor(
      private route: ActivatedRoute,
      private databaseService: DatabaseService,
      private errorHandler: ErrorHandlerService,
      private http: HttpClient,
      private globalMessageService: GlobalMessageService,
    ) {}

    ngOnInit() {
      this.domain = this.route.snapshot.params['domain'];
      this.loadSubdomains();
    }

    afterSuccess() {
      this.globalMessageService.showMessage({
        severity: 'success',
        summary: 'Success',
        detail: 'Subdomains saved successfully!',
      });
      this.loadSubdomains();
    }

    loadSubdomains() {
      this.loading = true;
      this.databaseService.subdomainsQueries.getSubdomainsByDomain(this.domain).subscribe({
        next: (subdomains) => {
          this.subdomains = subdomains.map((sd) => ({
            ...sd,
            sd_info: typeof sd.sd_info === 'string' ? this.parseSdInfo(sd.sd_info) : sd.sd_info,
          }));
          this.validDomain = true;
          this.loading = false;
        },
        error: (error) => {
          this.errorHandler.handleError({ error });
          this.validDomain = false;
          this.loading = false;
        },
      });
    }
    searchForSubdomains() {
      this.loading = true;
      this.http.get<any[]>(`/api/domain-subs?domain=${this.domain}`).pipe(
        // 1) filter out ignored subdomains
        map((response) => filterOutIgnoredSubdomains(response, this.domain)),
        // 2) pass them to a helper that handles “found vs none,”
        //    returning either a saving Observable or `of(null)`
        switchMap((validSubs) => this.handleDiscoveredSubdomains(validSubs)),
        // 3) handle any error that happened in the pipeline
        catchError((error) => {
          this.errorHandler.handleError({ error, message: 'Failed to save subdomains.' });
          return of(null);
        }),
        // 4) stop loading no matter what
        finalize(() => {
          this.loading = false;
        })
      ).subscribe();
    }
    
    /** 
     * A small helper that shows messages and returns an Observable 
     * that either saves subdomains or just completes immediately. 
     */
    private handleDiscoveredSubdomains(validSubdomains: any[]): Observable<unknown> {
      if (!validSubdomains.length) {
        // No subdomains → show warning & do nothing
        this.globalMessageService.showMessage({
          severity: 'warn',
          summary: 'No Valid Subdomains Found',
          detail: 'No valid subdomains were discovered for this domain.',
        });
        return of(null);
      }
    
      // We have subdomains → show info, proceed to save them
      this.globalMessageService.showMessage({
        severity: 'info',
        summary: 'Subdomains Found',
        detail: `${validSubdomains.length} subdomains were discovered for this domain.`,
      });
    
      const subdomainsReadyForSave = autoSubdomainsReadyForSave(validSubdomains);
      
      return this.databaseService.subdomainsQueries
        .saveSubdomainsForDomainName(this.domain, subdomainsReadyForSave)
        .pipe(
          tap(() => this.afterSuccess())
        );
    }
    
    
    private parseSdInfo(sdInfo: string): any {
      try {
        return JSON.parse(sdInfo);
      } catch (error) {
        this.errorHandler.handleError({ error, message: 'Failed to parse subdomain info.' });
        return null;
      }
    }
  }
