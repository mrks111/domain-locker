
/**
 * The subdomain info (from sd_info column) is stored as a stringified array of KV pairs.
 * The entries can technically be anything, but there's a few common keys that we care most about
 * This func takes the parsed obj and returns an array of key-values ready for the UI
 * @param sdInfo 
 * @returns 
 */
export const makeKVList = (sdInfo: any): { key: string; value: string }[] => {
  if (!sdInfo) return [];
  const results = [];
  if (sdInfo['type']) results.push({ key: 'Type', value: `${sdInfo['type']} Record` });
  if (sdInfo['ip']) results.push({ key: 'Value', value: sdInfo['ip'] });
  if (sdInfo['ports'] && sdInfo['ports'].length) {
    results.push({ key: 'Ports', value: sdInfo['ports'].join(', ') });
  }
  if (sdInfo['tags'] && sdInfo['tags'].length) {
    results.push({ key: 'Tags', value: sdInfo['tags'].join(', ') });
  }
  if (sdInfo['asn']) results.push({ key: 'ASN', value: sdInfo['asn'] });
  if (sdInfo['asn_name']) results.push({ key: 'ASN Name', value: sdInfo['asn_name'] });
  if (sdInfo['asn_range']) results.push({ key: 'ASN Range', value: sdInfo['asn_range'] });
  if (sdInfo['country'] && sdInfo['country'] !== 'unknown') results.push({ key: 'Country', value: sdInfo['country'] });

  return results;
}


/**
 * When we get subdomains back from the API, some of them are not that useful.
 * E.g.
 * - DNS records like _dmarc, _acme-challenge, etc.
 * - The www. subdomain, which is usually just a redirect
 * - Subdomains that are just the same as the domain name
 * This function just filters these subdomains out.
 * We call before displaying anything to the user, and before saving to the DB.
 * @param subdomains 
 * @returns 
 */
export const filterOutIgnoredSubdomains = (subdomains: any[]): any[] => {
  return subdomains.filter(subdomain => {
    const name = subdomain.subdomain;
    if (!name) return false;
    if (name.startsWith('_')) return false;
    if (name === 'www') return false;
    const parts = name.split('.');
    if (parts.length > 1 && parts[0] === parts[1]) return false;
    return true;
  });
};


export const cleanSubdomain = (subdomain: string): string => {
  return subdomain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('.')[0];
}

export const subdomainsReadyForSave = (
  subdomainNames: string[],
  subdomainInfo: { subdomain: string; [key: string]: any }[],
): { name: string; sd_info?: string | undefined; }[] => {
  return subdomainNames.map((sd: string) => {
    const subdomainData = subdomainInfo.find((info) => info.subdomain === sd);
    return {
      name: cleanSubdomain(sd),
      sd_info: subdomainData ? JSON.stringify(subdomainData) : undefined,
    };
  });
}

export const autoSubdomainsReadyForSave = (subdomainInfo: { subdomain: string; [key: string]: any }[]): { name: string; sd_info?: string | undefined; }[] => {
  return subdomainInfo.map((info) => {
    return {
      name: cleanSubdomain(info.subdomain),
      sd_info: JSON.stringify(info),
    };
  });
}
