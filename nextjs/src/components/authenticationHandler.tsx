'use client';

import { useEffect } from 'react';

interface DoLoginProps {
  token: string;
}

export const DoLogin = ({ token }: DoLoginProps) => {
  useEffect(() => {
    if (token) {
      localStorage.setItem('jwt', token);
      window.location.href = '/account';
    }
  }, [token]);

  return null;
};

export const DoLogOut = () => {
  localStorage.removeItem('jwt');
  window.location.href = '/';
};

export const useRequireAuth = () => {
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    const path = window.location.pathname;
    
    // If the token exists and the current path is "/login", redirect to the account page.
    if (token && path === '/login') {
      window.location.href = '/account';
      return;
    }
    
    // If there's no token and the current path is not "/login", redirect to the login page.
    if (!token && path !== '/login') {
      window.location.href = '/login';
    }
    
  }, []);
};