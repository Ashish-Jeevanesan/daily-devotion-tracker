import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for the auth state to be loaded
  await firstValueFrom(toObservable(authService.currentUser).pipe(filter(user => user !== undefined)));

  const user = authService.currentUser();

  if (user) {
    return true;
  }

  // Redirect to the login page if not authenticated.
  return router.parseUrl('/login');
};
