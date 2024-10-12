import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DatabaseService, DbDomain, IpAddress, Notification, Tag, SaveDomainData, Registrar, Host } from '../../types/Database';
import { catchError, from, map, Observable, throwError, retry } from 'rxjs';
import { PostgrestError } from '@supabase/supabase-js';

class DatabaseError extends Error {
  constructor(message: string, public originalError: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

@Injectable({
  providedIn: 'root'
})
export default class SupabaseDatabaseService extends DatabaseService {

  constructor(private supabase: SupabaseService) {
    super();
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error('An error occurred while processing your request.'));
  }

  async domainExists(userId: string, domainName: string): Promise<boolean> {
    const { data, error } = await this.supabase.supabase
      .from('domains')
      .select('id')
      .eq('user_id', userId)
      .eq('domain_name', domainName)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  }

  saveDomain(data: SaveDomainData): Observable<DbDomain> {
    return from(this.saveDomainInternal(data)).pipe(
      catchError(error => this.handleError(error))
    );
  }

  private async saveDomainInternal(data: SaveDomainData): Promise<DbDomain> {
    const { domain, ipAddresses, tags, notifications, dns, ssl, whois, registrar, host } = data;
  
    const dbDomain: Partial<DbDomain> = {
      domain_name: domain.domain_name,
      expiry_date: domain.expiry_date,
      registration_date: domain.registration_date,
      updated_date: domain.updated_date,
      notes: domain.notes,
      user_id: await this.supabase.getCurrentUser().then(user => user?.id)
    };
  
    const { data: insertedDomain, error: domainError } = await this.supabase.supabase
      .from('domains')
      .insert(dbDomain)
      .select()
      .single();
  
    if (domainError) throw domainError;
    if (!insertedDomain) throw new Error('Failed to insert domain');
  
    await Promise.all([
      this.saveIpAddresses(insertedDomain.id, ipAddresses),
      this.saveTags(insertedDomain.id, tags),
      this.saveNotifications(insertedDomain.id, notifications),
      this.saveDnsRecords(insertedDomain.id, dns),
      this.saveSslInfo(insertedDomain.id, ssl),
      this.saveWhoisInfo(insertedDomain.id, whois),
      this.saveRegistrar(insertedDomain.id, registrar),
      this.saveHost(insertedDomain.id, host)
    ]);
  
    return this.getDomainById(insertedDomain.id);
  }

  private async getDomainById(id: string): Promise<DbDomain> {
    const { data, error } = await this.supabase.supabase
      .from('domains')
      .select(this.getFullDomainQuery())
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to fetch complete domain data');
    return this.formatDomainData(data);
  }

  private getFullDomainQuery(): string {
    return `
      *,
      registrars (name, url),
      ip_addresses (ip_address, is_ipv6),
      ssl_certificates!inner (issuer, issuer_country, subject, valid_from, valid_to, fingerprint, key_size, signature_algorithm),
      whois_info (name, organization, country, street, city, state, postal_code),
      domain_tags (tags (name)),
      domain_hosts (
        hosts (
          ip, lat, lon, isp, org, as_number, city, region, country
        )
      ),
      dns_records (record_type, record_value)
    `;
  }

  private async saveIpAddresses(domainId: string, ipAddresses: Omit<IpAddress, 'id' | 'domainId' | 'created_at' | 'updated_at'>[]): Promise<void> {
    if (ipAddresses.length === 0) return;

    const dbIpAddresses = ipAddresses.map(ip => ({
      domain_id: domainId,
      ip_address: ip.ipAddress,
      is_ipv6: ip.isIpv6
    }));

    const { error } = await this.supabase.supabase
      .from('ip_addresses')
      .insert(dbIpAddresses);

    if (error) throw error;
  }

  private async saveTags(domainId: string, tags: string[]): Promise<void> {
    if (tags.length === 0) return;

    for (const tag of tags) {
      const { data: savedTag, error: tagError } = await this.supabase.supabase
        .from('tags')
        .insert({ name: tag })
        .select('id')
        .single();

      if (tagError && tagError.code !== '23505') throw tagError;
      let tagId: string;

      if (savedTag) {
        tagId = savedTag.id;
      } else {
        const { data: existingTag, error: fetchError } = await this.supabase.supabase
          .from('tags')
          .select('id')
          .eq('name', tag)
          .single();
        if (fetchError) throw fetchError;
        if (!existingTag) throw new Error(`Failed to insert or fetch tag: ${tag}`);
        tagId = existingTag.id;
      }

      const { error: linkError } = await this.supabase.supabase
        .from('domain_tags')
        .insert({ domain_id: domainId, tag_id: tagId });

      if (linkError) throw linkError;
    }
  }

  private async saveDnsRecords(domainId: string, dns: SaveDomainData['dns']): Promise<void> {
    if (!dns) return;
    const dnsRecords: { domain_id: string; record_type: string; record_value: string }[] = [];
    
    const recordTypes = ['mxRecords', 'txtRecords', 'nameServers'] as const;
    const typeMap = { mxRecords: 'MX', txtRecords: 'TXT', nameServers: 'NS' };

    recordTypes.forEach(type => {
      dns[type]?.forEach(record => {
        dnsRecords.push({ domain_id: domainId, record_type: typeMap[type], record_value: record });
      });
    });

    if (dnsRecords.length > 0) {
      const { error } = await this.supabase.supabase.from('dns_records').insert(dnsRecords);
      if (error) throw error;
    }
  }

  private async saveSslInfo(domainId: string, ssl: SaveDomainData['ssl']): Promise<void> {
    if (!ssl) return;
  
    const sslData = {
      domain_id: domainId,
      issuer: ssl.issuer,
      issuer_country: ssl.issuerCountry,
      subject: ssl.subject,
      valid_from: new Date(ssl.validFrom),
      valid_to: new Date(ssl.validTo),
      fingerprint: ssl.fingerprint,
      key_size: ssl.keySize,
      signature_algorithm: ssl.signatureAlgorithm
    };
  
    const { error } = await this.supabase.supabase
      .from('ssl_certificates')
      .insert(sslData);
  
    if (error) throw error;
  }

  private async saveWhoisInfo(domainId: string, whois: SaveDomainData['whois']): Promise<void> {
    if (!whois) return;

    const whoisData = {
      domain_id: domainId,
      name: whois.name,
      organization: whois.organization,
      country: whois.country,
      street: whois.street,
      city: whois.city,
      state: whois.stateProvince,
      postal_code: whois.postalCode,
    };
  
    const { error } = await this.supabase.supabase
      .from('whois_info')
      .insert(whoisData);
  
    if (error) throw error;
  }

  private async saveRegistrar(domainId: string, registrar: Omit<Registrar, 'id'>): Promise<void> {
    if (!registrar?.name) return;
  
    const { data: existingRegistrar, error: fetchError } = await this.supabase.supabase
      .from('registrars')
      .select('id')
      .eq('name', registrar.name)
      .single();
  
    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
    let registrarId: string;

    if (existingRegistrar) {
      registrarId = existingRegistrar.id;
    } else {
      const { data: newRegistrar, error: insertError } = await this.supabase.supabase
        .from('registrars')
        .insert({ name: registrar['name'], url: registrar['url'] })
        .select('id')
        .single();
  
      if (insertError) throw insertError;
      if (!newRegistrar) throw new Error('Failed to insert registrar');
  
      registrarId = newRegistrar.id;
    }

    const { error: updateError } = await this.supabase.supabase
      .from('domains')
      .update({ registrar_id: registrarId })
      .eq('id', domainId);
  
    if (updateError) throw updateError;
  }

  private async saveHost(domainId: string, host: Host): Promise<void> {
    if (!host?.isp) return;
  
    // First, try to find an existing host with the same ISP
    const { data: existingHost, error: fetchError } = await this.supabase.supabase
      .from('hosts')
      .select('id')
      .eq('isp', host.isp)
      .single();
  
    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  
    let hostId: string;
  
    if (existingHost) {
      hostId = existingHost.id;
      
      // Update the existing host with the new information
      const { error: updateError } = await this.supabase.supabase
        .from('hosts')
        .update({
          ip: host.query,
          lat: host.lat,
          lon: host.lon,
          org: host.org,
          as_number: host.asNumber,
          city: host.city,
          region: host.region,
          country: host.country
        })
        .eq('id', hostId);
  
      if (updateError) throw updateError;
    } else {
      // If no existing host found, insert a new one
      const { data: newHost, error: insertError } = await this.supabase.supabase
        .from('hosts')
        .insert({
          ip: host.query,
          lat: host.lat,
          lon: host.lon,
          isp: host.isp,
          org: host.org,
          as_number: host.asNumber,
          city: host.city,
          region: host.region,
          country: host.country
        })
        .select('id')
        .single();
  
      if (insertError) throw insertError;
      if (!newHost) throw new Error('Failed to insert host');
      hostId = newHost.id;
    }
  
    // Link the host to the domain
    const { error: linkError } = await this.supabase.supabase
      .from('domain_hosts')
      .insert({ domain_id: domainId, host_id: hostId });
  
    if (linkError) throw linkError;
  }

  private async saveNotifications(domainId: string, notifications: { type: string; isEnabled: boolean }[]): Promise<void> {
    if (notifications.length === 0) return;

    const dbNotifications = notifications.map(n => ({
      domain_id: domainId,
      notification_type: n.type,
      is_enabled: n.isEnabled
    }));

    const { error } = await this.supabase.supabase
      .from('notifications')
      .insert(dbNotifications);

    if (error) throw error;
  }

  getDomain(domainName: string): Observable<DbDomain> {
    return from(this.supabase.supabase
      .from('domains')
      .select(this.getFullDomainQuery())
      .eq('domain_name', domainName)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('Domain not found');
        return this.formatDomainData(data);
      }),
      retry(3),
      catchError(error => this.handleError(error))
    );
  }

  private extractTags(data: any): string[] {
    if (Array.isArray(data.domain_tags)) {
      // Handle the case for /domains page
      return data.domain_tags
        .filter((tagItem: any) => tagItem.tags && tagItem.tags.name)
        .map((tagItem: any) => tagItem.tags.name);
    } else if (data.tags) {
      // Handle the case for /tags/[tag-name] page
      return [data.tags];
    }
    return [];
  }

  private formatDomainData(data: any): DbDomain {
    return {
      ...data,
      tags: this.extractTags(data),
      ssl: (data.ssl_certificates && data.ssl_certificates.length) ? data.ssl_certificates[0] : null,
      whois: data.whois_info,
      registrar: data.registrars,
      host: data.domain_hosts && data.domain_hosts.length > 0 ? data.domain_hosts[0].hosts : null,
      dns: {
        mxRecords: data.dns_records?.filter((record: any) => record.record_type === 'MX').map((record: any) => record.record_value) || [],
        txtRecords: data.dns_records?.filter((record: any) => record.record_type === 'TXT').map((record: any) => record.record_value) || [],
        nameServers: data.dns_records?.filter((record: any) => record.record_type === 'NS').map((record: any) => record.record_value) || []
      }
    };
  }

  listDomainNames(): Observable<string[]> {
    return from(this.supabase.supabase
      .from('domains')
      .select('domain_name')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(d => d.domain_name.toLowerCase());
      }),
      retry(3),
      catchError(error => this.handleError(error))
    );
  }

  listDomains(): Observable<DbDomain[]> {
    return from(this.supabase.supabase
      .from('domains')
      .select(this.getFullDomainQuery())
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(domain => this.formatDomainData(domain));
      }),
      retry(3),
      catchError(error => this.handleError(error))
    );
  }

  updateDomain(id: string, domain: Partial<DbDomain>): Observable<DbDomain> {
    return from(this.supabase.supabase
      .from('domains')
      .update(domain)
      .eq('id', id)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('Domain not found');
        return this.formatDomainData(data);
      }),
      catchError(error => this.handleError(error))
    );
  }

  deleteDomain(id: string): Observable<void> {
    return from(this.supabase.supabase
      .from('domains')
      .delete()
      .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError(error => this.handleError(error))
    );
  }

  addIpAddress(ipAddress: Omit<IpAddress, 'id' | 'created_at' | 'updated_at'>): Observable<IpAddress> {
    return from(this.supabase.supabase
      .from('ip_addresses')
      .insert(ipAddress)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('Failed to add IP address');
        return data as IpAddress;
      }),
      catchError(error => this.handleError(error))
    );
  }

  getIpAddresses(domainId: string): Observable<IpAddress[]> {
    return from(this.supabase.supabase
      .from('ip_addresses')
      .select('*')
      .eq('domain_id', domainId)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as IpAddress[];
      }),
      catchError(error => this.handleError(error))
    );
  }

  updateIpAddress(id: string, ipAddress: Partial<IpAddress>): Observable<IpAddress> {
    return from(this.supabase.supabase
      .from('ip_addresses')
      .update(ipAddress)
      .eq('id', id)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('IP address not found');
        return data as IpAddress;
      }),
      catchError(error => this.handleError(error))
    );
  }

  deleteIpAddress(id: string): Observable<void> {
    return from(this.supabase.supabase
      .from('ip_addresses')
      .delete()
      .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError(error => this.handleError(error))
    );
  }

  addTag(tag: Omit<Tag, 'id'>): Observable<Tag> {
    return from(this.supabase.supabase
      .from('tags')
      .insert(tag)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('Failed to add tag');
        return data as Tag;
      }),
      catchError(error => this.handleError(error))
    );
  }

  getTags(): Observable<Tag[]> {
    return from(this.supabase.supabase
      .from('tags')
      .select('*')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Tag[];
      }),
      catchError(error => this.handleError(error))
    );
  }

  deleteTag(id: string): Observable<void> {
    return from(this.supabase.supabase
      .from('tags')
      .delete()
      .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError(error => this.handleError(error))
    );
  }

  addNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Observable<Notification> {
    return from(this.supabase.supabase
      .from('notifications')
      .insert(notification)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('Failed to add notification');
        return data as Notification;
      }),
      catchError(error => this.handleError(error))
    );
  }

  getNotifications(domainId: string): Observable<Notification[]> {
    return from(this.supabase.supabase
      .from('notifications')
      .select('*')
      .eq('domain_id', domainId)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Notification[];
      }),
      catchError(error => this.handleError(error))
    );
  }

  updateNotification(id: string, notification: Partial<Notification>): Observable<Notification> {
    return from(this.supabase.supabase
      .from('notifications')
      .update(notification)
      .eq('id', id)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('Notification not found');
        return data as Notification;
      }),
      catchError(error => this.handleError(error))
    );
  }

  deleteNotification(id: string): Observable<void> {
    return from(this.supabase.supabase
      .from('notifications')
      .delete()
      .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError(error => this.handleError(error))
    );
  }

  getDomainCountsByTag(): Observable<Record<string, number>> {
    return from(this.supabase.supabase
      .from('domain_tags')
      .select('tags(name), domain_id', { count: 'exact' })
      .select('domain_id')
      .select('tags(name)')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const counts: Record<string, number> = {};
        data.forEach((item: any) => {
          const tagName = item.tags.name;
          counts[tagName] = (counts[tagName] || 0) + 1;
        });
        return counts;
      }),
      catchError(error => this.handleError(error))
    );
  }

  getDomainsByTag(tagName: string): Observable<DbDomain[]> {
    return from(this.supabase.supabase
      .from('domains')
      .select(`
        *,
        registrars (name, url),
        ip_addresses (ip_address, is_ipv6),
        ssl_certificates (issuer, issuer_country, subject, valid_from, valid_to, fingerprint, key_size, signature_algorithm),
        whois_info (name, organization, country, street, city, state, postal_code),
        domain_hosts (
          hosts (
            ip, lat, lon, isp, org, as_number, city, region, country
          )
        ),
        dns_records (record_type, record_value),
        domain_tags!inner (
          tags!inner (name)
        )
      `)
      .eq('domain_tags.tags.name', tagName)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(domain => this.formatDomainData(domain));
      }),
      catchError(error => this.handleError(error))
    );
  }

  getRegistrars(): Observable<Registrar[]> {
    return from(this.supabase.supabase
      .from('registrars')
      .select('*')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Registrar[];
      }),
      catchError(error => this.handleError(error))
    );
  }

  getDomainCountsByRegistrar(): Observable<Record<string, number>> {
    return from(this.supabase.supabase
      .from('domains')
      .select('registrars(name), id', { count: 'exact' })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const counts: Record<string, number> = {};
        data.forEach((item: any) => {
          const registrarName = item.registrars?.name;
          if (registrarName) {
            counts[registrarName] = (counts[registrarName] || 0) + 1;
          }
        });
        return counts;
      }),
      catchError(error => this.handleError(error))
    );
  }
  
  getDomainsByRegistrar(registrarName: string): Observable<DbDomain[]> {
    return from(this.supabase.supabase
      .from('domains')
      .select(`
        *,
        registrars!inner (name, url),
        ip_addresses (ip_address, is_ipv6),
        ssl_certificates (issuer, issuer_country, subject, valid_from, valid_to, fingerprint, key_size, signature_algorithm),
        whois_info (name, organization, country, street, city, state, postal_code),
        domain_hosts (
          hosts (
            ip, lat, lon, isp, org, as_number, city, region, country
          )
        ),
        dns_records (record_type, record_value),
        domain_tags (
          tags (name)
        )
      `)
      .eq('registrars.name', registrarName)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(domain => this.formatDomainData(domain));
      }),
      catchError(error => this.handleError(error))
    );
  }

  getHosts(): Observable<Host[]> {
    return from(this.supabase.supabase
      .from('hosts')
      .select('*')
      .order('isp', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Host[];
      }),
      catchError(error => this.handleError(error))
    );
  }

  getDomainCountsByHost(): Observable<Record<string, number>> {
    return from(this.supabase.supabase
      .from('domain_hosts')
      .select('hosts(isp), domain_id', { count: 'exact' })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const counts: Record<string, number> = {};
        data.forEach((item: any) => {
          const isp = item.hosts?.isp;
          if (isp) {
            counts[isp] = (counts[isp] || 0) + 1;
          }
        });
        return counts;
      }),
      catchError(error => this.handleError(error))
    );
  }

  getDomainsByHost(hostIsp: string): Observable<DbDomain[]> {
    return from(this.supabase.supabase
      .from('domains')
      .select(`
        *,
        registrars (name, url),
        ip_addresses (ip_address, is_ipv6),
        ssl_certificates (issuer, issuer_country, subject, valid_from, valid_to, fingerprint, key_size, signature_algorithm),
        whois_info (name, organization, country, street, city, state, postal_code),
        domain_hosts!inner (
          hosts!inner (
            ip, lat, lon, isp, org, as_number, city, region, country
          )
        ),
        dns_records (record_type, record_value),
        domain_tags (
          tags (name)
        )
      `)
      .eq('domain_hosts.hosts.isp', hostIsp)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(domain => this.formatDomainData(domain));
      }),
      catchError(error => this.handleError(error))
    );
  }

  getHostsWithDomainCounts(): Observable<(Host & { domainCount: number })[]> {
    return from(this.supabase.supabase
      .rpc('get_hosts_with_domain_counts')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as (Host & { domainCount: number })[];
      }),
      catchError(error => this.handleError(error))
    );
  }

  getSslIssuersWithDomainCounts(): Observable<{ issuer: string; domainCount: number }[]> {
    return from(this.supabase.supabase
      .rpc('get_ssl_issuers_with_domain_counts')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as { issuer: string; domainCount: number }[];
      }),
      catchError(error => this.handleError(error))
    );
  }

  getDomainsBySslIssuer(issuer: string): Observable<DbDomain[]> {
    return from(this.supabase.supabase
      .from('domains')
      .select(this.getFullDomainQuery())
      .eq('ssl_certificates.issuer', issuer)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(domain => this.formatDomainData(domain));
      }),
      catchError(error => this.handleError(error))
    );
  }

}
