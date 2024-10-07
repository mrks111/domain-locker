// src/types/database.types.ts

import { Observable } from 'rxjs';

// Interface for common database timestamps
interface Timestamps {
  created_at: string;
  updated_at: string;
}

// // Domain Interface
// export interface Domain extends Timestamps {
//   id: string;
//   userId: string;
//   domainName: string;
//   registrar: string;
//   expiryDate: Date;
//   notes: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// Database Domain Interface
export interface DbDomain extends Timestamps {
  id: string;
  user_id: string;
  domain_name: string;
  expiry_date: Date;
  notes: string;
  ip_addresses?: { ip_address: string; is_ipv6: boolean }[];
  ssl?: {
    issuer: string;
    issuer_country: string;
    subject: string;
    valid_from: string;
    valid_to: string;
    fingerprint: string;
    key_size: number;
    signature_algorithm: string;
  };
  whois?: {
    name: string;
    organization: string;
    country: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
  };
  tags?: string[];
  host?: Host;
  registrar?: Registrar;
}

// IP Address Interface
export interface IpAddress extends Timestamps {
  id: string;
  domainId: string;
  ipAddress: string;
  isIpv6: boolean;
}

// Tag Interface
export interface Tag {
  id: string;
  name: string;
}

// Notification Interface
export interface Notification extends Timestamps {
  id: string;
  domainId: string;
  type: string;
  isEnabled: boolean;
}

export interface Registrar {
  name: string;
  url: string;
  id: string;
}

export interface Host {
  query: string;
  lat: number;
  lon: number;
  isp: string;
  org: string;
  asNumber: string;
  city: string;
  region: string;
  country: string;
}

// SaveDomainData Interface
export interface SaveDomainData {
  domain: Omit<DbDomain, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  ipAddresses: Omit<IpAddress, 'id' | 'domainId' | 'createdAt' | 'updatedAt'>[];
  tags: string[];
  notifications: { type: string; isEnabled: boolean }[];
  ssl?: {
    issuer: string;
    issuerCountry: string;
    validFrom: string;
    validTo: string;
    subject: string;
    fingerprint: string;
    keySize: number;
    signatureAlgorithm: string;
  };
  whois?: {
    name: string;
    organization: string;
    country: string;
    stateProvince: string;
  };
  dns?: {
    dnssec: string;
    nameServers: string[];
    mxRecords: string[];
    txtRecords: string[];
  };
  registrar?: Registrar;
  host?: Host;
}

// Abstract Database Service Interface
export abstract class DatabaseService {
  abstract saveDomain(data: SaveDomainData): Promise<DbDomain>;
  abstract getDomain(id: string): Promise<DbDomain | null>;
  abstract updateDomain(id: string, domain: Partial<DbDomain>): Promise<DbDomain>;
  abstract deleteDomain(id: string): Promise<void>;
  abstract listDomains(userId: string): Observable<DbDomain[]>;
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
