import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { TaskList } from './components/task-list/task-list';
import { authGuard } from './guards/auth-guard';
export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: '', component: TaskList, canActivate: [authGuard] }, // protected
  { path: '**', redirectTo: 'login' } // fallback
];