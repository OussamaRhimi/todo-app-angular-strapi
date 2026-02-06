import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = '/api/tasks';
  constructor(private http: HttpClient) {}

  getTasks(): Observable<StrapiListResponse<Task>> {
    return this.http.get<StrapiListResponse<Task>>(this.apiUrl);
  }

  private toRichText(text: string): any[] {
    if (!text.trim()) return [];
    return [{ type: 'paragraph', children: [{ type: 'text', text }] }];
  }

  addTask(title: string, description: string = ''): Observable<any> {
    const payload = {
      data: { title, description: this.toRichText(description), completed: false }
    };
    return this.http.post(this.apiUrl, payload);
  }

  updateTask(documentId: string, updates: any): Observable<any> {
    if (updates.description !== undefined) {
      updates = { ...updates, description: this.toRichText(updates.description) };
    }
    return this.http.put(`${this.apiUrl}/${documentId}`, { data: updates });
  }

  deleteTask(documentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${documentId}`);
  }
}