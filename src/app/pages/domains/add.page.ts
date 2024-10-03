// src/app/pages/domains/add.page.ts
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PrimeNgModule } from '../../prime-ng.module';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import type DomainInfo from '../../../types/DomainInfo';

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
export default class AddDomainComponent implements OnInit {
  domainForm!: FormGroup;
  activeIndex: number = 0;
  isProcessing: boolean = false;
  domainInfo: DomainInfo | null = null;
  tableData: { key: string; value: string }[] = [];
  errorMessage: string = '';
  isLoading: boolean = false;

  saveOptions: MenuItem[] = [
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

  notificationOptions: NotificationOption[] = [
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
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    // Make the notification options dynamic
    const notificationControls = this.notificationOptions.reduce((acc, option) => {
      acc[option.name] = [option.initial];
      return acc;
    }, {} as {[key: string]: [boolean]});

    this.domainForm = this.fb.group({
      domainName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})+$/)]],
      registrar: ['', Validators.required],
      expiryDate: ['', Validators.required],
      tags: [[], [this.tagsValidator()]],
      notes: ['', [Validators.maxLength(255), Validators.pattern(/^[a-zA-Z0-9\s.,!?'"()-]+$/)]],
      notifications: this.fb.group(notificationControls)
    });
  }

  async onNextStep() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.isLoading = true;
    this.errorMessage = '';

    const domainNameControl = this.domainForm.get('domainName');
    if (this.activeIndex === 0 && domainNameControl && domainNameControl.valid) {
      try {
        await this.fetchDomainInfo();
      } catch (error) {
        console.error('Error fetching domain info:', error);
        this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Unable to auto-fill domain data' });
        this.domainForm.patchValue({
          registrar: '',
          expiryDate: null
        });
      } finally {
        if (this.activeIndex < 3) {
          this.activeIndex++;
        }
      }
    } else if (this.activeIndex < 3) {
      this.activeIndex++;
    }

    this.isProcessing = false;
    this.isLoading = false;
  }

  onPreviousStep() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }
  

  async fetchDomainInfo(): Promise<void> {
    const domainNameControl = this.domainForm.get('domainName');
    if (domainNameControl) {
      const domainName = domainNameControl.value;
      const fetchedDomainInfo = await this.http.get<DomainInfo>(`/api/domain-info?domain=${domainName}`).toPromise();
      if (fetchedDomainInfo) {
        this.domainInfo = fetchedDomainInfo;

        if (!fetchedDomainInfo.domainName || fetchedDomainInfo.domainName	=== 'Unknown') {
          throw new Error('Domain not found');
        }

        const expiration = this.domainInfo.dates.expiry && this.domainInfo.dates.expiry !== 'Unknown'
          ? new Date(this.domainInfo.dates.expiry) : null;

        const formUpdate: {[key: string]: any} = {
          registrar: this.domainInfo.registrar.name,
          expiryDate: expiration,
        };
        if (this.domainInfo.registrar.name && !expiration) {
          this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Couldn\'t determine domain expiration date, please enter it manually' });
        }
        this.domainForm.patchValue(formUpdate);
        this.prepareTableData();
      } else {
        throw new Error('Unable to fetch domain info');
      }
    }
  }

  
  saveAndAddNew() {
    this.onSubmit();
    // Reset the form and go back to the first step
    this.domainForm.reset();
    this.activeIndex = 0;
  }

  confirmDiscard() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to discard this domain? All entered information will be lost.',
      accept: () => {
        this.domainForm.reset();
        this.activeIndex = 0;
      }
    });
  }

  tagsValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
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

  prepareTableData() {
    if (!this.domainInfo) return;

    this.tableData = [
      { key: 'Domain Name', value: this.domainInfo.domainName },
      { key: 'Status', value: this.domainInfo.status.join(', ') },
      { key: 'IPv4 Addresses', value: this.domainInfo.ipAddresses.ipv4.join(', ') },
      { key: 'IPv6 Addresses', value: this.domainInfo.ipAddresses.ipv6.join(', ') },
      { key: 'Updated Date', value: new Date(this.domainInfo.dates.updated).toLocaleString() },
      { key: 'Creation Date', value: new Date(this.domainInfo.dates.creation).toLocaleString() },
      { key: 'Registrar ID', value: this.domainInfo.registrar.id },
      { key: 'Registrar URL', value: this.domainInfo.registrar.url },
      { key: 'Registry Domain ID', value: this.domainInfo.registrar.registryDomainId },
      { key: 'Registrant Country', value: this.domainInfo.registrant.country },
      { key: 'Registrant State/Province', value: this.domainInfo.registrant.stateProvince },
      { key: 'Abuse Email', value: this.domainInfo.abuse.email },
      { key: 'Abuse Phone', value: this.domainInfo.abuse.phone },
      { key: 'DNSSEC', value: this.domainInfo.dns.dnssec },
      { key: 'Name Servers', value: this.domainInfo.dns.nameServers.join(', ') },
      { key: 'MX Records', value: this.domainInfo.dns.mxRecords.join(', ') },
      { key: 'TXT Records', value: this.domainInfo.dns.txtRecords.join(', ') },
      { key: 'SSL Issuer', value: this.domainInfo.ssl.issuer },
      { key: 'SSL Issuer Country', value: this.domainInfo.ssl.issuerCountry },
      { key: 'SSL Valid From', value: new Date(this.domainInfo.ssl.validFrom).toLocaleString() },
      { key: 'SSL Valid To', value: new Date(this.domainInfo.ssl.validTo).toLocaleString() },
      { key: 'SSL Subject', value: this.domainInfo.ssl.subject },
      { key: 'SSL Fingerprint', value: this.domainInfo.ssl.fingerprint },
      { key: 'SSL Key Size', value: this.domainInfo.ssl.keySize.toString() },
      { key: 'SSL Signature Algorithm', value: this.domainInfo.ssl.signatureAlgorithm }
    ].filter(entry => entry.value && entry.value !== 'Unknown');
  }

  onSubmit() {
    if (this.domainForm.valid) {
      console.log('Form submitted:', this.domainForm.value);
      // TODO: Send data to database, then show either a success or error toast.
      // Then redirect user back to the homepage, unless they want to add another domain.
    }
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Domain added successfully' });
  }

  onEnterKey(event: Event) {
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

  getTagsErrorMessage(): string {
    const tagsControl = this.domainForm.get('tags');
    if (tagsControl && tagsControl.errors) {
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

  hasEnabledNotifications(): boolean {
    const notificationsGroup = this.domainForm.get('notifications');
    if (notificationsGroup) {
      return Object.values(notificationsGroup.value).some(value => value === true);
    }
    return false;
  }

  getNotesErrorMessage(): string {
    const notesControl = this.domainForm.get('notes');
    if (notesControl && notesControl.errors) {
      if (notesControl.errors['maxlength']) {
        return `Notes cannot exceed 255 characters (currently ${notesControl.errors['maxlength'].actualLength}).`;
      }
      if (notesControl.errors['pattern']) {
        return 'Notes can only contain letters, numbers, and basic punctuation.';
      }
    }
    return '';
  }
}
