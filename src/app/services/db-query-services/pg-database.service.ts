import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatabaseService, DbDomain, IpAddress, SaveDomainData, DomainExpiration } from '@/types/Database';
import { catchError, from, map, Observable, throwError } from 'rxjs';
import { makeEppArrayFromLabels } from '@/app/constants/security-categories';
import { ErrorHandlerService } from '@/app/services/error-handler.service';

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
  public linkQueries: LinkQueries;
  public tagQueries: TagQueries;
  public notificationQueries: NotificationQueries;
  public historyQueries: HistoryQueries;
  public valuationQueries: ValuationQueries;
  public registrarQueries: RegistrarQueries;
  public dnsQueries: DnsQueries;
  public hostsQueries: HostsQueries;
  public ipQueries: IpQueries;
  public sslQueries: SslQueries;
  public whoisQueries: WhoisQueries;
  public statusQueries: StatusQueries;
  public subdomainsQueries: SubdomainsQueries;

  constructor(private pgApiUtil: PgApiUtilService) {
    super();
    this.linkQueries = new LinkQueries(this.pgApiUtil, this.handleError.bind(this));
    this.tagQueries = new TagQueries(this.pgApiUtil, this.handleError.bind(this));
    this.notificationQueries = new NotificationQueries(this.pgApiUtil, this.handleError.bind(this), this.getCurrentUser.bind(this));
    this.historyQueries = new HistoryQueries(this.pgApiUtil, this.handleError.bind(this));
    this.valuationQueries = new ValuationQueries(this.pgApiUtil, this.handleError.bind(this));
    this.registrarQueries = new RegistrarQueries(this.pgApiUtil, this.handleError.bind(this));
    this.dnsQueries = new DnsQueries(this.pgApiUtil, this.handleError.bind(this));
    this.hostsQueries = new HostsQueries(this.pgApiUtil, this.handleError.bind(this));
    this.ipQueries = new IpQueries(this.pgApiUtil, this.handleError.bind(this));
    this.sslQueries = new SslQueries(this.pgApiUtil, this.handleError.bind(this));
    this.whoisQueries = new WhoisQueries(this.pgApiUtil, this.handleError.bind(this));
    this.statusQueries = new StatusQueries(this.pgApiUtil, this.handleError.bind(this));
    this.subdomainsQueries = new SubdomainsQueries(this.pgApiUtil, this.handleError.bind(this));
  }

  // constructor(private http: HttpClient, private errorHandler: ErrorHandlerService) {
  //   super();
  //   this.linkQueries = new LinkQueries(this.executeQuery.bind(this), this.handleError.bind(this));
  //   this.tagQueries = new TagQueries(this.executeQuery.bind(this), this.handleError.bind(this));
  //   this.notificationQueries = new NotificationQueries(this.executeQuery.bind(this), this.handleError.bind(this));
  //   this.historyQueries = new HistoryQueries(this.executeQuery.bind(this), this.handleError.bind(this));
  //   this.valuationQueries = new ValuationQueries(this.executeQuery.bind(this), this.handleError.bind(this));
  //   this.registrarQueries = new RegistrarQueries(this.executeQuery.bind(this), this.handleError.bind(this));
  //   this.dnsQueries = new DnsQueries(this.executeQuery.bind(this), this.handleError.bind(this));
  //   this.hostsQueries = new HostsQueries(this.executeQuery.bind(this), this.handleError.bind(this));
  //   this.ipQueries = new IpQueries(this.executeQuery.bind(this), this.handleError.bind(this));
  //   this.sslQueries = new SslQueries(this.executeQuery.bind(this), this.handleError.bind(this));
  //   this.whoisQueries = new WhoisQueries(this.executeQuery.bind(this), this.handleError.bind(this));
  //   this.statusQueries = new StatusQueries(this.executeQuery.bind(this), this.handleError.bind(this));
  //   this.subdomainsQueries = new SubdomainsQueries(this.executeQuery.bind(this), this.handleError.bind(this));
  // }


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

  async getCurrentUser(): Promise<{ id: string } | null> {
    return { id: 'a0000000-aaaa-42a0-a0a0-00a000000a69' };
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
  
}
