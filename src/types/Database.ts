// src/types/database.types.ts

import { Observable } from 'rxjs';

export interface Domain {
  id: string;
  userId: string;
  domainName: string;
  registrar: string;
  expiryDate: Date;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbDomain {
  id: string;
  domain_name: string;
  registrar: string;
  expiry_date: string;
  notes: string;
  ip_addresses?: { ip_address: string; is_ipv6: boolean }[];
  ssl_certificates?: {
    issuer: string;
    issuer_country: string;
    subject: string;
    valid_from: string;
    valid_to: string;
    fingerprint: string;
    key_size: number;
    signature_algorithm: string;
  }[];
  whois_info?: {
    registrant_country: string;
    registrant_state_province: string;
    created_date: string;
    updated_date: string;
    registry_domain_id: string;
    registrar_id: string;
    registrar_url: string;
  };
  tags?: { name: string }[];
}

export interface IpAddress {
  id: string;
  domainId: string;
  ipAddress: string;
  isIpv6: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Notification {
  id: string;
  domainId: string;
  type: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveDomainData {
  domain: Omit<Domain, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  ipAddresses: Omit<IpAddress, 'id' | 'domainId' | 'createdAt' | 'updatedAt'>[];
  tags: string[];
  notifications: { type: string; isEnabled: boolean }[];
}

export abstract class DatabaseService {
  abstract saveDomain(data: SaveDomainData): Promise<Domain>;
  abstract getDomain(id: string): Promise<Domain | null>;
  abstract updateDomain(id: string, domain: Partial<Domain>): Promise<Domain>;
  abstract deleteDomain(id: string): Promise<void>;
  abstract listDomains(userId: string): Observable<Domain[]>;
  // abstract listFilteredDomains(page: number, pageSize: number, sortField: string, sortOrder: number, filters: any): Observable<{ domains: Domain[], totalRecords: number }>;
  abstract listDomainNames(): Observable<string[]>;

  abstract addIpAddress(ipAddress: Omit<IpAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<IpAddress>;
  abstract getIpAddresses(domainId: string): Promise<IpAddress[]>;
  abstract updateIpAddress(id: string, ipAddress: Partial<IpAddress>): Promise<IpAddress>;
  abstract deleteIpAddress(id: string): Promise<void>;

  abstract addTag(tag: Omit<Tag, 'id'>): Promise<Tag>;
  abstract getTags(): Promise<Tag[]>;
  abstract deleteTag(id: string): Promise<void>;

  abstract addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification>;
  abstract getNotifications(domainId: string): Promise<Notification[]>;
  abstract updateNotification(id: string, notification: Partial<Notification>): Promise<Notification>;
  abstract deleteNotification(id: string): Promise<void>;
}
