import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { ACCESS_CODES } from '../services/access-codes';
import { AccessService } from '../services/access.service';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const accessService = inject(AccessService);
  const authService = inject(AuthService);
  const router = inject(Router);

  await firstValueFrom(
    toObservable(authService.currentUser).pipe(filter(user => user !== undefined))
  );

  const user = authService.currentUser();
  if (!user) {
    return router.parseUrl('/login');
  }

  const canViewAdminReports = await accessService.hasAccess(ACCESS_CODES.ADMIN_REPORTS, true);
  if (canViewAdminReports) {
    return true;
  }

  return router.parseUrl('/home');
};
