import { useRequireNoAuth } from "../../hooks/auth";
import LoginForm from "./login-form";

// This has been split into a two components to separate the client-side (LoginForm)
// and the server side (this component), which allows using useRequireNoAuth() here
export default async function Login() {
  await useRequireNoAuth();

  return <LoginForm />;
}
