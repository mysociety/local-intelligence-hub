import { redirect } from "next/navigation";
import { gql } from "@apollo/client";

import { getClient } from "@/services/apollo-client";

const USER_QUERY = gql`
  query Me {
    me {
      id
      username
    }
  }
`;

interface User {
  id: string;
  username: string;
}

export const useAuth = async (): Promise<User> => {
  const client = getClient();

  let data = null;
  try {
    const response = await client.query({ query: USER_QUERY });
    data = response.data;
  } catch (e: any) {
    console.error(e.message);
  }

  return data?.me;
};

export const useRequireAuth = async () => {
  const user = await useAuth();

  // If there's no user and the current path is not "/login", redirect to the login page.
  if (!user) {
    redirect("/login");
  }

  return user;
};

export const useRequireNoAuth = async () => {
  const user = await useAuth();

  if (user) {
    redirect("/account");
  }

  return user;
}
