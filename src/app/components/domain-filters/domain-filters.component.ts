import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomainFaviconComponent } from '../../components/misc/favicon.component';
import { PrimeNgModule } from '../../prime-ng.module';

export interface FieldOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-field-visibility-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, PrimeNgModule, DomainFaviconComponent],
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
    { label: 'Security Status', value: 'statuses' },
    { label: 'IP Addresses', value: 'ipAddresses' },
    { label: 'SSL Certificate', value: 'sslCertificate' },
    { label: 'WHOIS Record', value: 'whoisRecord' },
    { label: 'Host Info', value: 'hostInfo' },
    { label: 'DNS Records', value: 'dnsRecords' },
  ];
  @Input() sortOptions: FieldOption[] = [
    { label: 'Date Added', value: 'date' },
    { label: 'Alphabetical', value: 'alphabetical' },
    { label: 'Expiry Date', value: 'expiryDate' },
  ];

  @Input() defaultSelectedFields: string[] = ['domainName', 'registrar', 'expiryDate'];
  @Input() showAddButton: boolean = true;
  @Output() visibilityChange = new EventEmitter<FieldOption[]>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() layoutChange = new EventEmitter<boolean>();
  @Output() sortChange = new EventEmitter<FieldOption>();

  selectedFields: FieldOption[] = [];
  sortOrder: FieldOption = this.sortOptions[0];
  selectedLayout: boolean = true;

  layoutOptions = [
    { label: 'Grid', value: true, icon: 'pi pi-th-large' },
    { label: 'List', value: false, icon: 'pi pi-bars' }
  ];

  ngOnInit() {
    this.initializeSelectedFields();
  }

  public initializeSelectedFields() {
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

  onSortChange(event: any) {
    this.sortChange.emit(event.value);
  }

  onSearch(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchChange.emit(searchTerm);
  }

  onLayoutChange(event: boolean) {
    this.layoutChange.emit(event === null ? true : event);
  }
}
