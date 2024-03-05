'use client';

import { useRequireAuth } from '../../components/authenticationHandler';

export default function Account() {
  const loading = useRequireAuth();

  if (loading) {
    return <h2>Loading...</h2>
  }

  return (
    <>
      <h1>Welcome to your Mapped Account</h1>
    </>
  );
}