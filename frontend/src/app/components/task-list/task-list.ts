import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { TaskService, Task } from '../../services/task';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatListModule, MatCheckboxModule,
    MatInputModule, MatButtonModule, MatIconModule, 
    MatProgressSpinnerModule, MatCardModule
  ],
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.css']
})
export class TaskList implements OnInit {
  tasks: Task[] = [];
  loading = false;
  error = '';
  newTitle = '';
  newDescription = '';
  editMode: { [key: number]: boolean } = {};
  editTitle: { [key: number]: string } = {};
  editDescription: { [key: number]: string } = {};

  constructor(
    private taskService: TaskService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getTasks().subscribe({
      next: (res) => {
        this.tasks = res.data || [];
        this.loading = false;
        this.cdr.detectChanges(); // Force UI refresh
      },
      error: (err) => {
        this.error = 'Failed to load tasks';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getDescriptionText(desc: any): string {
    if (!desc || !Array.isArray(desc)) return '';
    return desc.map((b: any) => b.children?.map((c: any) => c.text || '').join('') || '').join(' ').trim();
  }

  addTask(): void {
    if (!this.newTitle.trim()) return;
    this.loading = true;
    this.taskService.addTask(this.newTitle, this.newDescription).subscribe({
      next: () => {
        this.newTitle = '';
        this.newDescription = '';
        this.loadTasks();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  toggleComplete(task: Task): void {
    this.taskService.updateTask(task.documentId, { completed: !task.completed }).subscribe({
      next: () => this.loadTasks()
    });
  }

  deleteTask(task: Task): void {
    if (!confirm(`Delete "${task.title}"?`)) return;
    this.loading = true;
    this.taskService.deleteTask(task.documentId).subscribe({
      next: () => this.loadTasks(),
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  startEdit(task: Task): void {
    this.editMode[task.id] = true;
    this.editTitle[task.id] = task.title;
    this.editDescription[task.id] = this.getDescriptionText(task.description);
  }

  saveEdit(task: Task): void {
    this.loading = true;
    this.taskService.updateTask(task.documentId, {
      title: this.editTitle[task.id],
      description: this.editDescription[task.id]
    }).subscribe({
      next: () => {
        delete this.editMode[task.id];
        this.loadTasks();
      }
    });
  }

  cancelEdit(taskId: number): void { delete this.editMode[taskId]; }
  trackById(index: number, task: Task): string { return task.documentId; }
}