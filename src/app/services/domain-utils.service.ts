// src/app/shared/domain.service.ts
import { DbDomain } from '@/types/Database';
import { Injectable } from '@angular/core';
import { makeEppArrayFromLabels } from '@/app/constants/security-categories';
import { DomainInfo } from '@/types/DomainInfo';

@Injectable({
  providedIn: 'root'
})
export class DomainUtils {
  constructor() {}

  extractTags(data: any): string[] {
    if (Array.isArray(data.domain_tags)) {
      // Handle the case for /domains page
      return data.domain_tags
        .filter((tagItem: any) => tagItem.tags && tagItem.tags.name)
        .map((tagItem: any) => tagItem.tags.name);
    } else if (data.tags) {
      // Handle the case for /assets/tags/[tag-name] page
      return [data.tags];
    }
    return [];
  }

  formatDomainData(data: any): DbDomain {
    return {
      ...data,
      tags: this.extractTags(data),
      ssl: (data.ssl_certificates && data.ssl_certificates.length) ? data.ssl_certificates[0] : null,
      whois: data.whois_info,
      registrar: data.registrars,
      host: data.domain_hosts && data.domain_hosts.length > 0 ? data.domain_hosts[0].hosts : null,
      dns: {
        mxRecords: data.dns_records?.filter((record: any) => record.record_type === 'MX').map((record: any) => record.record_value) || [],
        txtRecords: data.dns_records?.filter((record: any) => record.record_type === 'TXT').map((record: any) => record.record_value) || [],
        nameServers: data.dns_records?.filter((record: any) => record.record_type === 'NS').map((record: any) => record.record_value) || []
      },
      statuses: makeEppArrayFromLabels(data.domain_statuses?.map((status: any) => status.status_code) || []),
    };
  }


  convertToDbDomain(domainInfo: DomainInfo): DbDomain {
    return {
      id: '', // Assign an appropriate value if needed
      user_id: '', // Assign an appropriate value if needed
      domain_name: domainInfo.domainName,
      expiry_date: new Date(domainInfo.dates.expiry),
      registration_date: domainInfo.dates.creation ? new Date(domainInfo.dates.creation) : undefined,
      updated_date: domainInfo.dates.updated ? new Date(domainInfo.dates.updated) : undefined,
      notes: '', // Placeholder for notes
      ip_addresses: [
        ...(domainInfo.ipAddresses.ipv4.map((ip) => ({ ip_address: ip, is_ipv6: false }))),
        ...(domainInfo.ipAddresses.ipv6.map((ip) => ({ ip_address: ip, is_ipv6: true }))),
      ],
      ssl: domainInfo.ssl ? {
        issuer: domainInfo.ssl.issuer,
        issuer_country: domainInfo.ssl.issuer_country,
        valid_from: domainInfo.ssl.valid_from,
        valid_to: domainInfo.ssl.valid_to,
        subject: domainInfo.ssl.subject,
        fingerprint: domainInfo.ssl.fingerprint,
        key_size: domainInfo.ssl.key_size,
        signature_algorithm: domainInfo.ssl.signature_algorithm,
      } : undefined,
      whois: domainInfo.whois ? {
        name: domainInfo.whois.name,
        organization: domainInfo.whois.organization,
        street: domainInfo.whois.street,
        city: domainInfo.whois.city,
        country: domainInfo.whois.country,
        state: domainInfo.whois.state,
        postal_code: domainInfo.whois.postal_code,
      } : undefined,
      tags: [], // Placeholder for tags
      host: domainInfo.host ? {
        query: domainInfo.host.query,
        country: domainInfo.host.country,
        region: domainInfo.host.region,
        city: domainInfo.host.city,
        lat: domainInfo.host.lat,
        lon: domainInfo.host.lon,
        timezone: domainInfo.host.timezone,
        isp: domainInfo.host.isp,
        org: domainInfo.host.org,
        asNumber: domainInfo.host.asNumber,
        domain_count: domainInfo.host.domain_count,
        ip: domainInfo.host.ip,
      } : undefined,
      registrar: domainInfo.registrar ? {
        name: domainInfo.registrar.name,
        id: domainInfo.registrar.id,
        url: domainInfo.registrar.url,
        registryDomainId: domainInfo.registrar.registryDomainId,
      } : undefined,
      dns: {
        dnssec: domainInfo.dns.dnssec,
        nameServers: domainInfo.dns.nameServers,
        mxRecords: domainInfo.dns.mxRecords,
        txtRecords: domainInfo.dns.txtRecords,
      },
      statuses: makeEppArrayFromLabels(domainInfo.status) || [],
      domain_costings: undefined, // Placeholder for domain costings
      notification_preferences: undefined, // Placeholder for notification preferences
      sub_domains: domainInfo.subdomains || [],
      domain_links: domainInfo.links || [],
      created_at: new Date().toISOString(), // Default to current timestamp
      updated_at: new Date().toISOString(), // Default to current timestamp
    };
  }



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
