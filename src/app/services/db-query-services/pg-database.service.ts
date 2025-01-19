import { Injectable } from '@angular/core';
import { DatabaseService, DbDomain, DomainExpiration, SaveDomainData } from '@/types/Database';
import { catchError, from, map, Observable, retry, throwError } from 'rxjs';
import { makeEppArrayFromLabels } from '@/app/constants/security-categories';

// Database queries grouped by functionality into sub-services
import { LinkQueries } from '@/app/services/db-query-services/pg/db-links.service';
import { TagQueries } from '@/app/services/db-query-services/pg/db-tags.service';
import { NotificationQueries } from '@/app/services/db-query-services/pg/db-notifications.service';
import { HistoryQueries } from '@/app/services/db-query-services/pg/db-history.service';
import { ValuationQueries } from '@/app/services/db-query-services/pg/db-valuations.service';
import { RegistrarQueries } from '@/app/services/db-query-services/pg/db-registrars.service';
import { DnsQueries } from '@/app/services/db-query-services/pg/db-dns.service';
import { HostsQueries } from '@/app/services/db-query-services/pg/db-hosts.service';
import { IpQueries } from '@/app/services/db-query-services/pg/db-ips.service';
import { SslQueries } from '@/app/services/db-query-services/pg/db-ssl.service';
import { WhoisQueries } from '@/app/services/db-query-services/pg/db-whois.service';
import { StatusQueries } from '@/app/services/db-query-services/pg/db-statuses.service';
import { SubdomainsQueries } from '@/app/services/db-query-services/pg/db-subdomains.service';
import { PgApiUtilService } from '@/app/utils/pg-api.util';

@Injectable({
  providedIn: 'root',
})
export default class PgDatabaseService extends DatabaseService {

  constructor(private pgApiUtil: PgApiUtilService) {
    super();
    this.linkQueries = new LinkQueries(this.pgApiUtil, this.handleError.bind(this), this.listDomains.bind(this));
    this.tagQueries = new TagQueries(this.pgApiUtil, this.handleError.bind(this), this.getCurrentUser.bind(this));
    this.notificationQueries = new NotificationQueries(this.pgApiUtil, this.handleError.bind(this), this.getCurrentUser.bind(this));
    this.historyQueries = new HistoryQueries(this.pgApiUtil, this.handleError.bind(this));
    this.valuationQueries = new ValuationQueries(this.pgApiUtil, this.handleError.bind(this));
    this.registrarQueries = new RegistrarQueries(this.pgApiUtil, this.handleError.bind(this), this.formatDomainData.bind(this));
    this.dnsQueries = new DnsQueries(this.pgApiUtil, this.handleError.bind(this), this.getCurrentUser.bind(this));
    this.hostsQueries = new HostsQueries(this.pgApiUtil, this.handleError.bind(this), this.formatDomainData.bind(this));
    this.ipQueries = new IpQueries(this.pgApiUtil, this.handleError.bind(this));
    this.sslQueries = new SslQueries(this.pgApiUtil, this.handleError.bind(this), this.getFullDomainQuery.bind(this), this.formatDomainData.bind(this));
    this.whoisQueries = new WhoisQueries(this.pgApiUtil, this.handleError.bind(this));
    this.statusQueries = new StatusQueries(this.pgApiUtil, this.handleError.bind(this));
    this.subdomainsQueries = new SubdomainsQueries(this.pgApiUtil, this.handleError.bind(this));
  }


  private getCurrentUser(): Promise<{ id: string } | null> {
    return Promise.resolve({ id: 'a0000000-aaaa-42a0-a0a0-00a000000a69' });
  }


  private handleError(error: any): Observable<never> {
    console.log('Failed to execute Postgres query', error);
    // this.errorHandler.handleError({
    //   error,
    //   message: 'Failed to execute Postgres query',
    //   location: 'pg-database.service',
    //   showToast: false,
    // });
    return throwError(() => error || new Error('An error occurred while processing your request.'));
  }

