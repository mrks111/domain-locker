import { SupabaseClient, User } from '@supabase/supabase-js';
import { catchError, forkJoin, from, map, Observable, of } from 'rxjs';
import { Subdomain } from '@/types/Database';

export class SubdomainsQueries {
  constructor(
    private supabase: SupabaseClient,
    private handleError: (error: any) => Observable<never>,
    private getCurrentUser: () => Promise<User | null>,
  ) {}

  
  async saveSubdomains(domainId: string, subdomains: string[]): Promise<void> {
    if (!subdomains || subdomains.length === 0) return;
    const formattedSubdomains = subdomains.map(name => ({ domain_id: domainId, name }));
    const { error: subdomainError } = await this.supabase
      .from('sub_domains')
      .insert(formattedSubdomains);
    if (subdomainError) this.handleError(subdomainError);
  }

  async updateSubdomains(domainId: string, subdomains: string[]): Promise<void> {
    // Get existing subdomains from the database
    const { data: existingData, error } = await this.supabase
      .from('sub_domains')
      .select('name')
      .eq('domain_id', domainId);

    if (error) throw error;

    const existingSubdomains = (existingData || []).map((sd: { name: string }) => sd.name);

    // Determine which subdomains to add and remove
    const subdomainsToAdd = subdomains.filter(sd => !existingSubdomains.includes(sd));
    const subdomainsToRemove = existingSubdomains.filter(sd => !subdomains.includes(sd));

    // Insert new subdomains
    if (subdomainsToAdd.length > 0) {
      const { error: insertError } = await this.supabase
        .from('sub_domains')
        .insert(subdomainsToAdd.map(name => ({ domain_id: domainId, name })));
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
  }
}
