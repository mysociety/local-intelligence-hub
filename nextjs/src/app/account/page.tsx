'use client';

import { useRequireAuth } from '../../components/authenticationHandler';

export default function Account() {
  useRequireAuth();

  return (
    <>
      <h1>Welcome to your Mapped Account</h1>
    </>
  );
}