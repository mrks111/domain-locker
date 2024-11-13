import { type SecurityCategory } from '@/app/constants/security-categories';
import {
  Timestamps,
  IpAddresses,
  Registrar,
  Contact,
  Dns,
  Ssl,
  Host,
  Valuation,
  Tag,
  Notification,
  Subdomain,
} from './common';

export {
  Timestamps,
  IpAddresses,
  Registrar,
  Contact,
  Dns,
  Ssl,
  Host,
  Valuation,
  Tag,
  Notification,
  Subdomain,
};

export interface DomainExpiration {
  domain: string;
  expiration: Date;
}


import { Observable } from 'rxjs';
// import { DbDomain, IpAddress, Notification, Tag, SaveDomainData, Registrar, Host, DomainExpiration } from '@/types/Database';

export interface DbDomain extends Timestamps {
  id: string;
  user_id: string;
  domain_name: string;
  expiry_date: Date;
  registration_date?: Date;
  updated_date?: Date;
  notes: string;
  ip_addresses?: { ip_address: string; is_ipv6: boolean }[];
  ssl?: Ssl;
  whois?: Contact;
  tags?: string[];
  host?: Host;
  registrar?: Registrar;
  dns: Dns;
  statuses?: SecurityCategory[];
  domain_costings?: Valuation;
  notification_preferences?: { notification_type: string; is_enabled: boolean; }[];
  sub_domains?: Subdomain[];
}

export interface IpAddress extends Timestamps {
  id: string;
  domainId: string;
  ipAddress: string;
  isIpv6: boolean;
}

export interface NotificationOptions extends Timestamps {
  id: string;
  domainId: string;
  type: string;
  isEnabled: boolean;
}

export interface SaveDomainData {
  domain: Omit<DbDomain, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  ipAddresses: Omit<IpAddress, 'id' | 'domainId' | 'created_at' | 'updated_at'>[];
  tags: string[];
  notifications: { notification_type: string; is_enabled: boolean; }[];
  ssl?: Ssl;
  whois?: Contact;
  dns?: Dns;
  registrar: Registrar;
  host?: Host;
  subdomains: string[];
}

export abstract class DatabaseService {
  abstract domainExists(userId: string, domainName: string): Promise<boolean>;
  abstract saveDomain(data: SaveDomainData): Observable<DbDomain>;
  abstract deleteDomain(domainId: string): Observable<void>;

  // IP Address functions
  abstract addIpAddress(ipAddress: Omit<IpAddress, 'id' | 'created_at' | 'updated_at'>): Observable<IpAddress>;
  abstract getIpAddresses(isIpv6: boolean): Observable<{ ip_address: string; domains: string[] }[]>;
  abstract updateIpAddress(id: string, ipAddress: Partial<IpAddress>): Observable<IpAddress>;
  abstract deleteIpAddress(id: string): Observable<void>;

  // Tag functions
  abstract addTag(tag: Omit<Tag, 'id'>): Observable<Tag>;
  abstract getTag(tagName: string): Observable<Tag>;
  abstract getTags(): Observable<Tag[]>;
  abstract deleteTag(id: string): Observable<void>;
  abstract createTag(tag: Tag): Observable<any>;
  abstract updateTag(tag: any): Observable<void>;

  // Domain functions
  abstract getDomain(domainName: string): Observable<DbDomain>;
  abstract listDomainNames(): Observable<string[]>;
  abstract listDomains(): Observable<DbDomain[]>;
  abstract getDomainById(id: string): Promise<DbDomain>;
  abstract updateDomain(domainId: string, domainData: SaveDomainData): Observable<DbDomain>;
  abstract getTotalDomains(): Observable<number>;
  abstract getDomainsByStatus(statusCode: string): Observable<DbDomain[]>;
  abstract getDomainsByEppCodes(statuses: string[]): Observable<Record<string, { domainId: string; domainName: string }[]>>;
  abstract getDomainExpirations(): Observable<DomainExpiration[]>;
  abstract getDomainCountsByTag(): Observable<Record<string, number>>;
  abstract getDomainsByTag(tagName: string): Observable<DbDomain[]>;
  abstract getDomainCountsByRegistrar(): Observable<Record<string, number>>;
  abstract getDomainsByRegistrar(registrarName: string): Observable<DbDomain[]>;
  abstract getDomainCostings(): Observable<any[]>;
  abstract updateDomainCostings(updates: any[]): Observable<void>;
  abstract fetchAllForExport(domainName: string, includeFields: {label: string, value: string}[]): Observable<any[]>;
  abstract getChangeHistory(domainName?: string, days?: number): Observable<any[]>;

  // Notification functions
  abstract addNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Observable<Notification>;
  abstract updateNotification(id: string, notification: Partial<Notification>): Observable<Notification>;
  abstract deleteNotification(id: string): Observable<void>;
  abstract getNotificationPreferences(): Observable<{ domain_id: string; notification_type: string; is_enabled: boolean }[]>;
  abstract updateBulkNotificationPreferences(preferences: { domain_id: string; notification_type: string; is_enabled: boolean }[]): Observable<void>;
  abstract getUserNotifications(limit?: number, offset?: number): Observable<{ notifications: (Notification & { domain_name: string })[]; total: number }>;
  abstract markAllNotificationsRead(read?: boolean): Promise<Observable<void>>;
  abstract markNotificationReadStatus(notificationId: string, readStatus: boolean): Observable<void>;
  abstract getUnreadNotificationCount(): Observable<number>;

  // Host functions
  abstract getHosts(): Observable<Host[]>;
  abstract getDomainCountsByHost(): Observable<Record<string, number>>;
  abstract getDomainsByHost(hostIsp: string): Observable<DbDomain[]>;
  abstract getHostsWithDomainCounts(): Observable<(Host & { domainCount: number })[]>;

  // SSL functions
  abstract getSslIssuersWithDomainCounts(): Observable<{ issuer: string; domainCount: number }[]>;
  abstract getDomainsBySslIssuer(issuer: string): Observable<DbDomain[]>;

  // DNS functions
  abstract getDnsRecords(recordType: string): Observable<any[]>;

  // Registrar functions
  abstract getRegistrars(): Observable<Registrar[]>;

  // Asset counts
  abstract getAssetCount(assetType: string): Observable<number>;

  // Tag and domain association functions
  abstract getDomainsForTag(tagId: string): Observable<{ available: any[]; selected: any[] }>;
  abstract saveDomainsForTag(tagId: string, selectedDomains: any[]): Observable<void>;
  abstract getTagsWithDomainCounts(): Observable<any[]>;
}
