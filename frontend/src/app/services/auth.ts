import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: number;
  username: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api'; // relative → uses Nginx proxy in Docker
  private tokenKey = 'auth_token';
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/local/register`, {
      username,
      email,
      password
    }).pipe(
      tap((res: any) => this.handleLogin(res.jwt, res.user)),
      catchError(err => this.handleAuthError(err))
    );
  }

  login(identifier: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/local`, {
      identifier,
      password
    }).pipe(
      tap((res: any) => this.handleLogin(res.jwt, res.user)),
      catchError(err => this.handleAuthError(err))
    );
  }

  private handleAuthError(error: HttpErrorResponse) {
    console.error('Auth error:', error);
    return throwError(() => error);
  }

  private handleLogin(token: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    this.userSubject.next(user);
    this.router.navigate(['/']);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me`).pipe(
      tap(user => this.userSubject.next(user))
    );
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
