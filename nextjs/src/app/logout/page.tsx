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
      <h1 className="pb-4">Logout from Mapped</h1>
      <button className="bg-gray-500 text-white font-bold py-2 px-4 rounded" onClick={handleLogout}>Logout</button>
    </>
  );
}