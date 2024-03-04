'use client'

import { useState } from 'react';
import { gql } from '@apollo/client';
import { client } from '../../components/apollo-client';
import { DoLogin } from '../../components/authenticationHandler'
import { useRequireAuth } from '../../components/authenticationHandler';


const LoginMutation = gql`
mutation Login($username: String!, $password: String!) {
  tokenAuth(username: $username, password: $password) {
    errors
    success
    token {
      token
    }
  }
}
`;

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);

  const handleSubmit = async (event: { preventDefault: () => void; }) => {
    event.preventDefault();

    try {
      const { data } = await client.mutate({
        mutation: LoginMutation,
        variables: { username, password },
      });

      const token = data?.tokenAuth?.token?.token;
      if (token) {
        setToken(token);
      } else {
        console.error('Login failed: ', data?.tokenAuth?.errors);
      }
    } catch (error) {
      console.error('Login error: ', error);
    }
  };
  useRequireAuth();

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {token && <DoLogin token={token} />}
    </>
  );
}
