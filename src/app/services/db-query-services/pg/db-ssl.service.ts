import { catchError, from, map, Observable } from 'rxjs';
import { PgApiUtilService } from '@/app/utils/pg-api.util';
import { DbDomain, SaveDomainData } from '@/types/Database';

export class SslQueries {
  constructor(
    private pgApiUtil: PgApiUtilService,
    private handleError: (error: any) => Observable<never>,
    private getFullDomainQuery: () => string,
    private formatDomainData: (domain: any) => DbDomain,
  ) {}

  getSslIssuersWithDomainCounts(): Observable<{ issuer: string; domain_count: number }[]> {
    const query = `
      SELECT ssl_certificates.issuer, COUNT(domains.id) AS domain_count
      FROM ssl_certificates
      INNER JOIN domains ON ssl_certificates.domain_id = domains.id
      GROUP BY ssl_certificates.issuer
    `;

    return from(this.pgApiUtil.postToPgExecutor<{ issuer: string; domain_count: number }>(query)).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error))
    );
  }

  getDomainsBySslIssuer(issuer: string): Observable<DbDomain[]> {
    const query = `
      SELECT ${this.getFullDomainQuery()} 
      FROM domains
      INNER JOIN ssl_certificates ON domains.id = ssl_certificates.domain_id
      WHERE ssl_certificates.issuer = $1
    `;
    const params = [issuer];

    return from(this.pgApiUtil.postToPgExecutor(query, params)).pipe(
      map(response => response.data.map(domain => this.formatDomainData(domain))),
      catchError(error => this.handleError(error))
    );
  }

  async saveSslInfo(domainId: string, ssl: SaveDomainData['ssl']): Promise<void> {
    if (!ssl) return;

    const query = `
      INSERT INTO ssl_certificates (
        domain_id, issuer, issuer_country, subject, valid_from, valid_to, fingerprint, key_size, signature_algorithm
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    const params = [
      domainId,
      ssl.issuer,
      ssl.issuer_country,
      ssl.subject,
      new Date(ssl.valid_from),
      new Date(ssl.valid_to),
      ssl.fingerprint,
      ssl.key_size,
      ssl.signature_algorithm,
    ];

    try {
      await this.pgApiUtil.postToPgExecutor(query, params).toPromise();
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
}
