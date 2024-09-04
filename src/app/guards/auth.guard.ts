// src/app/guards/client-auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const clientAuthGuard = () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  if (!supabaseService.getToken()) {
    return router.parseUrl('/login');
  }
  return true;
};
