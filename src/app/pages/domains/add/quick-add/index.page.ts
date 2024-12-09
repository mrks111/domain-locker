import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PrimeNgModule } from '@/app/prime-ng.module';
import DatabaseService from '@services/database.service';
import { ErrorHandlerService } from '@services/error-handler.service';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { GlobalMessageService } from '@/app/services/messaging.service';

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

  private constructDomainData(domainInfo: any): any {
    return {
      domain: {
        domain_name: domainInfo.domainName,
        registrar: domainInfo.registrar?.name || 'Unknown',
        expiry_date: this.makeDateOrUndefined(domainInfo.dates?.expiry),
        registration_date: this.makeDateOrUndefined(domainInfo.dates?.creation),
        updated_date: this.makeDateOrUndefined(domainInfo.dates?.updated),
      },
      statuses: domainInfo.status || [],
      registrar: domainInfo.registrar,
      ipAddresses: [
        ...(domainInfo.ipAddresses?.ipv4?.map((ip: string) => ({ ipAddress: ip, isIpv6: false })) || []),
        ...(domainInfo.ipAddresses?.ipv6?.map((ip: string) => ({ ipAddress: ip, isIpv6: true })) || []),
      ],
      whois: domainInfo.whois || null,
      dns: {
        dnssec: domainInfo.dns?.dnssec || 'unknown',
        nameServers: domainInfo.dns?.nameServers || [],
        mxRecords: domainInfo.dns?.mxRecords || [],
        txtRecords: domainInfo.dns?.txtRecords || [],
      },
      ssl: {
        issuer: domainInfo.ssl?.issuer || 'Unknown',
        validFrom: domainInfo.ssl?.validFrom || null,
        validTo: domainInfo.ssl?.validTo || null,
        subject: domainInfo.ssl?.subject || 'Unknown',
        keySize: domainInfo.ssl?.keySize || 0,
        signatureAlgorithm: domainInfo.ssl?.signatureAlgorithm || 'Unknown',
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
