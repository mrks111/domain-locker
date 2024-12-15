import { SupabaseClient, User } from '@supabase/supabase-js';
import { catchError, from, map, Observable, switchMap } from 'rxjs';
import { Link } from '@/types/Database';

export class LinkQueries {
  constructor(
    private supabase: SupabaseClient,
    private handleError: (error: any) => Observable<never>,
    private listDomainNames: () => Observable<string[]>,
  ) {}

  getAllLinks(): Observable<{
    groupedByDomain: Record<string, Link[]>;
    linksWithDomains: {
      id: string;
      link_name: string;
      link_url: string;
      link_description?: string;
      domains: string[];
    }[];
  }> {
    return from(
      this.supabase
        .from('domain_links')
        .select(`
          id,
          link_name,
          link_url,
          link_description,
          domains(domain_name)
        `)
        .then(({ data, error }) => {
          if (error) throw error;

          // Group links by domain
          const groupedByDomain = data.reduce((acc: Record<string, Link[]>, link: any) => {
            const domainName = link.domains?.domain_name || 'Unknown Domain';
            if (!acc[domainName]) acc[domainName] = [];
            acc[domainName].push({
              id: link.id,
              link_name: link.link_name,
              link_url: link.link_url,
              link_description: link.link_description,
            });
            return acc;
          }, {});

          // Aggregate domains for each unique link grouped by link_url
          const linkDomains = data.reduce(
            (
              acc: Record<
                string,
                {
                  id: string;
                  link_name: string;
                  link_url: string;
                  link_description?: string;
                  domains: Set<string>;
                }
              >,
              link: any,
            ) => {
              const key = link.link_url; // Group by link_url
              if (!acc[key]) {
                acc[key] = {
                  id: link.id, // Assign the first ID encountered for the link group
                  link_name: link.link_name,
                  link_url: link.link_url,
                  link_description: link.link_description,
                  domains: new Set(),
                };
              }
              if (link.domains?.domain_name) acc[key].domains.add(link.domains.domain_name);
              return acc;
            },
            {},
          );

          const linksWithDomains = Object.values(linkDomains).map(
            ({ id, link_name, link_url, link_description, domains }) => ({
              id, // Include the ID for editing purposes
              link_name,
              link_url,
              link_description,
              domains: Array.from(domains),
            }),
          );

          return { groupedByDomain, linksWithDomains };
        }),
    ).pipe(catchError((error) => this.handleError(error)));
  }

  addLinkToDomains(linkData: {
    link_name?: string;
    link_url?: string;
    link_description?: string;
    domains?: string[];
  }): Observable<void> {
    const { link_name, link_url, link_description, domains } = linkData;

    return this.listDomainNames().pipe(
      switchMap((availableDomains) => {
        // Filter valid domains that exist in the database
        const validDomains = (domains || []).filter((domain) => availableDomains.includes(domain));

        // Fetch the domain IDs for the valid domains
        return from(
          this.supabase.from('domains').select('id, domain_name').in('domain_name', validDomains),
        ).pipe(
          map(({ data, error }) => {
            if (error) throw error;
            return data?.map((domain) => domain.id) || [];
          }),
        );
      }),
      switchMap((domainIds: string[]) => {
        if (domainIds.length === 0) {
          throw new Error('No valid domains found to associate with the link.');
        }

        // Prepare link objects for insertion
        const linksToInsert = domainIds.map((domainId) => ({
          domain_id: domainId,
          link_name,
          link_url,
          link_description,
        }));

        // Insert the links into the domain_links table
        return from(this.supabase.from('domain_links').insert(linksToInsert)).pipe(
          map(({ error }) => {
            if (error) throw error;
          }),
        );
      }),
      catchError((error) => this.handleError(error)),
    );
  }

  updateLinkInDomains(
    linkId: string,
    linkData: {
      link_name?: string;
      link_url?: string;
      link_description?: string;
      domains?: string[];
    },
  ): Observable<void> {
    const { link_name, link_url, link_description, domains } = linkData;

    return this.listDomainNames().pipe(
      switchMap((availableDomains) => {
        const validDomains = (domains || []).filter((domain) => availableDomains.includes(domain));

        return from(
          this.supabase.from('domains').select('id, domain_name').in('domain_name', validDomains),
        ).pipe(
          map(({ data, error }) => {
            if (error) throw error;
            return data?.map((domain) => domain.id) || [];
          }),
        );
      }),
      switchMap((domainIds: string[]) => {
        if (domainIds.length === 0) {
          throw new Error('No valid domains found to associate with the link.');
        }

        return from(
          this.supabase
            .from('domain_links')
            .update({
              link_name,
              link_url,
              link_description,
            })
            .eq('id', linkId),
        ).pipe(
          map(({ error }) => {
            if (error) throw error;
            return domainIds;
          }),
        );
      }),
      switchMap(async (domainIds: string[]) => {
        const { data: existingLinks, error } = await this.supabase
          .from('domain_links')
          .select('domain_id')
          .eq('id', linkId);

        if (error) throw error;

        const existingDomainIds = existingLinks?.map((link) => link.domain_id) || [];

        const domainsToAdd = domainIds.filter((id) => !existingDomainIds.includes(id));
        const domainsToRemove = existingDomainIds.filter((id) => !domainIds.includes(id));

        const tasks: Promise<any>[] = [];

        // Add new domain associations
        if (domainsToAdd.length > 0) {
          tasks.push(
            Promise.resolve(
              this.supabase
                .from('domain_links')
                .insert(domainsToAdd.map((domainId) => ({ id: linkId, domain_id: domainId }))),
            ).then(({ error }) => {
              if (error) throw error;
            }),
          );
        }

        // Remove old domain associations
        if (domainsToRemove.length > 0) {
          tasks.push(
            Promise.resolve(
              this.supabase
                .from('domain_links')
                .delete()
                .eq('id', linkId)
                .in('domain_id', domainsToRemove),
            ).then(({ error }) => {
              if (error) throw error;
            }),
          );
        }

        await Promise.all(tasks);
      }),
      map(() => void 0),
      catchError((error) => this.handleError(error)),
    );
  }
}
