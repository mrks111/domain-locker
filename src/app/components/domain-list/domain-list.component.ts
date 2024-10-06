import { Component, OnInit } from '@angular/core';
import DatabaseService from '../../services/database.service';
import { Domain } from '../../../types/Database';
import { PrimeNgModule } from '../../prime-ng.module';
import { NgFor, NgSwitch, NgSwitchCase, DatePipe, CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-domain-list',
  templateUrl: './domain-list.component.html',
  styleUrls: ['./domain-list.component.scss'],
  imports: [PrimeNgModule, NgFor, NgSwitch, NgSwitchCase, DatePipe, CommonModule]
})
export class DomainListComponent implements OnInit {
  domains: Domain[] = [];
  loading: boolean = true;

  // Full list of columns
  columns = [
    { field: 'domain_name', header: 'Domain', frozen: true },
    { field: 'registrar', header: 'Registrar' },
    { field: 'expiry_date', header: 'Expiry' },
    { field: 'tags', header: 'Tags' },
    { field: 'notes', header: 'Notes' },
    { field: 'status', header: 'Status', visible: false },
    { field: 'ipAddresses', header: 'IP Addresses', visible: false },
    { field: 'ssl', header: 'SSL', visible: false }
  ];

  // Only visible columns by default
  visibleColumns = [
    { field: 'domain_name', header: 'Domain', frozen: true },
    { field: 'registrar', header: 'Registrar' },
    { field: 'expiry_date', header: 'Expiry' }
  ];

  constructor(private databaseService: DatabaseService) {}

  ngOnInit() {
    this.loadDomains();
  }

  loadDomains() {
    this.loading = true;
    this.databaseService.listDomains().subscribe(
      (domains) => {
        console.log('Fetched domains:', domains);
        this.domains = domains;
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching domains:', error);
        this.loading = false;
      }
    );
  }

  toggleColumn(col: any) {
    col.visible = !col.visible;
  }

  truncateNotes(notes: string): string {
    return notes && notes.length > 64 ? notes.substring(0, 64) + '...' : notes || '';
  }

  getRemainingDaysStyle(expiryDate: string): string {
    const daysRemaining = this.getDaysRemaining(expiryDate);
    if (daysRemaining < 1) {
      return 'Expired'
    }
    if (daysRemaining > 1080) {
      const months = Math.floor(daysRemaining / 30 / 12);
      return `${months} years`;
    }
    if (daysRemaining > 420) {
      const months = Math.floor(daysRemaining / 30);
      return `${months} months`;
    }
    return `${daysRemaining} days`;
  }

  getDaysRemaining(expiryDate: string): number {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const timeDiff = expiry.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  getExpirySeverity(expiryDate: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    const daysRemaining = this.getDaysRemaining(expiryDate);
    if (daysRemaining > 90) {
      return 'success';
    } else if (daysRemaining > 30) {
      return 'warning';
    } else {
      return 'danger';
    }
  }
}
