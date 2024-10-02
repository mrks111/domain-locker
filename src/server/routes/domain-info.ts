import { defineEventHandler, getQuery } from 'h3';
import whois from 'whois-json';
import dns from 'dns';
import tls from 'tls';
import { PeerCertificate } from 'tls';
import type DomainInfo from '../../types/DomainInfo';

// Types for the data we're going to return
interface WhoisData {
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

// Helper function to handle potential failures in asynchronous operations
const safeExecute = async <T>(fn: () => Promise<T>, errorMsg: string, errors: string[]): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    errors.push(errorMsg);
    return null;
  }
};

// Utility function to get IPv4 addresses
const getIpAddress = async (domain: string): Promise<string[]> => {
  return new Promise((resolve) => {
    dns.resolve4(domain, (err: any, addresses: string[] | PromiseLike<string[]>) => {
      if (err) {
        resolve([]); // return empty array on error to handle gracefully
      } else {
        resolve(addresses);
      }
    });
  });
};

// Utility function to get Name Servers
const getNameServers = async (domain: string): Promise<string[]> => {
  return new Promise((resolve) => {
    dns.resolveNs(domain, (err: any, addresses: string[] | PromiseLike<string[]>) => {
      if (err || !addresses) {
        resolve([]); // return empty array on error
      } else {
        resolve(addresses);
      }
    });
  });
};

// Utility function to get IPv6 addresses
const getIpv6Address = async (domain: string): Promise<string[]> => {
  return new Promise((resolve) => {
    dns.resolve6(domain, (err: any, addresses: string[] | PromiseLike<string[]>) => {
      if (err) {
        resolve([]); // return empty array on error to handle gracefully
      } else {
        resolve(addresses);
      }
    });
  });
};

// Utility function to get MX records
const getMxRecords = async (domain: string): Promise<string[]> => {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err: any, addresses: any[]) => {
      if (err || !addresses) {
        resolve([]); // return empty array on error
      } else {
        resolve(addresses.map((record: { exchange: any; priority: any; }) => `${record.exchange} (priority: ${record.priority})`));
      }
    });
  });
};

// Utility function to get TXT records
const getTxtRecords = async (domain: string): Promise<string[]> => {
  return new Promise((resolve) => {
    dns.resolveTxt(domain, (err: any, records: { flat: () => string[] | PromiseLike<string[]>; }) => {
      if (err || !records) {
        resolve([]); // return empty array on error
      } else {
        resolve(records.flat()); // flatten the records array as it can be nested
      }
    });
  });
};

// Utility function to get SSL certificate details
const getSslCertificateDetails = (domain: string): Promise<Partial<PeerCertificate>> => {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(443, domain, { servername: domain }, () => {
      const certificate = socket.getPeerCertificate();
      if (certificate) {
        resolve(certificate);
      } else {
        reject(new Error('No certificate found'));
      }
      socket.end();
    });
    socket.on('error', (err: any) => {
      reject(err);
    });
  });
};

// Helper to convert domain status
const makeStatusArray = (status: string | undefined): string[] => {
  return status ? status.split(' ').filter((s) => !s.includes('https://icann.org/epp#')) : [];
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const domain = query['domain'] as string;

  if (!domain) {
    return { error: 'Domain name is required' };
  }

  const errors: string[] = [];
  const dunno = 'Unknown'; // Text to return when no value found.

  // Fetch WHOIS data and make all DNS and SSL checks concurrently using safeExecute
  const whoisData = await safeExecute(() => whois(domain) as Promise<WhoisData>, 'Failed to fetch WHOIS data', errors);
  const ipv4Addresses = await safeExecute(() => getIpAddress(domain), 'Failed to fetch IPv4 addresses', errors);
  const ipv6Addresses = await safeExecute(() => getIpv6Address(domain), 'Failed to fetch IPv6 addresses', errors);
  const mxRecords = await safeExecute(() => getMxRecords(domain), 'Failed to fetch MX records', errors);
  const txtRecords = await safeExecute(() => getTxtRecords(domain), 'Failed to fetch TXT records', errors);
  const nameServers = await safeExecute(() => getNameServers(domain), 'Failed to fetch name servers', errors);
  const sslInfo = await safeExecute(() => getSslCertificateDetails(domain), 'Failed to fetch SSL certificate details', errors);

  // If WHOIS data is missing, return an error early
  if (!whoisData) {
    return { error: 'Domain not found' };
  }

  const domainInfo: DomainInfo = {
    error: errors.length ? errors.join(', ') : undefined,
    domainName: whoisData.domainName || dunno,
    status: makeStatusArray(whoisData.domainStatus),
    ipAddresses: {
      ipv4: ipv4Addresses || [],
      ipv6: ipv6Addresses || [],
    },
    dates: {
      expiry: whoisData.registrarRegistrationExpirationDate || dunno,
      updated: whoisData.updatedDate || dunno,
      creation: whoisData.creationDate || dunno,
    },
    registrar: {
      name: whoisData.registrarName || whoisData.registrar || dunno,
      id: whoisData.registrarIanaId || dunno,
      url: whoisData.registrarUrl || dunno,
      registryDomainId: whoisData.registryDomainId || dunno,
    },
    registrant: {
      name: whoisData.registrantName || dunno,
      organization: whoisData.registrantOrganization || dunno,
      street: whoisData.registrantStreet || dunno,
      city: whoisData.registrantCity || dunno,
      country: whoisData.registrantCountry || dunno,
      stateProvince: whoisData.registrantStateProvince || dunno,
      postalCode: whoisData.registrantPostalCode || dunno,
    },
    abuse: {
      email: whoisData.abuseContactEmail || whoisData.registrarAbuseContactEmail || dunno,
      phone: whoisData.abuseContactPhone || whoisData.registrarAbuseContactPhone || dunno,
    },
    dns: {
      dnssec: whoisData.dnssec || dunno,
      nameServers: nameServers || [],
      mxRecords: mxRecords || [],
      txtRecords: txtRecords || [],
    },
    ssl: {
      issuer: sslInfo?.issuer?.O || dunno,
      issuerCountry: sslInfo?.issuer?.C || dunno,
      validFrom: sslInfo?.valid_from || dunno,
      validTo: sslInfo?.valid_to || dunno,
      subject: sslInfo?.subject?.CN || dunno,
      fingerprint: sslInfo?.fingerprint || dunno,
      keySize: sslInfo?.bits || 0,
      signatureAlgorithm: sslInfo?.asn1Curve || dunno,
    },
  };

  return domainInfo;
});
