import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import DatabaseService from '@services/database.service';
import { SaveDomainData } from '@typings/Database';
import { DomainInfo } from '@typings/DomainInfo';
import { forkJoin, from, catchError, of } from 'rxjs';
import { map, concatMap } from 'rxjs/operators';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-bulk-add',
  imports: [ CommonModule, PrimeNgModule, ReactiveFormsModule ],
  templateUrl: './bulk-add.page.html',
  styleUrls: ['./bulk-add.page.scss']
})
export default class BulkAddComponent implements OnInit {
  step = 1;
  bulkAddForm: FormGroup;
  processingDomains = false;
  savingDomains = false;
  domainsInfo: DomainInfo[] = [];

  notificationOptions = [
    { label: 'Domain Expiration', name: "domainExpiration", description: "Get notified when your domain name needs renewing", initial: true },
    { label: 'SSL Expiration', name: "sslExpiration", description: "Get notified before your SSL cert expires", note: "Not recommended if you have automatic SSL", initial: false },
    { label: 'DNS Change', name: "dnsChange", description: "Get notified when DNS records change (MX, TXT, NS)", initial: false },
    { label: 'WHOIS Change', name: "whoisChange", description: "Get notified when domain registrant info changes", initial: false },
    { label: 'IP Change', name: "ipChange", description: "Get notified when the target IP address (IPv4 & IPv6) is updated", initial: false }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private messageService: MessageService,
    private databaseService: DatabaseService
  ) {
    this.bulkAddForm = this.fb.group({
      domainList: ['', Validators.required],
      domains: this.fb.array([]),
      notifications: this.fb.group(
        this.notificationOptions.reduce((acc, opt) => ({ ...acc, [opt.name]: opt.initial }), {})
      )
    });
  }

  ngOnInit() {}

  get domains() {
    return this.bulkAddForm.get('domains') as FormArray;
  }

  processDomains() {
    this.processingDomains = true;
    const rawDomains = this.bulkAddForm.get('domainList')?.value;
    const domainList = this.parseDomainList(rawDomains);
  
    if (domainList.length === 0) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No valid domains found' });
      this.processingDomains = false;
      return;
    }
  
    forkJoin(
      domainList.map(domain => 
        this.http.get<{domainInfo: DomainInfo}>(`/api/domain-info?domain=${domain}`).pipe(
          catchError(error => {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: `Failed to fetch info for ${domain}` });
            return of(null);
          })
        )
      )
    ).subscribe(results => {
      this.domainsInfo = results.filter(Boolean) as {domainInfo: DomainInfo}[];
      this.populateDomainForms();
      this.processingDomains = false;
      this.step = 2;
    });
  }

  parseDomainList(rawInput: string): string[] {
    const domainRegex = /^(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,})(?:\/.*)?$/;
    return rawInput.split(/[\s,]+/)
      .map(domain => {
        const match = domain.match(domainRegex);
        return match ? match[1].toLowerCase() : null;
      })
      .filter(Boolean) as string[];
  }

  populateDomainForms() {
    this.domains.clear();
    this.domainsInfo.forEach(info => {
      if (info && info.domainInfo) {  // Check if info and domainInfo exist
        this.domains.push(this.fb.group({
          domainName: [info.domainInfo.domainName, Validators.required],
          registrar: [info.domainInfo.registrar?.name || ''],
          expiryDate: [info.domainInfo.dates?.expiry ? new Date(info.domainInfo.dates.expiry) : null],
          tags: [[]],
          notes: ['']
        }));
      }
    });
  }

  saveDomains() {
    this.savingDomains = true;
    const notificationSettings = this.bulkAddForm.get('notifications')?.value;

    from(this.domains.controls).pipe(
      concatMap(domainForm => {
        const domainData: SaveDomainData = {
          domain: {
            domain_name: domainForm.get('domainName')?.value,
            registrar: domainForm.get('registrar')?.value,
            expiry_date: domainForm.get('expiryDate')?.value,
            notes: domainForm.get('notes')?.value,
          },
          tags: domainForm.get('tags')?.value,
          notifications: Object.entries(notificationSettings)
            .filter(([_, isEnabled]) => isEnabled)
            .map(([type, _]) => ({ type, isEnabled: true })),
        };

        return this.databaseService.saveDomain(domainData).pipe(
          map(() => ({ domain: domainData.domain.domain_name, success: true })),
          catchError(error => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: `Failed to save ${domainData.domain.domain_name}: ${error.message}` });
            return of({ domain: domainData.domain.domain_name, success: false });
          })
        );
      })
    ).subscribe({
      next: result => {
        if (result.success) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: `Saved ${result.domain}` });
        }
      },
      complete: () => {
        this.savingDomains = false;
        this.messageService.add({ severity: 'info', summary: 'Complete', detail: 'Bulk add process completed' });
      }
    });
  }
}
