import { catchError, from, map, Observable, switchMap } from 'rxjs';
import { PgApiUtilService } from '@/app/utils/pg-api.util';
import { Link } from '@/types/Database';
import { LinkResponse, ModifiedLink } from '@/app/pages/assets/links/index.page';

export class LinkQueries {
  constructor(
    private pgApiUtil: PgApiUtilService,
    private handleError: (error: any) => Observable<never>,
    private listDomainNames: () => Observable<string[]>,
  ) {}

  async updateLinks(domainId: string, links: Link[]): Promise<void> {
    const existingQuery = `SELECT id, link_name, link_url, link_description FROM domain_links WHERE domain_id = $1`;
    const { data: existingLinks } = await this.pgApiUtil.postToPgExecutor(existingQuery, [domainId]).toPromise();

    const linksToAdd = links.filter(
      (newLink) => !existingLinks.some(
        (existingLink) =>
          existingLink.link_name === newLink.link_name &&
          existingLink.link_url === newLink.link_url
      )
    );

    const linksToRemove = existingLinks.filter(
      (existingLink) => !links.some(
        (newLink) =>
          newLink.link_name === existingLink.link_name &&
          newLink.link_url === existingLink.link_url
      )
    );

    const linksToUpdate = links.filter(
      (newLink) => existingLinks.some(
        (existingLink) =>
          existingLink.link_name === newLink.link_name &&
          (existingLink.link_url !== newLink.link_url || existingLink.link_description !== newLink.link_description)
      )
    );

    if (linksToAdd.length > 0) {
      const addQuery = `
        INSERT INTO domain_links (domain_id, link_name, link_url, link_description)
        VALUES ${linksToAdd.map((_, i) => `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`).join(', ')}`;
      const addParams = [domainId, ...linksToAdd.flatMap((link) => [link.link_name, link.link_url, link.link_description])];
      await this.pgApiUtil.postToPgExecutor(addQuery, addParams).toPromise();
    }

    for (const link of linksToUpdate) {
      const updateQuery = `
        UPDATE domain_links
        SET link_url = $1, link_description = $2
        WHERE domain_id = $3 AND link_name = $4`;
      const updateParams = [link.link_url, link.link_description, domainId, link.link_name];
      await this.pgApiUtil.postToPgExecutor(updateQuery, updateParams).toPromise();
    }

    if (linksToRemove.length > 0) {
      const removeQuery = `
        DELETE FROM domain_links
        WHERE domain_id = $1 AND link_name = ANY($2)`;
      const removeParams = [domainId, linksToRemove.map((link) => link.link_name)];
      await this.pgApiUtil.postToPgExecutor(removeQuery, removeParams).toPromise();
    }
  }

  getAllLinks(): Observable<LinkResponse> {
    const query = `
      SELECT dl.id, dl.link_name, dl.link_url, dl.link_description, d.domain_name
      FROM domain_links dl
      LEFT JOIN domains d ON dl.domain_id = d.id`;

    return from(this.pgApiUtil.postToPgExecutor(query)).pipe(
      map(({ data }) => {
        const groupedByDomain = data.reduce((acc: Record<string, Link[]>, link: any) => {
          const domainName = link.domain_name || 'Unknown Domain';
          if (!acc[domainName]) acc[domainName] = [];
          acc[domainName].push({
            id: link.id,
            link_name: link.link_name,
            link_url: link.link_url,
            link_description: link.link_description,
          });
          return acc;
        }, {});

        const linkDomains = data.reduce((acc, link) => {
          const key = link.link_url;
          if (!acc[key]) {
            acc[key] = {
              link_name: link.link_name,
              link_url: link.link_url,
              link_description: link.link_description,
              link_ids: new Set(),
              domains: new Set(),
            };
          }
          acc[key].link_ids.add(link.id);
          if (link.domain_name) acc[key].domains.add(link.domain_name);
          return acc;
        }, {});

        const linksWithDomains = Object.values(linkDomains).map(({ link_name, link_url, link_description, link_ids, domains }) => ({
          id: undefined,
          link_name,
          link_url,
          link_description,
          link_ids: Array.from(link_ids),
          domains: Array.from(domains),
        }));

        return { groupedByDomain, linksWithDomains };
      }),
      catchError((error) => this.handleError(error))
    );
  }

  addLinkToDomains(linkData: { link_name?: string; link_url?: string; link_description?: string; domains?: string[] }): Observable<void> {
    const { link_name, link_url, link_description, domains } = linkData;

    return this.listDomainNames().pipe(
      switchMap((availableDomains) => {
        const validDomains = (domains || []).filter((domain) => availableDomains.includes(domain));
        const fetchQuery = `SELECT id FROM domains WHERE domain_name = ANY($1)`;
        return from(this.pgApiUtil.postToPgExecutor(fetchQuery, [validDomains])).pipe(
          map(({ data }) => data.map((domain) => domain.id)),
          switchMap((domainIds) => {
            if (domainIds.length === 0) {
              throw new Error('No valid domains found to associate with the link.');
            }

            const insertQuery = `
              INSERT INTO domain_links (domain_id, link_name, link_url, link_description)
              VALUES ${domainIds.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ')}`;
            const insertParams = domainIds.flatMap((id) => [id, link_name, link_url, link_description]);
            return from(this.pgApiUtil.postToPgExecutor(insertQuery, insertParams)).pipe(map(() => void 0));
          })
        );
      }),
      catchError((error) => this.handleError(error))
    );
  }

  deleteLinks(linkIds: string | string[]): Observable<void> {
    const ids = Array.isArray(linkIds) ? linkIds : [linkIds];
    const query = `DELETE FROM domain_links WHERE id = ANY($1)`;
    const params = [ids];

    return from(this.pgApiUtil.postToPgExecutor(query, params)).pipe(
      map(() => void 0),
      catchError((error) => this.handleError(error))
    );
  }
}
