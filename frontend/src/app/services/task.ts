import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface StrapiListResponse<T> {
  data: T[];
  meta: { pagination: any };
}

export interface Task {
  id: number;
  documentId: string;
  title: string;
  description: any;
  completed: boolean;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = '/api/tasks'; // relative path → goes through proxy

  constructor(private http: HttpClient) {}

  getTasks(): Observable<StrapiListResponse<Task>> {
    return this.http.get<StrapiListResponse<Task>>(this.apiUrl).pipe(
      catchError(err => {
        if (err.status === 401 || err.status === 403) {
          // Optionally trigger logout or redirect in auth guard
          console.warn('Auth error in getTasks – user may be logged out');
        }
        return throwError(() => err);
      })
    );
  }

  private toRichText(text: string): any[] {
    if (!text?.trim()) return [];
    return [{ type: 'paragraph', children: [{ type: 'text', text }] }];
  }

  addTask(title: string, description: string = ''): Observable<any> {
    const payload = {
      data: {
        title,
        description: this.toRichText(description),
        completed: false
      }
    };
    return this.http.post(this.apiUrl, payload);
  }

  updateTask(documentId: string, updates: Partial<Task>): Observable<any> {
    const payload = { data: { ...updates } };

    if (updates.description !== undefined) {
      payload.data.description = this.toRichText(updates.description as string);
    }

    return this.http.put(`${this.apiUrl}/${documentId}`, payload);
  }

  deleteTask(documentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${documentId}`);
  }
}