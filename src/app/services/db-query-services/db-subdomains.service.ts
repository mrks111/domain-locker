import { SupabaseClient, User } from '@supabase/supabase-js';
import { catchError, forkJoin, from, map, Observable, of, switchMap, throwError } from 'rxjs';
import { Subdomain } from '@/types/Database';
import { GlobalMessageService } from '../messaging.service';

export class SubdomainsQueries {
  constructor(
    private supabase: SupabaseClient,
    private handleError: (error: any) => Observable<never>,
    private messageService: GlobalMessageService,
  ) {}

  // Combines fetchDomainId and saveSubdomains
  saveSubdomainsForDomainName(
    domain: string,
    subdomains: { name: string; sd_info?: string }[]
  ): Observable<void> {
    return this.fetchDomainId(domain).pipe(
      switchMap((domainId) => {
        return from(this.saveSubdomains(domainId, subdomains));
      }),
      catchError((error) => {
        return this.handleError(error);
      })
    );
  }
  
  
  

  // Reusable function to fetch domain ID based on domain name
  fetchDomainId(domain: string): Observable<string> {
    return from(
      this.supabase
        .from('domains')
        .select('id')
        .eq('domain_name', domain)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(`Failed to fetch domain ID: ${error.message}`);
        }
  
        const domainId = data?.id;
        if (!domainId) {
          throw new Error(`Domain ID not found for domain name: ${domain}`);
        }
  
        return domainId;
      }),
      catchError((error) => {
        return this.handleError(error);
      })
    );
  }
  

  async saveSubdomains(domainId: string, subdomains: { name: string; sd_info?: string }[]): Promise<void> {
    console.log('Saving subdomains:', domainId, subdomains);
    if (!subdomains || subdomains.length === 0) {
      throw new Error('Skipping subdomains, none found');
    }

    // Filter out invalid subdomains
    const validSubdomains = subdomains.filter(sd => sd.name?.trim());
    if (validSubdomains.length === 0) {
      throw new Error('Skipping subdomains, no valid subdomains listed');
    }

    try {
      const { data, error } = await this.supabase
        .from('sub_domains')
        .select('name')
        .eq('domain_id', domainId);

      if (error) throw error;

      const existingNames = (data || []).map((sd: { name: string }) => sd.name);
      const subdomainsToInsert = validSubdomains.filter(sd => !existingNames.includes(sd.name));

      if (subdomainsToInsert.length === 0) {
        throw new Error('Skipping subdomains, all already exist');
      }

      const formattedSubdomains = subdomainsToInsert.map(sd => ({
        domain_id: domainId,
        name: sd.name,
        sd_info: sd.sd_info || null,
      }));

      const { error: subdomainError } = await this.supabase
        .from('sub_domains')
        .insert(formattedSubdomains);

      if (subdomainError) {
        throw new Error(`Failed to insert subdomains: ${subdomainError.message}`);
      }
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  


  // async deleteSubdomain(domain: string, subdomain: string): Promise<void> {
  //   try {
  //     const domainId = await this.fetchDomainId(domain);

  //     const { error: deleteError } = await this.supabase
  //       .from('sub_domains')
  //       .delete()
  //       .eq('name', subdomain)
  //       .eq('domain_id', domainId);

  //     if (deleteError) {
  //       throw new Error(`Failed to delete subdomain: ${deleteError.message}`);
  //     }
  //   } catch (error: Error | any) {
  //     throw new Error(`Failed to delete subdomain: ${error.message}`);
  //   }
  // }

  async deleteSubdomainsByDomain(domain: string): Promise<void> {
    try {
      const domainId = await this.fetchDomainId(domain);

      const { error: deleteError } = await this.supabase
        .from('sub_domains')
        .delete()
        .eq('domain_id', domainId);

      if (deleteError) {
        throw new Error(`Failed to delete subdomains for domain ${domain}: ${deleteError.message}`);
      }
    } catch (error: Error | any) {
      throw new Error(`Failed to delete subdomains by domain: ${error.message}`);
    }
  }

  async updateSubdomains(domainId: string, subdomains: { name: string; sd_info?: string }[]): Promise<void> {
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

    if (subdomainsToRemove.length > 0) {
      const { error: deleteError } = await this.supabase
        .from('sub_domains')
        .delete()
        .eq('domain_id', domainId)
        .in('name', subdomainsToRemove);

      if (deleteError) throw deleteError;
    }

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
        .select('id, name, sd_info, domain:domains!inner(domain_name)')
        .eq('domain.domain_name', domain)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
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

  async deleteSubdomain(domain: string, subdomain: string): Promise<void> {
    try {
      // Fetch the domain_id for the given domain name
      const { data: domainData, error: domainError } = await this.supabase
        .from('domains')
        .select('id')
        .eq('domain_name', domain)
        .single();

      if (domainError) {
        throw new Error(`Failed to fetch domain ID: ${domainError.message}`);
      }

      const domainId = domainData?.id;

      if (!domainId) {
        throw new Error(`Domain ID not found for domain name: ${domain}`);
      }

      // Perform the delete using the domain_id
      const { error: deleteError } = await this.supabase
        .from('sub_domains')
        .delete()
        .eq('name', subdomain)
        .eq('domain_id', domainId);

      if (deleteError) {
        throw new Error(`Failed to delete subdomain: ${deleteError.message}`);
      }
    } catch (error: Error | any) {
      throw new Error(`Failed to delete subdomain: ${error.message}`);
    }
  }


}
