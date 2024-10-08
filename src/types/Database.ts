import { Observable } from 'rxjs';
import { Timestamps, IpAddresses, Registrar, Contact, Dns, Ssl, Host } from './common';

export interface DbDomain extends Timestamps {
  id: string;
  user_id: string;
  domain_name: string;
  expiry_date: Date;
  notes: string;
  ip_addresses?: { ip_address: string; is_ipv6: boolean }[];
  ssl?: Ssl;
  whois?: Contact;
  tags?: string[];
  host?: Host;
  registrar?: Registrar;
  dns: Dns;
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
  registrar?: Registrar;
  host?: Host;
}

export abstract class DatabaseService {
  abstract saveDomain(data: SaveDomainData): Promise<DbDomain>;
  abstract getDomain(id: string): Promise<DbDomain | null>;
  abstract updateDomain(id: string, domain: Partial<DbDomain>): Promise<DbDomain>;
  abstract deleteDomain(id: string): Promise<void>;
  abstract listDomains(userId: string): Observable<DbDomain[]>;
  abstract listDomainNames(): Observable<string[]>;
  abstract addIpAddress(ipAddress: Omit<IpAddress, 'id' | 'created_at' | 'updated_at'>): Promise<IpAddress>;
  abstract getIpAddresses(domainId: string): Promise<IpAddress[]>;
  abstract updateIpAddress(id: string, ipAddress: Partial<IpAddress>): Promise<IpAddress>;
  abstract deleteIpAddress(id: string): Promise<void>;
  abstract addTag(tag: Omit<Tag, 'id'>): Promise<Tag>;
  abstract getTags(): Promise<Tag[]>;
  abstract deleteTag(id: string): Promise<void>;
  abstract addNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<Notification>;
  abstract getNotifications(domainId: string): Promise<Notification[]>;
  abstract updateNotification(id: string, notification: Partial<Notification>): Promise<Notification>;
  abstract deleteNotification(id: string): Promise<void>;
}
