import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModule } from '../../prime-ng.module';


export interface FieldOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-field-visibility-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, PrimeNgModule],
  templateUrl: 'domain-filters.component.html',
})
export class FieldVisibilityFilterComponent implements OnInit {
  @Input() fieldOptions: FieldOption[] = [
    { label: 'Domain Name', value: 'domainName' },
    { label: 'Registrar', value: 'registrar' },
    { label: 'Expiry Date', value: 'expiryDate' },
    { label: 'Tags', value: 'tags' },
    { label: 'Notes', value: 'notes' },
    { label: 'IP Addresses', value: 'ipAddresses' },
    { label: 'SSL Certificate', value: 'sslCertificate' },
    { label: 'WHOIS Record', value: 'whoisRecord' },
    { label: 'Host Info', value: 'hostInfo' },
    { label: 'DNS Records', value: 'dnsRecords' },
  ];

  @Input() defaultSelectedFields: string[] = ['domainName', 'registrar', 'expiryDate', 'tags', 'notes'];
  @Output() visibilityChange = new EventEmitter<FieldOption[]>();

  selectedFields: FieldOption[] = [];

  ngOnInit() {
    this.initializeSelectedFields();
  }

  initializeSelectedFields() {
    this.selectedFields = this.fieldOptions.filter(option => 
      this.defaultSelectedFields.includes(option.value)
    );
    this.onSelectionChange();
  }

  onSelectionChange() {
    if (this.selectedFields.length === 0) {
      this.initializeSelectedFields();
    }
    this.visibilityChange.emit(this.selectedFields);
  }
}
