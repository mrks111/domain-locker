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
  styleUrls: ['domain-filters.component.scss'],
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
  @Output() searchChange = new EventEmitter<string>();
  @Output() layoutChange = new EventEmitter<boolean>();

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

  onSearch(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchChange.emit(searchTerm);
  }

  onLayoutChange(event: { newValue: string }) {
    this.layoutChange.emit(event.newValue === 'grid');
  }
}
