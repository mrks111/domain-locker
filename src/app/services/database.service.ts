import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DatabaseService, DbDomain, IpAddress, Notification, Tag, SaveDomainData, Registrar, Host } from '../../types/Database';
import { catchError, from, map, Observable, throwError, retry, forkJoin, switchMap, of, concatMap } from 'rxjs';
import { makeEppArrayFromLabels } from '@/app/constants/security-categories';

class DatabaseError extends Error {
  constructor(message: string, public originalError: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export interface DomainExpiration {
  domain: string;
  expiration: Date;
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
      this.saveHost(insertedDomain.id, host),
      this.saveStatuses(insertedDomain.id, data.statuses),
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
      ssl_certificates (issuer, issuer_country, subject, valid_from, valid_to, fingerprint, key_size, signature_algorithm),
      whois_info (name, organization, country, street, city, state, postal_code),
      domain_tags (tags (name)),
      notification_preferences (notification_type, is_enabled),
      domain_hosts (hosts (ip, lat, lon, isp, org, as_number, city, region, country)),
      dns_records (record_type, record_value),
      domain_statuses (status_code),
      domain_costings (purchase_price, current_value, renewal_cost, auto_renew)
    `;
  }  
  
  deleteDomain(domainId: string): Observable<void> {
    return from(this.supabase.supabase.rpc('delete_domain', { domain_id: domainId })).pipe(
      catchError(error => {
        console.error('Error deleting domain:', error);
        return throwError(() => new Error('Failed to delete domain'));
      })
    );
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

  private async saveHost(domainId: string, host?: Host): Promise<void> {
    if (!host || !host?.isp) return;
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

  private async saveStatuses(domainId: string, statuses: string[]): Promise<void> {
    if (!statuses || statuses.length === 0) return;
    const statusEntries = statuses.map(status => ({
      domain_id: domainId,
      status_code: status,
    }));
    const { error } = await this.supabase.supabase
      .from('domain_statuses')
      .insert(statusEntries);
    if (error) throw error;
  }
  

  private async saveNotifications(domainId: string, notifications: { type: string; isEnabled: boolean }[]): Promise<void> {
    if (notifications.length === 0) return;

    const dbNotifications = notifications.map(n => ({
      domain_id: domainId,
      notification_type: n.type,
      is_enabled: n.isEnabled
    }));

    const { error } = await this.supabase.supabase
      .from('notification_preferences')
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
      // Handle the case for /assets/tags/[tag-name] page
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
      },
      statuses: makeEppArrayFromLabels(data.domain_statuses?.map((status: any) => status.status_code) || []),
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

  updateDomain(domainId: string, domainData: SaveDomainData): Observable<DbDomain> {
    return from(this.updateDomainInternal(domainId, domainData)).pipe(
      catchError(error => this.handleError(error))
    );
  }
  
  private async updateDomainInternal(domainId: string, data: SaveDomainData): Promise<DbDomain> {
    const { domain, tags, notifications } = data;
  
    // Update domain's basic information
    const { data: updatedDomain, error: updateError } = await this.supabase.supabase
      .from('domains')
      .update({
        expiry_date: domain.expiry_date,
        notes: domain.notes,
        registrar_id: await this.getOrInsertRegistrarId(domain.registrar)
      })
      .eq('id', domainId)
      .select()
      .single();
  
    if (updateError) throw updateError;
    if (!updatedDomain) throw new Error('Failed to update domain');
  
    // Handle tags
    await this.updateTags(domainId, tags);
  
    // Handle notifications
    await this.updateNotifications(domainId, notifications);
  
    return this.getDomainById(domainId);
  }
  
  // Method to get or insert registrar by name
  private async getOrInsertRegistrarId(registrarName: string): Promise<string> {
    const { data: existingRegistrar, error: registrarError } = await this.supabase.supabase
      .from('registrars')
      .select('id')
      .eq('name', registrarName)
      .single();
  
    if (registrarError && registrarError.code !== 'PGRST116') throw registrarError;
  
    if (existingRegistrar) {
      return existingRegistrar.id;
    } else {
      const { data: newRegistrar, error: insertError } = await this.supabase.supabase
        .from('registrars')
        .insert({ name: registrarName })
        .select('id')
        .single();
  
      if (insertError) throw insertError;
      return newRegistrar.id;
    }
  }
  
  // Method to update tags
  private async updateTags(domainId: string, tags: string[]): Promise<void> {
    // Delete existing domain tags
    await this.supabase.supabase.from('domain_tags').delete().eq('domain_id', domainId);
  
    // Insert or update tags
    for (const tagName of tags) {
      const { data: tag, error: tagError } = await this.supabase.supabase
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .single();
  
      let tagId: string;
      if (tag) {
        tagId = tag.id;
      } else {
        const { data: newTag, error: newTagError } = await this.supabase.supabase
          .from('tags')
          .insert({ name: tagName })
          .select('id')
          .single();
  
        if (newTagError) throw newTagError;
        tagId = newTag.id;
      }
  
      await this.supabase.supabase
        .from('domain_tags')
        .insert({ domain_id: domainId, tag_id: tagId });
    }
  }
  
  // Method to update notifications
  private async updateNotifications(domainId: string, notifications: { notification_type: string; is_enabled: boolean }[]): Promise<void> {
    for (const notification of notifications) {
      const { data: existingNotification, error: notificationError } = await this.supabase.supabase
        .from('notification_preferences')
        .select('id')
        .eq('domain_id', domainId)
        .eq('notification_type', notification.notification_type)
        .single();
  
      if (existingNotification) {
        await this.supabase.supabase
          .from('notification_preferences')
          .update({ is_enabled: notification.is_enabled })
          .eq('domain_id', domainId)
          .eq('notification_type', notification.notification_type);
      } else {
        await this.supabase.supabase
          .from('notification_preferences')
          .insert({
            domain_id: domainId,
            notification_type: notification.notification_type,
            is_enabled: notification.is_enabled
          });
      }
    }
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

  getIpAddresses(isIpv6: boolean): Observable<{ ip_address: string; domains: string[] }[]> {
    return from(this.supabase.supabase
      .rpc('get_ip_addresses_with_domains', { p_is_ipv6: isIpv6 })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as { ip_address: string; domains: string[] }[];
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

  getTag(tagName: string): Observable<Tag> {
    return from(this.supabase.supabase
      .from('tags')
      .select('*')
      .eq('name', tagName)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('Tag not found');
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

  getStatusesWithDomainCounts(): Observable<{ eppCode: string; description: string; domainCount: number }[]> {
    return from(this.supabase.supabase
      .rpc('get_statuses_with_domain_counts')  // Use the updated RPC function
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(item => ({
          eppCode: item.status_code,
          description: '',
          // description: this.getDescriptionForStatus(item.status_code),  // Retrieve description from your constant
          domainCount: item.domain_count
        }));
      }),
      catchError(error => this.handleError(error))
    );
  }  

  // Method to get the total number of domains
  getTotalDomains(): Observable<number> {
    return from(this.supabase.supabase
      .from('domains')
      .select('id', { count: 'exact' })
    ).pipe(
      map(({ count, error }) => {
        if (error) throw error;
        return count || 0;
      })
    );
  }

  getDomainsByEppCodes(statuses: string[]): Observable<Record<string, { domainId: string, domainName: string }[]>> {
    return from(this.supabase.supabase
      .rpc('get_domains_by_epp_status_codes', { status_codes: statuses })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const domainsByStatus: Record<string, { domainId: string, domainName: string }[]> = {};  
        statuses.forEach(status => {
          domainsByStatus[status] = data
            .filter((d: { status_code: string; }) => d.status_code === status)
            .map((d: { domain_id: any; domain_name: any; }) => ({ domainId: d.domain_id, domainName: d.domain_name }));
        });
        return domainsByStatus;
      })
    );
  }

  getDomainsByStatus(statusCode: string): Observable<DbDomain[]> {
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
        domain_tags (
          tags (name)
        ),
        domain_statuses!inner (status_code)
      `)
      .eq('domain_statuses.status_code', statusCode)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(domain => this.formatDomainData(domain));
      }),
      catchError(error => this.handleError(error))
    );
  }

   // Get all domains with costings info
  getDomainCostings(): Observable<any[]> {
    return from(this.supabase.supabase
      .from('domain_costings')
      .select(`
        domain_id, 
        domains(domain_name), 
        purchase_price, 
        current_value, 
        renewal_cost, 
        auto_renew
      `)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Update costings for all edited domains
  updateDomainCostings(updates: any[]): Observable<void> {
    return from(
      this.supabase.supabase
        .from('domain_costings')
        .upsert(updates, { onConflict: 'domain_id' }) // Use the unique constraint on domain_id
        .then((response) => {
          if (response.error) {
            throw response.error;
          }
        })
    );
  }  

  deleteTag(id: string): Observable<void> {
    return from(this.supabase.supabase
      .from('domain_tags')
      .delete()
      .eq('tag_id', id)
    ).pipe(
      concatMap(() => 
        this.supabase.supabase
          .from('tags')
          .delete()
          .eq('id', id)
      ),
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError(error => this.handleError(error))
    );
  }  

  addNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Observable<Notification> {
    return from(this.supabase.supabase
      .from('notification_preferences')
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
      .from('notification_preferences')
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
      .from('notification_preferences')
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
      .from('notification_preferences')
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

  getDnsRecords(recordType: string): Observable<any[]> {
    return from(this.supabase.supabase
      .from('dns_records')
      .select(`
        record_value,
        domains (domain_name)
      `)
      .eq('record_type', recordType)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(record => ({
          record_value: record.record_value,
          // Check if record.domains is an object, and handle accordingly
          domains: record.domains ? [record.domains.domain_name] : []
        }));
      }),
      catchError(error => this.handleError(error))
    );
  }

  getDomainExpirations(): Observable<DomainExpiration[]> {
    return from(this.supabase.supabase
      .from('domains')
      .select('domain_name, expiry_date')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(d => ({
          domain: d.domain_name,
          expiration: new Date(d.expiry_date)
        }));
      })
    );
  }
  

  getAssetCount(assetType: string): Observable<number> {
    let table: string;
    switch (assetType) {
      case 'registrars':
        table = 'registrars';
        break;
      case 'ip addresses':
        table = 'ip_addresses';
        break;
      case 'ssl certificates':
        table = 'ssl_certificates';
        break;
      case 'hosts':
        table = 'hosts';
        break;
      case 'dns records':
        table = 'dns_records';
        break;
      case 'tags':
        table = 'tags';
        break;
      default:
        throw new Error(`Unknown asset type: ${assetType}`);
    }

    return from(this.supabase.supabase
      .from(table)
      .select('id', { count: 'exact' })
    ).pipe(
      map(response => response.count || 0)
    );
  }
  
  getDomainUpdates(domainName?: string, start: number = 0, end: number = 24, category?: string, changeType?: string, filterDomain?: string): Observable<any[]> {
    let query = this.supabase.supabase
      .from('domain_updates')
      .select(`
        *,
        domains!inner(domain_name)
      `)
      .order('date', { ascending: false })
      .range(start, end);
  
    if (domainName) {
      query = query.eq('domains.domain_name', domainName);
    }
    if (category) {
      query = query.eq('change', category);
    }
    if (changeType) {
      query = query.eq('change_type', changeType);
    }
    if (filterDomain) {
      query = query.ilike('domains.domain_name', `%${filterDomain}%`);
    }
  
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError((error) => {
        console.error('Error fetching domain updates:', error);
        return of([]);
      })
    );
  }
  
  
  
  getTotalUpdateCount(domainName?: string): Observable<number> {
    let query = this.supabase.supabase
      .from('domain_updates')
      .select('id', { count: 'exact' });
  
    if (domainName) {
      query = this.supabase.supabase
        .from('domain_updates')
        .select('id, domains!inner(domain_name)', { count: 'exact' })
        .eq('domains.domain_name', domainName);
    }
  
    return from(query.then(({ count, error }) => {
      if (error) throw error;
      return count || 0;
    })).pipe(
      catchError(error => {
        console.error('Error fetching total update count:', error);
        return of(0);
      })
    );
  }
  
  fetchAllForExport(domainName: string, includeFields: {label: string, value: string}[]): Observable<any[]> {
    const fieldMap: { [key: string]: string } = {
      domain_statuses: 'domain_statuses(status_code)',
      ip_addresses: 'ip_addresses(ip_address, is_ipv6)',
      whois_info: 'whois_info(name, organization, country, street, city, state, postal_code)',
      domain_tags: 'domain_tags(tags(name))',
      ssl_certificates: 'ssl_certificates(issuer, issuer_country, subject, valid_from, valid_to, fingerprint, key_size, signature_algorithm)',
      notifications: 'notification_preferences(notification_type, is_enabled)',
      domain_hosts: 'domain_hosts(hosts(ip, lat, lon, isp, org, as_number, city, region, country))',
      dns_records: 'dns_records(record_type, record_value)',
      domain_costings: 'domain_costings(purchase_price, current_value, renewal_cost, auto_renew)',
    };
  
    let selectQuery = '*';
    if (includeFields.length > 0) {
      const selectedRelations = includeFields
      .map(field => fieldMap[field.value])
      .filter(Boolean);

      if (selectedRelations.length > 0) {
        selectQuery += ', ' + selectedRelations.join(', ');
      }
    }
  
    let query = this.supabase.supabase
      .from('domains')
      .select(selectQuery);
  
    if ((domainName || '').split(',').length > 0) {
      query = query.in('domain_name', domainName.split(','));
    }
  
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
  
        // Flatten the nested data for CSV export
        const flattenedData = data.map((domain: any) => {
          return {
            ...domain,
            registrar_name: domain.registrars?.name || '',
            registrar_url: domain.registrars?.url || '',
            ip_addresses: domain.ip_addresses ? domain.ip_addresses.map((ip: any) => ip.ip_address).join(', ') : '',
            ssl_certificates: domain.ssl_certificates ? domain.ssl_certificates.map((cert: any) => cert.issuer).join(', ') : '',
            whois_name: domain.whois_info?.name || '',
            whois_organization: domain.whois_info?.organization || '',
            whois_country: domain.whois_info?.country || '',
            tags: domain.domain_tags ? domain.domain_tags.map((tag: any) => tag.tags.name).join(', ') : '',
            hosts: domain.domain_hosts ? domain.domain_hosts.map((host: any) => host.hosts.isp).join(', ') : '',
            dns_records: domain.dns_records ? domain.dns_records.map((record: any) => record.record_value).join(', ') : '',
            purchase_price: domain.domain_costings?.purchase_price || 0,
            current_value: domain.domain_costings?.current_value || 0,
            renewal_cost: domain.domain_costings?.renewal_cost || 0,
            auto_renew: domain.domain_costings?.auto_renew ? 'Yes' : 'No',
          };
        });
  
        return flattenedData;
      }),
      catchError((error) => {
        console.error('Error fetching domain data:', error);
        return [];
      })
    );
  }
  
  getChangeHistory(domainName?: string, days: number = 7): Observable<any[]> {
    let query = this.supabase.supabase
      .from('domain_updates')
      .select('change_type, date')
      .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
  
    if (domainName) {
      query = query.eq('domains.domain_name', domainName);
    }
  
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
  
        // Process data to group by date and change_type
        const historyMap: Record<string, { added: number, removed: number, updated: number }> = {};
  
        data.forEach((entry: { date: string, change_type: string }) => {
          const date = new Date(entry.date).toISOString().split('T')[0]; // Extract day
          if (!historyMap[date]) {
            historyMap[date] = { added: 0, removed: 0, updated: 0 };
          }
          if (entry.change_type === 'added') {
            historyMap[date].added += 1;
          } else if (entry.change_type === 'removed') {
            historyMap[date].removed += 1;
          } else {
            historyMap[date].updated += 1;
          }
        });
  
        return Object.entries(historyMap).map(([date, counts]) => ({
          date,
          ...counts,
        }));
      }),
      catchError((error) => {
        console.error('Error fetching change history:', error);
        return of([]);
      })
    );
  }

  createTag(tag: Tag): Observable<any> {
    return from(
      this.supabase.supabase
        .from('tags')
        .insert([{ 
          name: tag.name, 
          color: tag.color || null, 
          icon: tag.icon || null, 
          description: tag.notes || null 
        }], { })
        .single()
    );
  }
  
  updateTag(tag: any): Observable<void> {
    return from(
      this.supabase.supabase
        .from('tags')
        .update({
          name: tag.name,
          color: tag.color || null, 
          description: tag.description || null,
          icon: tag.icon || null
        })
        .eq('name', tag.name)
    ).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
      }),
      catchError((error) => {
        console.error('Error updating tag:', error);
        return throwError(() => new Error('Failed to update tag.'));
      })
    );
  }

   // Fetch all available domains and the selected domains for a given tag
   getDomainsForTag(tagId: string): Observable<{ available: any[]; selected: any[] }> {
    return forkJoin({
      available: from(
        this.supabase.supabase
          .from('domains')
          .select('*')
      ).pipe(map(({ data }) => data || [])),

      selected: from(
        this.supabase.supabase
          .from('domain_tags')
          .select('domains (domain_name, id)')
          .eq('tag_id', tagId)
      ).pipe(map(({ data }) => (data || []).map((d) => d.domains))),
    });
  }

  getTagsWithDomainCounts(): Observable<any[]> {
    return from(
      this.supabase.supabase
        .rpc('get_tags_with_domain_counts')
        .then((response) => {
          if (response.error) {
            throw response.error;
          }
          return response.data;
        })
    );
  }
  

  // Save domains associated with a tag
  saveDomainsForTag(tagId: string, selectedDomains: any[]): Observable<void> {
    // Fetch existing associations first
    return from(
      this.supabase.supabase
        .from('domain_tags')
        .select('domain_id')
        .eq('tag_id', tagId)
    ).pipe(
      map(({ data }) => data?.map((item: any) => item.domain_id) || []),
      switchMap((existingDomains: string[]) => {
        // Identify domains to add and remove
        const domainIdsToAdd = selectedDomains
          .filter(domain => !existingDomains.includes(domain.id))
          .map(domain => ({ domain_id: domain.id, tag_id: tagId }));

        const domainIdsToRemove = existingDomains
          .filter(domainId => !selectedDomains.some(domain => domain.id === domainId));

        // Perform insert and delete operations
        const addDomains = domainIdsToAdd.length
          ? this.supabase.supabase.from('domain_tags').insert(domainIdsToAdd)
          : Promise.resolve();

        const removeDomains = domainIdsToRemove.length
          ? this.supabase.supabase.from('domain_tags').delete().in('domain_id', domainIdsToRemove).eq('tag_id', tagId)
          : Promise.resolve();

        return forkJoin([from(addDomains), from(removeDomains)]).pipe(map(() => {}));
      })
    );
  }
}
