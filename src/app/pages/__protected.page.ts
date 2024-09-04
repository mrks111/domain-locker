import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';

// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//   const supabaseService = inject(SupabaseService);

//   return supabaseService.getSession().then(({ data: { session } }) => {
//     if (session) {
//       const modifiedReq = req.clone({
//         setHeaders: {
//           Authorization: `Bearer ${session.access_token}`
//         }
//       });
//       return next(modifiedReq);
//     }
//     return next(req);
//   });
// };
