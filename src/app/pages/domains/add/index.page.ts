import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { PrimeNgModule } from '../../../prime-ng.module';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { catchError, throwError, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import DatabaseService from '../../../services/database.service';
import { SaveDomainData } from '../../../../types/Database';

import type DomainInfo from '../../../../types/DomainInfo';
import { Router } from '@angular/router';

interface NotificationOption {
  label: string;  
  name: string;
  description: string;
  note?: string;
  initial: boolean;
}

@Component({
  selector: 'app-add-domain',
  standalone: true,
  imports: [PrimeNgModule, ReactiveFormsModule, CommonModule],
  providers: [ConfirmationService],
  templateUrl: './add.page.html',
  styleUrls: ['./add.page.scss']
})
export default class AddDomainComponent implements OnInit, OnDestroy {
  public domainForm!: FormGroup;
  public activeIndex = 0;
  public isProcessing = false;
  public domainInfo: DomainInfo | null = null;
  public tableData: { key: string; value: string }[] = [];
  public errorMessage = '';
  public isLoading = false;
  private destroy$ = new Subject<void>();
  private existingDomains: string[] = [];
  public showDomainError = false;

  public readonly saveOptions: MenuItem[] = [
    {
      label: 'Save and Add New',
      icon: 'pi pi-plus',
      command: () => this.saveAndAddNew()
    },
    {
      label: 'Discard',
      icon: 'pi pi-trash',
      command: () => this.confirmDiscard()
    }
  ];

  public readonly notificationOptions: NotificationOption[] = [
    { label: 'Domain Expiration', name: "domainExpiration", description: "Get notified when your domain name needs renewing", initial: true },
    { label: 'SSL Expiration', name: "sslExpiration", description: "Get notified before your SSL cert expires", note: "Not recommended if you have automatic SSL", initial: false },
    { label: 'DNS Change', name: "dnsChange", description: "Get notified when DNS records change (MX, TXT, NS)", initial: false },
    { label: 'WHOIS Change', name: "whoisChange", description: "Get notified when domain registrant info changes", initial: false },
    { label: 'IP Change', name: "ipChange", description: "Get notified when the target IP address (IPv4 & IPv6) is updated", initial: false }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private databaseService: DatabaseService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.fetchExistingDomains();
    this.setupDomainValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const notificationControls = this.notificationOptions.reduce((acc, option) => {
      acc[option.name] = [option.initial];
      return acc;
    }, {} as Record<string, [boolean]>);

    this.domainForm = this.fb.group({
      domainName: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})+$/),
        this.domainExistsValidator()
      ]],
      registrar: ['', Validators.required],
      expiryDate: ['', Validators.required],
      tags: [[], [this.tagsValidator()]],
      notes: ['', [Validators.maxLength(255), Validators.pattern(/^[a-zA-Z0-9\s.,!?'"()-]+$/)]],
      notifications: this.fb.group(notificationControls)
    });

    // Revalidate domainName when existingDomains is updated
    this.domainForm.get('domainName')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    );
  }

  private setupDomainValidation(): void {
    const domainControl = this.domainForm.get('domainName');
    if (domainControl) {
      domainControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      ).subscribe(() => {
        if (domainControl.valid) {
          this.showDomainError = false;
        } else if (domainControl.touched) {
          this.showDomainError = true;
        }
      });
      domainControl.statusChanges.pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.showDomainError = domainControl.touched && domainControl.invalid;
      });
    }
  }
  

  private fetchExistingDomains(): void {
    this.databaseService.listDomainNames().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (domains) => {
        this.existingDomains = domains;
        this.domainForm.get('domainName')?.updateValueAndValidity();
      },
      error: (error) => {
        console.error('Failed to fetch existing domains:', error);
        this.existingDomains = [];
      }
    });
  }

  private domainExistsValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const domain = control.value?.toLowerCase();
      if (domain && this.existingDomains.includes(domain)) {
        return { 'domainExists': true };
      }
      return null;
    };
  }

  public async onNextStep(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const domainNameControl = this.domainForm.get('domainName');
      if (this.activeIndex === 0 && domainNameControl?.valid) {
        await this.fetchDomainInfo();
      }
      
      if (this.activeIndex < 3) {
        this.activeIndex++;
      }
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isProcessing = false;
      this.isLoading = false;
    }
  }

  /**
   * Handles the previous step in the form process
   */
  public onPreviousStep(): void {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }

  /**
   * Fetches domain information from the API
   */
  private async fetchDomainInfo(): Promise<void> {
    const domainName = this.domainForm.get('domainName')?.value;
    if (!domainName) return;

    this.http.get<DomainInfo>(`/api/domain-info?domain=${domainName}`).pipe(
      catchError(this.handleHttpError.bind(this))
    ).subscribe({
      next: (fetchedDomainInfo) => {
        if (this.isDomainInfoValid(fetchedDomainInfo)) {
          this.domainInfo = fetchedDomainInfo;
          this.updateFormWithDomainInfo();
          this.prepareTableData();
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Domain information could not be found, you\'ll need to enter it manually'
          });
          throw new Error('Invalid domain information received');
        }
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  /**
   * Checks if the fetched domain info is valid
   */
  private isDomainInfoValid(info: DomainInfo): boolean {
    return !!info && !!info.domainName && info.domainName !== 'Unknown';
  }

  /**
   * Updates the form with fetched domain information
   */
  private updateFormWithDomainInfo(): void {
    if (!this.domainInfo) return;

    const expiration = this.domainInfo.dates.expiry && this.domainInfo.dates.expiry !== 'Unknown'
      ? new Date(this.domainInfo.dates.expiry) : null;

    this.domainForm.patchValue({
      registrar: this.domainInfo.registrar.name,
      expiryDate: expiration,
    });

    if (this.domainInfo.registrar.name && !expiration) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Warning', 
        detail: 'Couldn\'t determine domain expiration date, please enter it manually' 
      });
    }
  }

  /**
   * Prepares table data for display
   */
  private prepareTableData(): void {
    if (!this.domainInfo) return;

    this.tableData = Object.entries(this.domainInfo).flatMap(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return Object.entries(value).map(([subKey, subValue]) => ({
          key: `${key} ${subKey}`,
          value: Array.isArray(subValue) ? subValue.join(', ') : subValue?.toString() || ''
        }));
      }
      return [{ key, value: value?.toString() || '' }];
    }).filter(entry => entry.value && entry.value !== 'Unknown');
  }

  /**
   * Handles form submission
   */  
  async onSubmit() {
    if (this.domainForm.valid) {
      try {
        const formValue = this.domainForm.value;
        const domainData: SaveDomainData = {
          domain: {
            domainName: formValue.domainName,
            registrar: formValue.registrar,
            expiryDate: formValue.expiryDate,
            notes: formValue.notes,
          },
          ipAddresses: this.domainInfo?.ipAddresses.ipv4.map(ip => ({ ipAddress: ip, isIpv6: false }))
            .concat(this.domainInfo?.ipAddresses.ipv6.map(ip => ({ ipAddress: ip, isIpv6: true }))) || [],
          tags: formValue.tags,
          notifications: Object.entries(formValue.notifications)
            .filter(([_, isEnabled]) => isEnabled)
            .map(([type, _]) => ({ type, isEnabled: true })),
          whois: this.domainInfo?.registrant,
          dns: this.domainInfo?.dns,
          ssl: this.domainInfo?.ssl,
        };
  
        const savedDomain = await this.databaseService.saveDomain(domainData);
  
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Domain ${savedDomain.domainName} added successfully` });
        this.router.navigate(['/domains']);
      } catch (error) {
        this.handleError(error);
      }
    } else {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill in all required fields correctly.' });
    }
  }

  /**
   * Saves the current form and resets it for a new entry
   */
  public saveAndAddNew(): void {
    this.onSubmit();
    this.domainForm.reset();
    this.activeIndex = 0;
  }

  /**
   * Confirms discarding the current form
   */
  public confirmDiscard(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to discard this domain? All entered information will be lost.',
      accept: () => {
        this.domainForm.reset();
        this.activeIndex = 0;
      }
    });
  }

  /**
   * Validator for tags
   */
  private tagsValidator(): ValidatorFn {
    return (control: AbstractControl): Record<string, any> | null => {
      const tags = control.value as string[];
      
      if (tags.length > 8) {
        return { 'maxTags': true };
      }

      const uniqueTags = new Set(tags);
      if (uniqueTags.size !== tags.length) {
        return { 'duplicateTags': true };
      }

      const validTagRegex = /^[a-zA-Z0-9]+$/;
      const invalidTags = tags.filter(tag => !validTagRegex.test(tag));
      if (invalidTags.length > 0) {
        return { 'invalidTags': invalidTags };
      }

      return null;
    };
  }

  /**
   * Handles key press events
   */
  public onEnterKey(event: Event): void {
    if (event instanceof KeyboardEvent) {
      event.preventDefault();
      event.stopPropagation();
      
      if (this.isProcessing) return;
      
      if (this.activeIndex < 2) {
        this.onNextStep();
      } else {
        this.onSubmit();
      }
    }
  }

  public getDomainErrorMessage(): string {
    const domainControl = this.domainForm.get('domainName');
    if (domainControl?.errors?.['domainExists']) {
      return 'This domain has already been added.';
    }
    if (domainControl?.errors?.['required']) {
      return 'Domain name is required.';
    }
    if (domainControl?.errors?.['pattern']) {
      return 'Please enter a valid domain name.';
    }
    return '';
  }

  /**
   * Gets error message for tags
   */
  public getTagsErrorMessage(): string {
    const tagsControl = this.domainForm.get('tags');
    if (tagsControl?.errors) {
      if (tagsControl.errors['maxTags']) {
        return 'Maximum of 8 tags allowed.';
      }
      if (tagsControl.errors['duplicateTags']) {
        return 'Duplicate tags are not allowed.';
      }
      if (tagsControl.errors['invalidTags']) {
        return `Invalid tags: ${tagsControl.errors['invalidTags'].join(', ')}. Tags can only contain letters and numbers.`;
      }
    }
    return '';
  }

  /**
   * Checks if any notifications are enabled
   */
  public hasEnabledNotifications(): boolean {
    const notificationsGroup = this.domainForm.get('notifications');
    return notificationsGroup ? Object.values(notificationsGroup.value).some(value => value === true) : false;
  }

  /**
   * Gets error message for notes
   */
  public getNotesErrorMessage(): string {
    const notesControl = this.domainForm.get('notes');
    if (notesControl?.errors) {
      if (notesControl.errors['maxlength']) {
        return `Notes cannot exceed 255 characters (currently ${notesControl.errors['maxlength'].actualLength}).`;
      }
      if (notesControl.errors['pattern']) {
        return 'Notes can only contain letters, numbers, and basic punctuation.';
      }
    }
    return '';
  }

  /**
   * Handles HTTP errors
   */
  private handleHttpError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Handles general errors
   */
  private handleError(error: any): void {
    console.error('An error occurred:', error);
    this.messageService.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Unable to process your request. Please try again.' 
    });
    this.domainForm.patchValue({
      registrar: '',
      expiryDate: null
    });
  }
}
