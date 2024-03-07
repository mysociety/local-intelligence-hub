'use client';

import { useQuery } from '@apollo/client';
import { useRequireAuth } from '../../components/authenticationHandler';
import { gql } from '../../__generated__';
import { UserInfoQuery } from '../../__generated__/graphql';

const USER_QUERY = gql`
  query UserInfo {
    me {
      firstName
      lastName
    }
  }
`

export default function Account() {
  const loading = useRequireAuth();
  const user = useQuery<UserInfoQuery>(USER_QUERY);

  if (loading) {
    return <h2>Loading...</h2>
  }

  return (
    <>
      <h1>Welcome {user.data?.me.firstName}</h1>
    </>
  );
}