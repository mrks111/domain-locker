// src/app/shared/domain.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DomainUtils {
  constructor() {}

  /* For a given expiry date, return the number of days remaining */
  getDaysRemaining(expiryDate: Date): number {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const timeDiff = expiry.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  
  /* Truncate long to 64 characters */
  truncateNotes(notes: string): string {
    return notes && notes.length > 64 ? notes.substring(0, 64) + '...' : notes || '';
  }

  /* Split a domain into domain and tld */
  splitDomain(domain: string): { domain: string, tld: string } {
    if (!domain) { return { domain: '', tld: '' } }
    if (domain.indexOf('.') === -1) { return { domain, tld: '' } }
    const parts = domain.split('.');
    return {
      domain: parts[0],
      tld: parts.slice(1).join('.')
    };
  }

  /* Returns text string for remaining time for a domain */
  getRemainingDaysText(expiryDate: Date): string {
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

  /* Returns the severity level for the expiry date */
  getExpirySeverity(expiryDate: Date): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
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
