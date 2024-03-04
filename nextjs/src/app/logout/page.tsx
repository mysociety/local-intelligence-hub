'use client';

import { useState } from 'react';
import { DoLogOut, useRequireAuth } from '../../components/authenticationHandler';

export default function Logout() {
  const [token, setToken] = useState(null);

  useRequireAuth(); 

  const handleLogout = () => {
    DoLogOut();
    setToken(null);
  };

  return (
    <>
      <h1>Logout from Mapped</h1>
      <button onClick={handleLogout}>Logout</button>
    </>
  );
}