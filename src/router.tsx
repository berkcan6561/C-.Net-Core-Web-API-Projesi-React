import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Rooms } from './pages/Rooms';
import { Customers } from './pages/Customers';
import { Reservations } from './pages/Reservations';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';

import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';

const rootRoute = createRootRoute({});

const LoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

const RegisterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: Register,
});

const VerifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify-email',
  component: VerifyEmail,
});

const ForgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPassword,
});

const ResetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  component: ResetPassword,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: Layout,
  beforeLoad: () => {
    if (!sessionStorage.getItem('token')) {
      throw redirect({ to: '/login' });
    }
  },
});

const indexRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/',
  component: Dashboard,
});

const roomsRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/rooms',
  component: Rooms,
});

const customersRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/customers',
  component: Customers,
});

const reservationsRoute = createRoute({
  getParentRoute: () => authRoute,
  path:'/reservations',
  component: Reservations,
});

const profileRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/profile',
  component: Profile,
});

const routTree = rootRoute.addChildren([
  LoginRoute,
  RegisterRoute,
  VerifyEmailRoute,
  ForgotPasswordRoute,
  ResetPasswordRoute,
  authRoute.addChildren([
    indexRoute,
    roomsRoute,
    customersRoute,
    reservationsRoute,
    profileRoute,
  ]),
]);

export const router = createRouter({
  routeTree: routTree,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}