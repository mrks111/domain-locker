import { Observable } from 'rxjs';
import { Timestamps, IpAddresses, Registrar, Contact, Dns, Ssl, Host } from './common';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { type SecurityCategory } from '@/app/constants/security-categories';

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
}

export interface IpAddress extends Timestamps {
  id: string;
  domainId: string;
  ipAddress: string;
  isIpv6: boolean;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Notification extends Timestamps {
  id: string;
  domainId: string;
  type: string;
  isEnabled: boolean;
}

export interface SaveDomainData {
  domain: Omit<DbDomain, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  ipAddresses: Omit<IpAddress, 'id' | 'domainId' | 'created_at' | 'updated_at'>[];
  tags: string[];
  notifications: { type: string; isEnabled: boolean }[];
  ssl?: Ssl;
  whois?: Contact;
  dns?: Dns;
  registrar: Registrar;
  host?: Host;
}

export abstract class DatabaseService {
  abstract saveDomain(data: SaveDomainData): Observable<DbDomain>;
  abstract getDomain(domainName: string): Observable<DbDomain>;
  abstract updateDomain(id: string, domain: Partial<DbDomain>): Observable<DbDomain>;
  abstract deleteDomain(id: string): Observable<void>;
  abstract listDomains(userId: string): Observable<DbDomain[]>;
  abstract listDomainNames(): Observable<string[]>;
  abstract addIpAddress(ipAddress: Omit<IpAddress, 'id' | 'created_at' | 'updated_at'>): Observable<IpAddress>;
  abstract getIpAddresses(isIpv6: boolean): Observable<{ip_address: string, domains: string[]}[]>;
  abstract updateIpAddress(id: string, ipAddress: Partial<IpAddress>): Observable<IpAddress>;
  abstract deleteIpAddress(id: string): Observable<void>;
  abstract addTag(tag: Omit<Tag, 'id'>): Observable<Tag>;
  abstract getTags(): Observable<Tag[]>;
  abstract deleteTag(id: string): Observable<void>;
  abstract addNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Observable<Notification>;
  abstract getNotifications(domainId: string): Observable<Notification[]>;
  abstract updateNotification(id: string, notification: Partial<Notification>): Observable<Notification>;
  abstract deleteNotification(id: string): Observable<void>;
}
export { Registrar, Host };

