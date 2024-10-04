
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
}
