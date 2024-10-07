
export default interface DomainInfo {
  domainName: string;
  status: string[];
  ipAddresses: {
    ipv4: string[];
    ipv6: string[];
  };
  dates: {
    expiry: string;
    updated: string;
    creation: string;
  };
  registrar: {
    name: string;
    id: string;
    url: string;
    registryDomainId: string;
  };
  registrant: {
    name: string;
    organization: string;
    street: string;
    city: string;
    country: string;
    stateProvince: string;
    postalCode: string;
  };
  whois: {
    name: string;
    organization: string;
    country: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
  };
  abuse: {
    email: string;
    phone: string;
  };
  dns: {
    dnssec: string;
    nameServers: string[];
    mxRecords: string[];
    txtRecords: string[];
  };
  ssl: {
    issuer: string;
    issuerCountry: string;
    validFrom: string;
    validTo: string;
    subject: string;
    fingerprint: string;
    keySize: number;
    signatureAlgorithm: string;
  };
  host: any; // TODO: Add host information
}

// Types for the data we're going to return
export interface WhoisData {
  domainName?: string;
  registrarRegistrationExpirationDate?: string;
  updatedDate?: string;
  creationDate?: string;
  registrarName?: string;
  registrar?: string;
  registrarIanaId?: string;
  registrarUrl?: string;
  registryDomainId?: string;
  registrantName?: string;
  registrantOrganization?: string;
  registrantStreet?: string;
  registrantCity?: string;
  registrantCountry?: string;
  registrantStateProvince?: string;
  registrantPostalCode?: string;
  abuseContactEmail?: string;
  registrarAbuseContactEmail?: string;
  abuseContactPhone?: string;
  registrarAbuseContactPhone?: string;
  domainStatus?: string;
  dnssec?: string;
  nameServers?: string;
}

export interface HostData {
  query: string;
  country: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}
