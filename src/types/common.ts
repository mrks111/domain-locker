export interface Timestamps {
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  domainId: string;
  domain_name: string;
  change_type: string;
  message: string;
  sent: boolean;
  read: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
}

export interface Valuation {
  auto_renew: boolean;
  current_value: number;
  purchase_price: number;
  renewal_cost: number;
}

export interface IpAddresses {
  ipv4: string[];
  ipv6: string[];
}

export interface Dates {
  expiry: string;
  updated: string;
  creation: string;
}

export interface Registrar {
  name: string;
  id: string;
  url: string;
  registryDomainId: string;
}

export interface Contact {
  name: string;
  organization: string;
  street: string;
  city: string;
  country: string;
  stateProvince: string;
  postalCode: string;
}

export interface Abuse {
  email: string;
  phone: string;
}

export interface Dns {
  dnssec: string;
  nameServers: string[];
  mxRecords: string[];
  txtRecords: string[];
}

export interface Ssl {
  issuer: string;
  issuerCountry: string;
  validFrom: string;
  validTo: string;
  subject: string;
  fingerprint: string;
  keySize: number;
  signatureAlgorithm: string;
}

export interface Host {
  query: string;
  country: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  asNumber: string;
}
