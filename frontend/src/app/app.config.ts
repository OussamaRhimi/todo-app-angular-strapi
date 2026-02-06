// src/app/app.config.ts  (create this file if not present)
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';  // ← add this
import { provideAnimations } from '@angular/platform-browser/animations';  // ← add this for animations

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),   // ← enables HttpClient everywhere
    provideAnimations(),   // ← enables animations
    // provideRouter(routes),  // if you add routing later
    // other providers...
  ]
};
