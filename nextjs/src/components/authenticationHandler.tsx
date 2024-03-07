'use client';

import { UserTestQuery } from '@/__generated__/graphql';
import { gql, useQuery } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';

const USER_TEST_QUERY = gql`
  query UserTest {
    me {
      id
    }
  }
`

export const useRequireAuth = () => {
  const userTestQuery = useQuery<UserTestQuery>(USER_TEST_QUERY);

  const isLoggedIn = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('jwt');
    return !!token && !!userTestQuery.data?.me.id;
  }, [userTestQuery.data?.me.id])

  // Set "loading" state that can be used by components to display a loading
  // placeholder while the auth state is being determined
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    const path = window.location.pathname;

    let willRedirect = false;
    if (isLoggedIn) {
      // If the token exists and the current path is "/login", redirect to the account page.
      if (token && path === '/login') {
        window.location.href = '/account';
        willRedirect = true;
      }
      
      // // If there's no token and the current path is not "/login", redirect to the login page.
      if (!token && path !== '/login') {
        window.location.href = '/login';
        willRedirect = true;
      }
    }

    // Only set loading to false if no redirect is happening. This is because if the
    // user should be redirected, they should only ever see the loading indicator.
    // They should never see the actual page (which can happen if loading is set
    // to false and the redirect takes a few milliseconds to happen).
    if (!willRedirect) {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Return the loading state so pages/components can use it.
  return loading;
};