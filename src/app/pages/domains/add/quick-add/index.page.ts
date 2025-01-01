import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PrimeNgModule } from '@/app/prime-ng.module';
import DatabaseService from '@services/database.service';
import { ErrorHandlerService } from '@services/error-handler.service';
import { Router } from '@angular/router';
import { catchError, finalize, lastValueFrom, map, Observable, of, switchMap, tap } from 'rxjs';
import { GlobalMessageService } from '@/app/services/messaging.service';
import { autoSubdomainsReadyForSave, filterOutIgnoredSubdomains } from '@/app/pages/assets/subdomains/subdomain-utils';

@Component({
  selector: 'app-quick-add-domain',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimeNgModule],
  templateUrl: './index.page.html',
})
export default class QuickAddDomain {
  @Input() isInModal: boolean = false;
  @Input() afterSave: (p?: string) => void = () => {};
  @Output() $afterSave = new EventEmitter<string>();
  isLoading = false;

  domainForm = this.fb.group({
    domainName: ['', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})+$/)
    ]],
  });

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private messagingService: GlobalMessageService,
  ) {}

  async onSubmit(): Promise<void> {
    if (this.domainForm.invalid) return;

    this.isLoading = true;
    const domainName = this.domainForm.value.domainName?.trim();

    try {
      // Fetch domain info
      const domainInfo = (await lastValueFrom(
        this.http.get<any>(`/api/domain-info?domain=${domainName}`)
      ))?.domainInfo;

      if (!domainInfo?.domainName) {
        throw new Error('Domain information could not be fetched.');
      }

      // Construct and save domain data
      const domainData = this.constructDomainData(domainInfo);
      await this.databaseService.saveDomain(domainData);

      this.messagingService.showSuccess('Domain added successfully.', `${domainName} has been added to your collection and is now ready to use.`);

      if (domainName) {
        this.searchForSubdomains(domainName);
      }
      
      if (this.isInModal) {
        this.$afterSave.emit(domainName);
      } else {
        this.router.navigate(['/domains', domainName]);
      }
    } catch (error) {
      this.errorHandler.handleError({
        error,
        message: 'Failed to add domain. Please try again.',
        showToast: true,
        location: 'Add Domain',
      });
    } finally {
      this.isLoading = false;
    }
  }

  private makeDateOrUndefined(date: string | undefined): Date | undefined {
    return date ? new Date(date) : undefined;
  }


  private searchForSubdomains(domainName: string) {
    this.isLoading = true;
    this.http.get<any[]>(`/api/domain-subs?domain=${domainName}`).pipe(
      // 1) filter out ignored subdomains
      map((response) => filterOutIgnoredSubdomains(response, domainName)),
      // 2) pass them to a helper that handles “found vs none,”
      //    returning either a saving Observable or `of(null)`
      switchMap((validSubs) => this.handleDiscoveredSubdomains(validSubs, domainName)),
      // 3) handle any error that happened in the pipeline
      catchError((error) => {
        this.errorHandler.handleError({ error, message: 'Failed to save subdomains.' });
        return of(null);
      }),
      // 4) stop loading no matter what
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe();
  }
  
  /** 
   * A small helper that shows messages and returns an Observable 
   * that either saves subdomains or just completes immediately. 
   */
  private handleDiscoveredSubdomains(validSubdomains: any[], domainName: string): Observable<unknown> {
    if (!validSubdomains.length) {
      return of(null);
    }  
    const subdomainsReadyForSave = autoSubdomainsReadyForSave(validSubdomains);
    
    return this.databaseService.subdomainsQueries
      .saveSubdomainsForDomainName(domainName, subdomainsReadyForSave)
      .pipe(
        tap(() => {
          this.messagingService.showMessage({
            severity: 'info',
            summary: 'Added Subdomains',
            detail: `${validSubdomains.length} subdomains were appended to ${domainName}.`,
          });
        })
      );
  }

  private constructDomainData(domainInfo: any): any {
    return {
      domain: {
        domain_name: domainInfo.domainName,
        registrar: domainInfo.registrar?.name,
        expiry_date: this.makeDateOrUndefined(domainInfo.dates?.expiry_date),
        registration_date: this.makeDateOrUndefined(domainInfo.dates?.creation_date),
        updated_date: this.makeDateOrUndefined(domainInfo.dates?.updated_date),
      },
      statuses: domainInfo.status || [],
      registrar: domainInfo.registrar,
      ipAddresses: [
        ...(domainInfo.ipAddresses?.ipv4?.map((ip: string) => ({ ipAddress: ip, isIpv6: false })) || []),
        ...(domainInfo.ipAddresses?.ipv6?.map((ip: string) => ({ ipAddress: ip, isIpv6: true })) || []),
      ],
      whois: domainInfo.whois || null,
      dns: {
        dnssec: domainInfo.dns?.dnssec,
        nameServers: domainInfo.dns?.nameServers || [],
        mxRecords: domainInfo.dns?.mxRecords || [],
        txtRecords: domainInfo.dns?.txtRecords || [],
      },
      ssl: {
        issuer: domainInfo.ssl?.issuer,
        valid_from: domainInfo.ssl?.valid_from || null,
        valid_to: domainInfo.ssl?.valid_to || null,
        subject: domainInfo.ssl?.subject || 'Unknown',
        key_size: domainInfo.ssl?.key_size || 0,
        signature_algorithm: domainInfo.ssl?.signature_algorithm || 'Unknown',
      },
      host: {
        country: domainInfo.host?.country || 'Unknown',
        city: domainInfo.host?.city || 'Unknown',
        region: domainInfo.host?.region || 'Unknown',
        isp: domainInfo.host?.isp || 'Unknown',
        org: domainInfo.host?.org || 'Unknown',
      },
      tags: [],
    };
  }
}
