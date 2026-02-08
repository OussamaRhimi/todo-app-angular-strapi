import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // ← Add withInterceptors
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './interceptors/auth-interceptor'; // ← Import your interceptor file

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor]) // ← THIS IS CRITICAL
    ),
    provideAnimations(),
  ]
};