  private executeQuery(query: string, params?: any[]): Observable<any> {
    return this.pgApiUtil
      .postToPgExecutor(query, params)
      .pipe(
        map((response: any) => {
          if (response.error) {
            throw new Error(response.error);
          }
          return response.data;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  async domainExists(inputUserId: string | null, domainName: string): Promise<boolean> {
    const query = `
      SELECT EXISTS (
        SELECT 1 FROM domains
        WHERE user_id = $1 AND domain_name = $2
      ) AS exists
    `;
    const params = [inputUserId, domainName];
    const result = await this.executeQuery(query, params).toPromise();
    return result[0]?.exists || false;
  }

  saveDomain(data: SaveDomainData): Observable<DbDomain> {
    return from(this.saveDomainInternal(data)).pipe(catchError((error) => this.handleError(error)));
  }

  private async saveDomainInternal(data: SaveDomainData): Promise<DbDomain> {
    const query = `
      INSERT INTO domains (domain_name, expiry_date, registration_date, updated_date, notes, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      data.domain.domain_name,
      data.domain.expiry_date,
      data.domain.registration_date,
      data.domain.updated_date,
      data.domain.notes,
      'a0000000-aaaa-42a0-a0a0-00a000000a69',
    ];

    const [insertedDomain] = await this.executeQuery(query, params).toPromise();

    // Save related data
    await Promise.all([
      this.ipQueries.saveIpAddresses(insertedDomain.id, data.ipAddresses),
      this.tagQueries.saveTags(insertedDomain.id, data.tags),
      this.notificationQueries.saveNotifications(insertedDomain.id, data.notifications),
      this.dnsQueries.saveDnsRecords(insertedDomain.id, data.dns),
      this.sslQueries.saveSslInfo(insertedDomain.id, data.ssl),
      this.whoisQueries.saveWhoisInfo(insertedDomain.id, data.whois),
      this.registrarQueries.saveRegistrar(insertedDomain.id, data.registrar),
      this.hostsQueries.saveHost(insertedDomain.id, data.host),
      this.statusQueries.saveStatuses(insertedDomain.id, data.statuses),
      this.subdomainsQueries.saveSubdomains(insertedDomain.id, data.subdomains),
    ]);

    return this.getDomainById(insertedDomain.id);
  }

  private async getDomainById(id: string): Promise<DbDomain> {
    const query = `
      SELECT *
      FROM domains
      WHERE id = $1
    `;
    const params = [id];
    const [domainData] = await this.executeQuery(query, params).toPromise();

    if (!domainData) {
      throw new Error('Failed to fetch domain');
    }
    return domainData;
  }

  getFullDomainQuery(): string {
    return `
      domains.*,
      registrars.name AS registrar_name,
      registrars.url AS registrar_url,
      ip_addresses.ip_address,
      ip_addresses.is_ipv6,
      ssl_certificates.issuer,
      ssl_certificates.issuer_country,
      ssl_certificates.subject,
      ssl_certificates.valid_from,
      ssl_certificates.valid_to,
      ssl_certificates.fingerprint,
      ssl_certificates.key_size,
      ssl_certificates.signature_algorithm,
      whois_info.name AS whois_name,
      whois_info.organization AS whois_organization,
      whois_info.country AS whois_country,
      whois_info.street AS whois_street,
      whois_info.city AS whois_city,
      whois_info.state AS whois_state,
      whois_info.postal_code AS whois_postal_code,
      tags.name AS tag_name,
      notification_preferences.notification_type,
      notification_preferences.is_enabled,
      hosts.ip AS host_ip,
      hosts.lat AS host_lat,
      hosts.lon AS host_lon,
      hosts.isp AS host_isp,
      hosts.org AS host_org,
      hosts.as_number AS host_as_number,
      hosts.city AS host_city,
      hosts.region AS host_region,
      hosts.country AS host_country,
      dns_records.record_type,
      dns_records.record_value,
      domain_statuses.status_code AS domain_status_code,
      domain_costings.purchase_price,
      domain_costings.current_value,
      domain_costings.renewal_cost,
      domain_costings.auto_renew,
      sub_domains.name AS subdomain_name,
      sub_domains.sd_info AS subdomain_info,
      domain_links.link_name,
      domain_links.link_url,
      domain_links.link_description
    `;
  }
  

  formatDomainData(data: any): DbDomain {
    return {
      ...data,
      tags: this.extractTags(data),
      ssl: data.ssl_certificates?.[0] || null,
      whois: data.whois_info,
      registrar: data.registrars,
      host: data.domain_hosts?.[0]?.hosts || null,
      dns: {
        mxRecords: data.dns_records?.filter((record: any) => record.record_type === 'MX').map((record: any) => record.record_value) || [],
        txtRecords: data.dns_records?.filter((record: any) => record.record_type === 'TXT').map((record: any) => record.record_value) || [],
        nameServers: data.dns_records?.filter((record: any) => record.record_type === 'NS').map((record: any) => record.record_value) || [],
      },
      statuses: makeEppArrayFromLabels(data.domain_statuses?.map((status: any) => status.status_code) || []),
    };
  }

  private extractTags(data: any): string[] {
    return data.domain_tags?.map((tagItem: any) => tagItem.tags?.name) || [];
  }

  // Add the remaining methods by translating each query as above

  listDomains(): Observable<DbDomain[]> {
    const query = `
SELECT domains.*, registrars.name AS registrar_name, tags.name AS tag_name, hosts.ip AS host_ip FROM domains LEFT JOIN registrars ON domains.registrar_id = registrars.id LEFT JOIN domain_tags ON domains.id = domain_tags.domain_id LEFT JOIN tags ON domain_tags.tag_id = tags.id LEFT JOIN domain_hosts ON domains.id = domain_hosts.domain_id LEFT JOIN hosts ON domain_hosts.host_id = hosts.id
    `;
    return this.executeQuery(query).pipe(
      map((data) => data.map((domain: any) => this.formatDomainData(domain))),
      catchError((error) => this.handleError(error))
    );
  }

  listDomainNames(): Observable<string[]> {
    const query = `
      SELECT LOWER(domain_name) AS domain_name
      FROM domains
    `;
  
    return this.pgApiUtil.postToPgExecutor<{ domain_name: string }>(query).pipe(
      map(({ data }) => data.map((row) => row.domain_name)),
      retry(3),
      catchError((error) => this.handleError(error))
    );
  }

  getDomain(domainName: string): Observable<DbDomain> {
    const query = `
      SELECT
        domains.id,
        domains.user_id,
        domains.domain_name,
        domains.expiry_date,
        domains.registration_date,
        domains.updated_date,
        domains.notes,
        -- Aggregate related data
        COALESCE(JSON_AGG(DISTINCT jsonb_build_object('ip_address', ip_addresses.ip_address, 'is_ipv6', ip_addresses.is_ipv6)) 
                 FILTER (WHERE ip_addresses.ip_address IS NOT NULL), '[]') AS ip_addresses,
        COALESCE(JSON_AGG(DISTINCT jsonb_build_object('notification_type', notification_preferences.notification_type, 'is_enabled', notification_preferences.is_enabled)) 
                 FILTER (WHERE notification_preferences.notification_type IS NOT NULL), '[]') AS notification_preferences,
        COALESCE(JSON_AGG(DISTINCT jsonb_build_object('name', tags.name)) 
                 FILTER (WHERE tags.name IS NOT NULL), '[]') AS tags,
        COALESCE(JSON_AGG(DISTINCT jsonb_build_object('record_type', dns_records.record_type, 'record_value', dns_records.record_value)) 
                 FILTER (WHERE dns_records.record_type IS NOT NULL), '[]') AS dns,
        COALESCE(JSON_AGG(DISTINCT jsonb_build_object('name', sub_domains.name, 'sd_info', sub_domains.sd_info)) 
                 FILTER (WHERE sub_domains.name IS NOT NULL), '[]') AS sub_domains,
        COALESCE(JSON_AGG(DISTINCT jsonb_build_object('link_name', domain_links.link_name, 'link_url', domain_links.link_url, 'link_description', domain_links.link_description)) 
                 FILTER (WHERE domain_links.link_name IS NOT NULL), '[]') AS domain_links,
        jsonb_build_object(
          'issuer', ssl_certificates.issuer,
          'issuer_country', ssl_certificates.issuer_country,
          'subject', ssl_certificates.subject,
          'valid_from', ssl_certificates.valid_from,
          'valid_to', ssl_certificates.valid_to,
          'fingerprint', ssl_certificates.fingerprint,
          'key_size', ssl_certificates.key_size,
          'signature_algorithm', ssl_certificates.signature_algorithm
        ) AS ssl,
        jsonb_build_object(
          'name', whois_info.name,
          'organization', whois_info.organization,
          'country', whois_info.country,
          'street', whois_info.street,
          'city', whois_info.city,
          'state', whois_info.state,
          'postal_code', whois_info.postal_code
        ) AS whois,
        jsonb_build_object(
          'name', registrars.name,
          'url', registrars.url
        ) AS registrar,
        jsonb_build_object(
          'purchase_price', domain_costings.purchase_price,
          'current_value', domain_costings.current_value,
          'renewal_cost', domain_costings.renewal_cost,
          'auto_renew', domain_costings.auto_renew
        ) AS domain_costings,
        jsonb_build_object(
          'ip', hosts.ip,
          'lat', hosts.lat,
          'lon', hosts.lon,
          'isp', hosts.isp,
          'org', hosts.org,
          'as_number', hosts.as_number,
          'city', hosts.city,
          'region', hosts.region,
          'country', hosts.country
        ) AS host
      FROM domains
      LEFT JOIN registrars ON domains.registrar_id = registrars.id
      LEFT JOIN ip_addresses ON domains.id = ip_addresses.domain_id
      LEFT JOIN ssl_certificates ON domains.id = ssl_certificates.domain_id
      LEFT JOIN whois_info ON domains.id = whois_info.domain_id
      LEFT JOIN domain_tags ON domains.id = domain_tags.domain_id
      LEFT JOIN tags ON domain_tags.tag_id = tags.id
      LEFT JOIN notification_preferences ON domains.id = notification_preferences.domain_id
      LEFT JOIN domain_hosts ON domains.id = domain_hosts.domain_id
      LEFT JOIN hosts ON domain_hosts.host_id = hosts.id
      LEFT JOIN dns_records ON domains.id = dns_records.domain_id
      LEFT JOIN domain_statuses ON domains.id = domain_statuses.domain_id
      LEFT JOIN domain_costings ON domains.id = domain_costings.domain_id
      LEFT JOIN sub_domains ON domains.id = sub_domains.domain_id
      LEFT JOIN domain_links ON domains.id = domain_links.domain_id
      WHERE domains.domain_name = $1
      GROUP BY domains.id, registrars.id, ssl_certificates.id, whois_info.id, domain_costings.id, hosts.id
    `;
  
    return this.pgApiUtil.postToPgExecutor<DbDomain>(query, [domainName]).pipe(
      map(({ data }) => {
        if (!data || data.length === 0) {
          throw new Error('Domain not found');
        }
        return this.formatDomainData(data[0]);
      }),
      retry(3), // Retries the request 3 times for transient issues
      catchError((error) => this.handleError(error))
    );
  }
  

  updateDomain(domainId: string, domainData: SaveDomainData): Observable<DbDomain> {
    return from(this.updateDomainInternal(domainId, domainData)).pipe(
      catchError((error) => this.handleError(error))
    );
  }
  
  private async updateDomainInternal(domainId: string, data: any): Promise<DbDomain> {
    const { domain, tags, notifications, subdomains, links } = data;
  
    // Update domain's basic information
    const updateDomainQuery = `
      UPDATE domains
      SET
        expiry_date = $1,
        notes = $2,
        registrar_id = $3
      WHERE id = $4
      RETURNING *;
    `;
    const registrarId = await this.registrarQueries.getOrInsertRegistrarId(domain.registrar);
    const domainParams = [domain.expiry_date, domain.notes, registrarId, domainId];
    const updatedDomain = await this.executeQuery(updateDomainQuery, domainParams).toPromise();
  
    if (!updatedDomain.length) {
      throw new Error('Failed to update domain');
    }
  
    // Handle tags
    if (tags) {
      await this.tagQueries.updateTags(domainId, tags);
    }
  
    // Handle notifications
    if (notifications) {
      await this.notificationQueries.updateNotificationTypes(domainId, notifications);
    }
  
    // Handle subdomains
    if (subdomains) {
      await this.subdomainsQueries.updateSubdomains(domainId, subdomains);
    }
  
    // Handle links
    if (links) {
      await this.linkQueries.updateLinks(domainId, links);
    }
  
    return this.getDomainById(domainId);
  }
  

  getDomainExpirations(): Observable<DomainExpiration[]> {
    const query = `
      SELECT domain_name, expiry_date
      FROM domains
    `;
  
    return this.pgApiUtil.postToPgExecutor<{ domain_name: string; expiry_date: string }>(query).pipe(
      map(({ data }) => 
        data.map((d) => ({
          domain: d.domain_name,
          expiration: new Date(d.expiry_date),
        }))
      ),
      catchError((error) => this.handleError(error))
    );
  }

  getAssetCount(assetType: string): Observable<number> {
    const tableMap: Record<string, string> = {
      'registrars': 'registrars',
      'ip addresses': 'ip_addresses',
      'ssl certificates': 'ssl_certificates',
      'hosts': 'hosts',
      'dns records': 'dns_records',
      'tags': 'tags',
      'links': 'domain_links',
      'subdomains': 'sub_domains',
      'domain statuses': 'domain_statuses',
    };
  
    const table = tableMap[assetType];
    if (!table) {
      throw new Error(`Unknown asset type: ${assetType}`);
    }
  
    const query = `
      SELECT COUNT(*) AS count
      FROM ${table}
    `;
  
    return this.pgApiUtil.postToPgExecutor<{ count: string }>(query).pipe(
      map(({ data }) => (data?.[0]?.count ? parseInt(data[0].count, 10) : 0)),
      catchError((error) => this.handleError(error))
    );
  }

  getStatusesWithDomainCounts(): Observable<{ eppCode: string; description: string; domainCount: number }[]> {
    const query = `
      SELECT 
        domain_statuses.status_code AS epp_code,
        COUNT(domain_statuses.domain_id) AS domain_count
      FROM 
        domain_statuses
      GROUP BY 
        domain_statuses.status_code
      ORDER BY 
        domain_count DESC;
    `;
  
    return this.pgApiUtil.postToPgExecutor<{ epp_code: string; domain_count: number }>(query).pipe(
      map(({ data }) => 
        data.map((item) => ({
          eppCode: item.epp_code,
          description: '', // You can populate the description if necessary
          domainCount: Number(item.domain_count),
        }))
      ),
      catchError((error) => this.handleError(error))
    );
  }

  getDomainsByStatus(statusCode: string): Observable<DbDomain[]> {
    const query = `
      SELECT 
        domains.*,
        registrars.name AS registrar_name,
        registrars.url AS registrar_url,
        ip_addresses.ip_address,
        ip_addresses.is_ipv6,
        ssl_certificates.issuer,
        ssl_certificates.issuer_country,
        ssl_certificates.subject,
        ssl_certificates.valid_from,
        ssl_certificates.valid_to,
        ssl_certificates.fingerprint,
        ssl_certificates.key_size,
        ssl_certificates.signature_algorithm,
        whois_info.name AS whois_name,
        whois_info.organization AS whois_organization,
        whois_info.country AS whois_country,
        whois_info.street AS whois_street,
        whois_info.city AS whois_city,
        whois_info.state AS whois_state,
        whois_info.postal_code AS whois_postal_code,
        hosts.ip AS host_ip,
        hosts.lat AS host_lat,
        hosts.lon AS host_lon,
        hosts.isp AS host_isp,
        hosts.org AS host_org,
        hosts.as_number AS host_as_number,
        hosts.city AS host_city,
        hosts.region AS host_region,
        hosts.country AS host_country,
        dns_records.record_type,
        dns_records.record_value,
        tags.name AS tag_name,
        domain_statuses.status_code AS domain_status_code
      FROM 
        domains
      LEFT JOIN registrars ON domains.registrar_id = registrars.id
      LEFT JOIN ip_addresses ON domains.id = ip_addresses.domain_id
      LEFT JOIN ssl_certificates ON domains.id = ssl_certificates.domain_id
      LEFT JOIN whois_info ON domains.id = whois_info.domain_id
      LEFT JOIN domain_hosts ON domains.id = domain_hosts.domain_id
      LEFT JOIN hosts ON domain_hosts.host_id = hosts.id
      LEFT JOIN dns_records ON domains.id = dns_records.domain_id
      LEFT JOIN domain_tags ON domains.id = domain_tags.domain_id
      LEFT JOIN tags ON domain_tags.tag_id = tags.id
      LEFT JOIN domain_statuses ON domains.id = domain_statuses.domain_id
      WHERE 
        domain_statuses.status_code = $1;
    `;
  
    return this.pgApiUtil.postToPgExecutor<DbDomain>(query, [statusCode]).pipe(
      map(({ data }) => data.map((domain) => this.formatDomainData(domain))),
      catchError((error) => this.handleError(error))
    );
  }
  

  private getTimeIntervalForTimeframe(timeframe: string): string {
    switch (timeframe) {
      case 'day':
        return '1 day';
      case 'week':
        return '1 week';
      case 'month':
        return '1 month';
      case 'year':
        return '1 year';
      default:
        return '1 day';
    }
  }

  
  async getDomainUptime(userId: string, domainId: string, timeframe: string): Promise<{
    checked_at: string;
    is_up: boolean;
    response_code: number;
    response_time_ms: number;
    dns_lookup_time_ms: number;
    ssl_handshake_time_ms: number;
  }[]> {
    const timeInterval = this.getTimeIntervalForTimeframe(timeframe);
  
    const query = `
      SELECT
        u.checked_at,
        u.is_up,
        u.response_code,
        u.response_time_ms,
        u.dns_lookup_time_ms,
        u.ssl_handshake_time_ms
      FROM
        uptime u
      JOIN
        domains d ON u.domain_id = d.id
      WHERE
        d.user_id = $1
        AND u.domain_id = $2
        AND u.checked_at >= NOW() - $3::INTERVAL
      ORDER BY
        u.checked_at
    `;
  
    const params = [userId, domainId, timeInterval];
  
    try {
      const data = await this.executeQuery(query, params).toPromise();
      return data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
}
