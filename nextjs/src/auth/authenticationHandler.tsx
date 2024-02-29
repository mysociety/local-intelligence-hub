import { useEffect } from 'react';


interface DoLoginProps {
  token: string; 
}



export const DoLogin = ({ token }: DoLoginProps)  => {
  useEffect(() => {
    if (token) {
      localStorage.setItem('jwt', token);
      window.location.href = '/account'; 
    }
  }, [token]);

  return null; 
};

export const DoLogOut = ()  => {
  useEffect(() => {
    
      localStorage.removeItem('jwt');
      window.location.href = '/'; 
    }
  )};

