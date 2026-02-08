import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app';
import { authInterceptor } from './app/interceptors/auth-interceptor';
import { routes } from './app/app.routes'; // ← import here

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    provideRouter(routes)
  ]
})
  .catch(err => console.error('Bootstrap error:', err));