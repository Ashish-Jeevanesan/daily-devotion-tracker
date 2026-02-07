import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';

export const adminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const profileService = inject(ProfileService);
  const router = inject(Router);

  await firstValueFrom(
    toObservable(authService.currentUser).pipe(filter(user => user !== undefined))
  );

  const user = authService.currentUser();
  if (!user) {
    return router.parseUrl('/login');
  }

  const profile = await profileService.getProfile();
  if (profile?.role === 'admin') {
    return true;
  }

  return router.parseUrl('/home');
};
