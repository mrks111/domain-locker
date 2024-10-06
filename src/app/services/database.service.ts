// src/app/services/supabase-database.service.ts

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DatabaseService, DbDomain, Domain, IpAddress, Notification, Tag, SaveDomainData } from '../../types/Database';
import { from, map, Observable } from 'rxjs';

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

  async saveDomain(data: SaveDomainData): Promise<Domain> {
    const { domain, ipAddresses, tags, notifications } = data;

    console.log(data);
  
    const dbDomain: Partial<DbDomain> = {
      domain_name: domain.domainName,
      registrar: domain.registrar,
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
  
    await Promise.all([
      this.saveIpAddresses(insertedDomain.id, ipAddresses),
      this.saveTags(insertedDomain.id, tags),
      this.saveNotifications(insertedDomain.id, notifications)
    ]);
  
    return this.mapDbDomainToDomain(insertedDomain);
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

  private mapDbDomainToDomain(dbDomain: DbDomain): Domain {
    return {
      id: dbDomain.id,
      userId: dbDomain.user_id,
      domainName: dbDomain.domain_name,
      registrar: dbDomain.registrar,
      expiryDate: new Date(dbDomain.expiry_date),
      notes: dbDomain.notes,
      createdAt: new Date(dbDomain.created_at),
      updatedAt: new Date(dbDomain.updated_at)
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

  override listDomains(): Observable<Domain[]> {
    return new Observable(observer => {
      this.supabase.supabase
        .from('domains')
        .select(`
          *,
          ip_addresses (ip_address, is_ipv6),
          ssl_certificates (issuer, issuer_country, subject, valid_from, valid_to, fingerprint, key_size, signature_algorithm),
          whois_info (registrant_country, registrant_state_province, created_date, updated_date, registry_domain_id, registrar_id, registrar_url),
          domain_tags (tags (name))
        `)
        .then(({ data, error }) => {
          if (error) {
            observer.error(error);
          } else {
            observer.next(data as Domain[]);
            observer.complete();
          }
        });
    });
  }
  

  override getDomain(id: string): Promise<Domain | null> {
    throw new Error('Method not implemented.');
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
