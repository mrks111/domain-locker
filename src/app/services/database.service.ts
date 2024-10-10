// src/app/services/supabase-database.service.ts

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DatabaseService, DbDomain, IpAddress, Notification, Tag, SaveDomainData, Registrar, Host } from '../../types/Database';
import { catchError, from, map, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export default class SupabaseDatabaseService extends DatabaseService {
  constructor(private supabase: SupabaseService) {
    super();
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

  async saveDomain(data: SaveDomainData): Promise<DbDomain> {
    const { domain, ipAddresses, tags, notifications, dns, ssl, whois, registrar, host } = data;
  
    const dbDomain: Partial<DbDomain> = {
      domain_name: domain.domainName,
      expiry_date: domain.expiryDate,
      notes: domain.notes,
      user_id: await this.supabase.getCurrentUser().then(user => user?.id)
    };
  
    const { data: insertedDomain, error: domainError } = await this.supabase.supabase
      .from('domains')
      .insert(dbDomain)
      .select()
      .single() as { data: DbDomain, error: any };
  
    if (domainError) throw domainError;
    if (!insertedDomain) throw new Error('Failed to insert domain');
  
    // Save related data
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
  
    // Fetch the complete domain data including related information
    const { data: completeDomain, error: fetchError } = await this.supabase.supabase
      .from('domains')
      .select(`
        *,
        registrars (name, url),
        domain_hosts (
          hosts (
            ip, lat, lon, isp, org, as_number, city, region, country
          )
        )
      `)
      .eq('id', insertedDomain.id)
      .single();
  
    if (fetchError) throw fetchError;
    if (!completeDomain) throw new Error('Failed to fetch complete domain data');
    return completeDomain;
  }
  

  private async saveIpAddresses(domainId: string, ipAddresses: Omit<IpAddress, 'id' | 'domainId' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
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

    // Get ID of tag (either new or existing)
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

    // Link tag to domain
    const { error: linkError } = await this.supabase.supabase
      .from('domain_tags')
      .insert({ domain_id: domainId, tag_id: tagId });

    if (linkError) throw linkError;
  }
}

private async saveDnsRecords(domainId: string, dns: SaveDomainData['dns']): Promise<void> {
  if (!dns) return;
  const dnsRecords: { domain_id: string; record_type: string; record_value: string }[] = [];
  if (dns.mxRecords) {
    dns.mxRecords.forEach((record) => {
      dnsRecords.push({ domain_id: domainId, record_type: 'MX', record_value: record });
    });
  }
  if (dns.txtRecords) {
    dns.txtRecords.forEach((record) => {
      dnsRecords.push({ domain_id: domainId, record_type: 'TXT', record_value: record });
    });
  }
  if (dns.nameServers) {
    dns.nameServers.forEach((record) => {
      dnsRecords.push({ domain_id: domainId, record_type: 'NS', record_value: record });
    });
  }
  const { error } = await this.supabase.supabase.from('dns_records').insert(dnsRecords);
  if (error) throw error;
}

  private async saveSslInfo(domainId: string, ssl: any): Promise<void> {
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

  private async saveWhoisInfo(domainId: string, whois: any): Promise<void> {
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
    if (!registrar.name) return;
  
    // Check if the registrar already exists
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
      // Insert new registrar
      const { data: newRegistrar, error: insertError } = await this.supabase.supabase
        .from('registrars')
        .insert({ name: registrar.name, url: registrar.url })
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
    console.log('About to save host: ', host)
    if (!host.query) return;
  
    // Check if the host already exists
    const { data: existingHost, error: fetchError } = await this.supabase.supabase
      .from('hosts')
      .select('id')
      .eq('ip', host.query)
      .single();
  
    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  
    let hostId: string;
  
    if (existingHost) {
      hostId = existingHost.id;
    } else {
      // Insert new host
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

  override getDomain(domainName: string): Observable<DbDomain> {
    return from(this.supabase.supabase
      .from('domains')
      .select(`
        *,
        registrars (name, url),
        ip_addresses (ip_address, is_ipv6),
        ssl_certificates (issuer, issuer_country, subject, valid_from, valid_to, fingerprint, key_size, signature_algorithm),
        whois_info (name, organization, country, street, city, state, postal_code),
        domain_tags (tags (name)),
        domain_hosts (
          hosts (
            ip, lat, lon, isp, org, as_number, city, region, country
          )
        ),
        dns_records (record_type, record_value)
      `)
      .eq('domain_name', domainName)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('Domain not found');
        return this.formatDomainData(data);
      }),
      catchError((error) => {
        console.error('Error fetching domain:', error);
        return throwError(() => new Error('Failed to fetch domain details'));
      })
    );
  }

  private formatDomainData(data: any): DbDomain {
    return {
      ...data,
      tags: data.domain_tags?.map((tagItem: { tags: { name: string } }) => tagItem.tags.name) || [],
      ssl: (data.ssl_certificates && data.ssl_certificates.length) ? data.ssl_certificates[0] : null,
      whois: data.whois_info,
      registrar: data.registrars,
      host: data.domain_hosts && data.domain_hosts.length > 0 ? data.domain_hosts[0].hosts : null,
      dns: {
        mxRecords: data.dns_records.filter((record: any) => record.record_type === 'MX').map((record: any) => record.record_value),
        txtRecords: data.dns_records.filter((record: any) => record.record_type === 'TXT').map((record: any) => record.record_value),
        nameServers: data.dns_records.filter((record: any) => record.record_type === 'NS').map((record: any) => record.record_value)
      }
    };
  }

  override listDomainNames(): Observable<string[]> {
    return from(this.supabase.supabase
      .from('domains')
      .select('domain_name')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(d => d.domain_name.toLowerCase());
      })
    );
  }

  override listDomains(): Observable<DbDomain[]> {
    return new Observable(observer => {
      this.supabase.supabase
        .from('domains')
        .select(`
          *,
          registrars (name, url),
          ip_addresses (ip_address, is_ipv6),
          ssl_certificates (issuer, issuer_country, subject, valid_from, valid_to, fingerprint, key_size, signature_algorithm),
          whois_info (name, organization, country, street, city, state, postal_code),
          domain_tags (tags (name)),
          domain_hosts (
            hosts (
              ip, lat, lon, isp, org, as_number, city, region, country
            )
          ),
          dns_records (record_type, record_value)
        `)
        .then(({ data, error }) => {
          if (error) {
            observer.error(error);
          } else {
            console.log(data);
            const formattedDomains = data.map(domain => ({
              ...domain,
              tags: domain.domain_tags?.map((tagItem: { tags: { name: string } }) => tagItem.tags.name) || [],
              ssl: (domain.ssl_certificates && domain.ssl_certificates.length) ? domain.ssl_certificates[0] : null,
              whois: domain.whois_info,
              registrar: domain.registrars,
              host: domain.domain_hosts && domain.domain_hosts.length > 0 ? domain.domain_hosts[0].hosts : null,
              dns: domain.dns_records ? {
                mxRecords: domain.dns_records.filter(record => record.record_type === 'MX').map(record => record.record_value),
                txtRecords: domain.dns_records.filter(record => record.record_type === 'TXT').map(record => record.record_value),
                nameServers: domain.dns_records.filter(record => record.record_type === 'NS').map(record => record.record_value)
              } : null
            }));
            observer.next(formattedDomains as DbDomain[]);
            observer.complete();
          }
        });
    });
  }
  
  override updateDomain(id: string, domain: Partial<Domain>): Promise<Domain> {
    throw new Error('Method not implemented.');
  }
  override deleteDomain(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  override addIpAddress(ipAddress: Omit<IpAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<IpAddress> {
    throw new Error('Method not implemented.');
  }
  override getIpAddresses(domainId: string): Promise<IpAddress[]> {
    throw new Error('Method not implemented.');
  }
  override updateIpAddress(id: string, ipAddress: Partial<IpAddress>): Promise<IpAddress> {
    throw new Error('Method not implemented.');
  }
  override deleteIpAddress(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  override addTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
    throw new Error('Method not implemented.');
  }
  override getTags(): Promise<Tag[]> {
    throw new Error('Method not implemented.');
  }
  override deleteTag(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  override addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    throw new Error('Method not implemented.');
  }
  override getNotifications(domainId: string): Promise<Notification[]> {
    throw new Error('Method not implemented.');
  }
  override updateNotification(id: string, notification: Partial<Notification>): Promise<Notification> {
    throw new Error('Method not implemented.');
  }
  override deleteNotification(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
