// src/app/pages/domains/add.page.ts
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PrimeNgModule } from '../../prime-ng.module';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import type DomainInfo from '../../../types/DomainInfo';

@Component({
  selector: 'app-add-domain',
  standalone: true,
  imports: [PrimeNgModule, ReactiveFormsModule, CommonModule],
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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.domainForm = this.fb.group({
      domainName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/)]],
      registrar: ['', Validators.required],
      expiryDate: ['', Validators.required],
      tags: [[], [this.tagsValidator()]],
      notes: ['', [Validators.maxLength(255), Validators.pattern(/^[a-zA-Z0-9\s.,!?'"()-]+$/)]],
    });
  }

  async onNextStep() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.errorMessage = '';

    if (this.activeIndex === 0 && this.domainForm.get('domainName')?.valid) {
      try {
        await this.fetchDomainInfo();
        if (this.activeIndex < 2) {
          this.activeIndex++;
        }
      } catch (error) {
        this.errorMessage = 'Failed to fetch domain information. Please try again.';
        console.error('Error fetching domain info:', error);
      }
    } else if (this.activeIndex < 2) {
      this.activeIndex++;
    }

    this.isProcessing = false;
  }

  onPreviousStep() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }

  async fetchDomainInfo(): Promise<void> {
    const domainName = this.domainForm.get('domainName')?.value;
    this.domainInfo = await this.http.get<DomainInfo>(`/api/domain-info?domain=${domainName}`).toPromise();
    if (this.domainInfo) {
      this.domainForm.patchValue({
        registrar: this.domainInfo.registrar.name,
        expiryDate: new Date(this.domainInfo.dates.expiry)
      });
      this.prepareTableData();
    } else {
      throw new Error('No domain information received');
    }
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
      // Here you would typically send the data to your backend
    }
  }

  async onEnterKey(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.isProcessing) return;
    
    if (this.activeIndex < 2) {
      await this.onNextStep();
    } else {
      this.onSubmit();
    }
  }

  getTagsErrorMessage(): string {
    const errors = this.domainForm.get('tags').errors;
    if (errors) {
      if (errors.maxTags) {
        return 'Maximum of 8 tags allowed.';
      }
      if (errors.duplicateTags) {
        return 'Duplicate tags are not allowed.';
      }
      if (errors.invalidTags) {
        return `Invalid tags: ${errors.invalidTags.join(', ')}. Tags can only contain letters and numbers.`;
      }
    }
    return '';
  }

  getNotesErrorMessage(): string {
    const errors = this.domainForm.get('notes').errors;
    if (errors) {
      if (errors.maxlength) {
        return `Notes cannot exceed 255 characters (currently ${errors.maxlength.actualLength}).`;
      }
      if (errors.pattern) {
        return 'Notes can only contain letters, numbers, and basic punctuation.';
      }
    }
    return '';
  }
}
