// // src/server/middleware/auth.ts
// import { defineEventHandler, sendRedirect } from 'h3';
// import { createClient } from '@supabase/supabase-js';
// import dotenv from 'dotenv';

// // Load environment variables
// dotenv.config();

// // const supabaseUrl = process.env['VITE_SUPABASE_URL'];
// // const supabaseAnonKey = process.env['VITE_SUPABASE_ANON_KEY'];

// const supabaseUrl = ''
// const supabaseAnonKey = '';

// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error('Supabase URL and Anon Key must be provided');
// }

// const supabase = createClient(supabaseUrl, supabaseAnonKey);

// export default defineEventHandler(async (event) => {
//   const url = event.node.req.url;
  
//   // List of routes that require authentication
//   const protectedRoutes = ['/domains', '/settings']; 
  
//   if (protectedRoutes.some(route => url?.startsWith(route))) {
//     const token = event.node.req.headers['authorization']?.split('Bearer ')[1];

//     if (!token) {
//       return sendRedirect(event, '/login', 302);
//     }

//     try {
//       const { data, error } = await supabase.auth.getUser(token);
//       if (error || !data.user) {
//         throw error || new Error('User not found');
//       }
//     } catch (error) {
//       console.error('Authentication error:', error);
//       return sendRedirect(event, '/login', 302);
//     }
//   }
// });
