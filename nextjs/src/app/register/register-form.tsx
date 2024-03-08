"use client";

import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { login } from "../../actions/auth";

const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $password1: String!, $password2: String!, $username: String!) {
    register(email: $email, password1: $password1, password2: $password2, username: $username) {
      errors
      success
    }
  }
`;

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");

  const [doRegister, { data, loading, error: gqlError }] =
    useMutation(REGISTER_MUTATION);

  const authError = data?.register?.errors;
  const success = data?.register?.success;

  const errors = [];
  if (gqlError) {
    errors.push("Register request failed");
  }
  if (authError) {
    for (const field of Object.keys(authError)) {
      const fieldErrors = authError[field]
      for (const error of fieldErrors) {
        errors.push(error.message);
      }
    }
  }

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    doRegister({ variables: { username, password1, password2, email } });
  };

  if (success) {
    return (
      <>
        <h2>Thanks for registering!</h2>
        <p>
          One last step: we{"'"}ve emailed you an activation link at the email address you provided.
        </p>
        <p>
          Once you click that link, you can log in and start using Mapped!
        </p>
      </>
    )
  }

  return (
    <form className="pb-4 flex flex-col gap-4" onSubmit={handleSubmit}>
      <div>
        <label className="mr-2" htmlFor="username">
          Username
        </label>
        <input
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          id="username"
          type="text"
          placeholder="Your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label className="mr-2" htmlFor="email">
          Email address
        </label>
        <input
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          id="email"
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="mr-2" htmlFor="password1">
          Password
        </label>
        <input
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Your password"
          id="password1"
          type="password"
          value={password1}
          onChange={(e) => setPassword1(e.target.value)}
        />
      </div>
      <div>
        <label className="mr-2" htmlFor="password2">
          Confirm password
        </label>
        <input
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Your password"
          id="password2"
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
        />
      </div>
      <button
        className="bg-gray-500 text-white font-bold py-2 px-4 rounded"
        type="submit"
        disabled={loading}
      >
        Login
      </button>
      {errors.length ? (
        <ul>
          {errors.map(e => <li key={e}><small className="text-red-500">{e}</small></li>)}
        </ul>
      ) : null}
    </form>
  );
}
