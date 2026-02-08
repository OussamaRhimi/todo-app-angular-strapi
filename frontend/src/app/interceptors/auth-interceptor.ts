import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Debug: log whether a token is present and which requests get the header
  try {
    // avoid logging the full token to not leak secrets in logs
    console.log('[Auth Interceptor] Outgoing request', req.method, req.url, 'token?', !!token);
  } catch (e) {}

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};