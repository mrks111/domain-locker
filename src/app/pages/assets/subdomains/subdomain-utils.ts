

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
