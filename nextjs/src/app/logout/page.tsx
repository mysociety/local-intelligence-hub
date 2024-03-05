'use client';

import { useRequireAuth } from '../../components/authenticationHandler';

export default function Logout() {
  useRequireAuth(); 

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    window.location.href = '/';
  };

  return (
    <>
      <h1 className="pb-4">Logout from Mapped</h1>
      <button className="bg-gray-500 text-white font-bold py-2 px-4 rounded" onClick={handleLogout}>Logout</button>
    </>
  );
}