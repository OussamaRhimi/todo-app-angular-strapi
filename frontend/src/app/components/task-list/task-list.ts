import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { TaskService, Task } from '../../services/task';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCardModule,
  ],
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.css'],
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

  get completedCount(): number {
    return this.tasks.reduce((count, task) => count + (task.completed ? 1 : 0), 0);
  }

  get remainingCount(): number {
    return Math.max(0, this.tasks.length - this.completedCount);
  }

  get completionPercent(): number {
    if (this.tasks.length === 0) return 0;
    return Math.round((this.completedCount / this.tasks.length) * 100);
  }

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      console.log('User not authenticated -> skipping task load');
      return;
    }
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.error = '';

    this.taskService.getTasks().subscribe({
      next: (res) => {
        this.tasks = res.data ?? [];
        this.loading = false;
        this.detectChangesSafely();
      },
      error: (err) => {
        this.loading = false;

        if (err?.status === 401 || err?.status === 403) {
          this.authService.logout();
          return;
        }

        this.error = 'Failed to load tasks. Please try again.';
        this.detectChangesSafely();
      },
    });
  }

  getDescriptionText(desc: any): string {
    if (!desc || !Array.isArray(desc)) return '';
    return desc
      .map((block: any) => block.children?.map((child: any) => child.text || '').join('') || '')
      .join('\n')
      .trim();
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
      error: () => {
        this.error = 'Failed to add task';
        this.loading = false;
        this.detectChangesSafely();
      },
    });
  }

  toggleComplete(task: Task): void {
    this.taskService.updateTask(task.documentId, { completed: !task.completed }).subscribe({
      next: () => this.loadTasks(),
      error: () => {
        this.error = 'Failed to update task';
        this.detectChangesSafely();
      },
    });
  }

  startEdit(task: Task): void {
    this.editMode[task.id] = true;
    this.editTitle[task.id] = task.title;
    this.editDescription[task.id] = this.getDescriptionText(task.description);
  }

  saveEdit(task: Task): void {
    const newTitle = this.editTitle[task.id]?.trim();
    if (!newTitle) return;

    this.taskService
      .updateTask(task.documentId, {
        title: newTitle,
        description: this.editDescription[task.id] || '',
      })
      .subscribe({
        next: () => {
          this.loadTasks();
          delete this.editMode[task.id];
        },
        error: () => {
          this.error = 'Failed to save changes';
          this.detectChangesSafely();
        },
      });
  }

  cancelEdit(taskId: number): void {
    delete this.editMode[taskId];
    this.loadTasks();
  }

  deleteTask(task: Task): void {
    if (!confirm(`Delete "${task.title}"?`)) return;

    this.taskService.deleteTask(task.documentId).subscribe({
      next: () => this.loadTasks(),
      error: () => {
        this.error = 'Failed to delete task';
        this.detectChangesSafely();
      },
    });
  }

  trackById(index: number, task: Task): string {
    return task.documentId;
  }

  logout(): void {
    this.authService.logout();
  }

  private detectChangesSafely(): void {
    try {
      this.cdr.detectChanges();
    } catch {}
  }
}
