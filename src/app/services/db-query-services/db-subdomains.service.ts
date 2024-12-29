import { SupabaseClient, User } from '@supabase/supabase-js';
import { catchError, forkJoin, from, map, Observable, of } from 'rxjs';
import { Subdomain } from '@/types/Database';

export class SubdomainsQueries {
  constructor(
    private supabase: SupabaseClient,
    private handleError: (error: any) => Observable<never>,
  ) {}


  async saveSubdomains(domainId: string, subdomains: { name: string; sd_info?: string }[]): Promise<void> {
    if (!subdomains || subdomains.length === 0) return;

    // Fetch existing subdomains for the domain
    const { data: existingSubdomains, error: fetchError } = await this.supabase
      .from('sub_domains')
      .select('name')
      .eq('domain_id', domainId);

    if (fetchError) this.handleError(fetchError);

    const existingNames = (existingSubdomains || []).map((sd: { name: string }) => sd.name);

    // Filter out subdomains that already exist
    const subdomainsToInsert = subdomains.filter((sd) => !existingNames.includes(sd.name));

    if (subdomainsToInsert.length > 0) {
      const formattedSubdomains = subdomainsToInsert.map((sd) => ({
        domain_id: domainId,
        name: sd.name,
        sd_info: sd.sd_info || null,
      }));

      const { error: subdomainError } = await this.supabase.from('sub_domains').insert(formattedSubdomains);
      if (subdomainError) this.handleError(subdomainError);
    }
  }

  async updateSubdomains(domainId: string, subdomains: { name: string; sd_info?: string }[]): Promise<void> {
    console.log('Updating subdomains:', subdomains);

    // Get existing subdomains from the database
    const { data: existingData, error } = await this.supabase
      .from('sub_domains')
      .select('name, sd_info')
      .eq('domain_id', domainId);

    if (error) throw error;

    const existingSubdomains = existingData || [];

    // Determine which subdomains to add and remove
    const subdomainsToAdd = subdomains.filter(
      (sd) => !existingSubdomains.some((existing) => existing.name === sd.name)
    );

    const subdomainsToRemove = existingSubdomains
      .filter((existing) => !subdomains.some((sd) => sd.name === existing.name))
      .map((sd) => sd.name);

    // Insert new subdomains
    if (subdomainsToAdd.length > 0) {
      const { error: insertError } = await this.supabase
        .from('sub_domains')
        .insert(
          subdomainsToAdd.map((sd) => ({
            domain_id: domainId,
            name: sd.name,
            sd_info: sd.sd_info || null,
          }))
        );

      if (insertError) throw insertError;
    }

    // Remove old subdomains
    if (subdomainsToRemove.length > 0) {
      const { error: deleteError } = await this.supabase
        .from('sub_domains')
        .delete()
        .eq('domain_id', domainId)
        .in('name', subdomainsToRemove);

      if (deleteError) throw deleteError;
    }

    // Update existing subdomains with new `sd_info` (if provided)
    for (const sd of subdomains) {
      const existing = existingSubdomains.find((e) => e.name === sd.name);
      if (existing && sd.sd_info && sd.sd_info !== existing.sd_info) {
        const { error: updateError } = await this.supabase
          .from('sub_domains')
          .update({ sd_info: sd.sd_info })
          .eq('domain_id', domainId)
          .eq('name', sd.name);

        if (updateError) throw updateError;
      }
    }
  }

  getAllSubdomains(): Observable<any[]> {
    return from(
      this.supabase
        .from('sub_domains')
        .select(`
          name,
          sd_info,
          domains (domain_name)
        `)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        // Flatten the result so `domain_name` is at the same level as other fields
        return (data || []).map((subdomain) => ({
          ...subdomain,
          // @ts-ignore - `domains` is a relation. It DOES exist. Fuck you Typescript.
          // domain_name: subdomain.domains?.domain_name,
        }));
      })
    );
  }

  getSubdomainsByDomain(domain: string): Observable<any[]> {
    return from(
      this.supabase
        .from('sub_domains')
        .select('name, sd_info, domains(domain_name)')
        .filter('domains.domain_name', 'eq', domain)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const filteredData = (data || []).filter(item => item.domains !== null);
        return filteredData;
      })
    );
  }

  getSubdomainInfo(domain: string, subdomain: string): Observable<any> {
    return from(
      this.supabase
        .from('sub_domains')
        .select('name, sd_info, domains(domain_name)')
        .eq('domains.domain_name', domain)
        .eq('name', subdomain)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const firstResult = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (firstResult && firstResult.sd_info && typeof firstResult.sd_info === 'string') {
          try {
            firstResult.sd_info = JSON.parse(firstResult.sd_info);
          } catch (error2) {
            this.handleError({ error: error2, message: 'Failed to parse subdomain info' });
          }
        }
        return firstResult;
      })
    );
  }


  // Helper to group and parse subdomains
  groupSubdomains(subdomains: any[]): { domain: string; subdomains: Subdomain[] }[] {
    const grouped = subdomains.reduce((acc, subdomain) => {
      const domainName = subdomain.domains?.domain_name;

      // Skip subdomains without a domain name
      if (!domainName) return acc;

      // Safely parse the `sd_info` JSON
      let parsedSdInfo = null;
      if (subdomain.sd_info) {
        try {
          parsedSdInfo = JSON.parse(subdomain.sd_info);
        } catch (error) {
          console.warn(`Failed to parse sd_info for subdomain ${subdomain.name}:`, error);
        }
      }

      // Find the group for this domain or create it
      if (!acc[domainName]) {
        acc[domainName] = [];
      }

      // Push the subdomain into the appropriate group
      acc[domainName].push({
        ...subdomain,
        sd_info: parsedSdInfo, // Replace the original `sd_info` with the parsed object
      });

      return acc;
    }, {} as Record<string, any[]>);

    // Convert the grouped object into an array
    return Object.keys(grouped).map((domain) => ({
      domain,
      subdomains: grouped[domain],
    }));
  }

}
