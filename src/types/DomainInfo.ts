import { IpAddresses, Dates, Registrar, Contact, Abuse, Dns, Ssl, Host } from './common';

export interface DomainInfo {
  domainName: string;
  status: string[];
  ipAddresses: IpAddresses;
  dates: Dates;
  registrar: Registrar;
  whois: Contact;
  abuse: Abuse;
  dns: Dns;
  ssl: Ssl;
  host?: Host;
}

export interface WhoisData extends Partial<Contact> {
  domainName?: string;
  registrarRegistrationExpirationDate?: string;
  updatedDate?: string;
  creationDate?: string;
  registrarName?: string;
  registrar?: string;
  registrarIanaId?: string;
  registrarUrl?: string;
  registryDomainId?: string;
  abuseContactEmail?: string;
  registrarAbuseContactEmail?: string;
  abuseContactPhone?: string;
  registrarAbuseContactPhone?: string;
  domainStatus?: string;
  dnssec?: string;
  nameServers?: string;
}

export type HostData = Host;
