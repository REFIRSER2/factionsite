
import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const HomePage = lazy(() => import('../pages/home/page'));
const LoginPage = lazy(() => import('../pages/login/page'));
const LoadingPage = lazy(() => import('../pages/loading/page'));
const DashboardPage = lazy(() => import('../pages/dashboard/page'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));
const AccountManagerPage = lazy(() => import('../pages/admin/page'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <LoginPage />
  },
  {
    path: '/loading',
    element: <LoadingPage />
  },
  {
    path: '/dashboard',
    element: <DashboardPage />
  },
  {
    path: '/admin/accounts',
    element: <AccountManagerPage />
  },
  {
    path: '/home',
    element: <HomePage />
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
];

export default routes;
