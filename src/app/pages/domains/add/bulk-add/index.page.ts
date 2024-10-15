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
import { Router } from '@angular/router';
import { notificationTypes } from '@/app/constants/notification-types';

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
  savedDomains: string[] = [];
  failedDomains: string[] = [];
  public readonly notificationOptions = notificationTypes;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private messageService: MessageService,
    private databaseService: DatabaseService,
    private router: Router
  ) {
    this.bulkAddForm = this.fb.group({
      domainList: ['', Validators.required],
      domains: this.fb.array([]),
      notifications: this.fb.group(
        this.notificationOptions.reduce((acc, opt) => ({ ...acc, [opt.key]: opt.default || false }), {})
      )
    });
  }

  
  ngOnInit() {}

  get domains(): FormArray {
    return this.bulkAddForm.get('domains') as FormArray;
  }
  
  getDomainFormGroup(index: number): FormGroup {
    return this.domains.at(index) as FormGroup;
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
      this.domainsInfo = results.reduce((acc, result, index) => {
        if (result) {
          acc[domainList[index]] = result.domainInfo;
        }
        return acc;
      }, {} as { [key: string]: DomainInfo });
      this.populateDomainForms(domainList);
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

  populateDomainForms(domainList: string[]) {
    this.domains.clear();
    domainList.forEach(domain => {
      const info = this.domainsInfo[domain];
      this.domains.push(this.fb.group({
        domainName: [domain, Validators.required],
        registrar: [info?.registrar?.name || ''],
        expiryDate: [info?.dates?.expiry && this.isValidDate(info.dates.expiry) ? new Date(info.dates.expiry) : null],
        tags: [[]],
        notes: ['']
      }));
    });
  }

  isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }


  saveDomains() {
    this.savingDomains = true;
    this.savedDomains = [];
    this.failedDomains = [];
    const notificationSettings = this.bulkAddForm.get('notifications')?.value;
  
    this.databaseService.listDomainNames().pipe(
      concatMap(existingDomains => {
        const saveDomainObservables = this.domains.controls.map((domainForm, index) => {
          const domainName = domainForm.get('domainName')?.value;
          const domainInfo = this.domainsInfo[domainName];
  
          const domainData: SaveDomainData = {
            domain: {
              domain_name: domainName,
              registrar: domainForm.get('registrar')?.value,
              expiry_date: domainForm.get('expiryDate')?.value,
              notes: domainForm.get('notes')?.value,
              registration_date: domainInfo?.dates?.creation ? new Date(domainInfo.dates.creation) : undefined,
              updated_date: domainInfo?.dates?.updated ? new Date(domainInfo.dates.updated) : undefined,
            },
            ipAddresses: domainInfo ? [
              ...domainInfo.ipAddresses.ipv4.map(ip => ({ ipAddress: ip, isIpv6: false })),
              ...domainInfo.ipAddresses.ipv6.map(ip => ({ ipAddress: ip, isIpv6: true }))
            ] : [],
            tags: domainForm.get('tags')?.value,
            notifications: Object.entries(notificationSettings)
              .filter(([_, isEnabled]) => isEnabled)
              .map(([type, _]) => ({ type, isEnabled: true })),
            ssl: domainInfo?.ssl,
            whois: domainInfo?.whois,
            dns: domainInfo?.dns,
            registrar: domainInfo?.registrar,
            host: domainInfo?.host ? {
              ...domainInfo.host,
              asNumber: domainInfo.host.as.split(' ')[0].substring(2)
            } : undefined
          };
  
          const operation = existingDomains.includes(domainName) 
            ? this.databaseService.updateDomain(domainName, domainData)
            : this.databaseService.saveDomain(domainData);
  
          return operation.pipe(
            map(() => ({ domain: domainName, success: true })),
            catchError(error => {
              console.error(`Error saving domain ${domainName}:`, error);
              return of({ domain: domainName, success: false, error });
            })
          );
        });
  
        return forkJoin(saveDomainObservables);
      })
    ).subscribe({
      next: results => {
        results.forEach(result => {
          if (result.success) {
            this.savedDomains.push(result.domain);
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Success', 
              detail: `Saved domain: ${result.domain}` 
            });
          } else {
            this.failedDomains.push(result.domain);
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: `Failed to save domain: ${result.domain}` 
            });
          }
        });
      },
      error: error => {
        console.error('An unexpected error occurred:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'An unexpected error occurred while saving domains.' 
        });
      },
      complete: () => {
        this.savingDomains = false;
        this.step = 4; // Always move to summary screen
        this.messageService.add({ 
          severity: 'info', 
          summary: 'Complete', 
          detail: `Bulk add process completed. Saved: ${this.savedDomains.length}, Failed: ${this.failedDomains.length}` 
        });
      }
    });
  }

  goToHomePage() {
    this.router.navigate(['/']);
  }
}
