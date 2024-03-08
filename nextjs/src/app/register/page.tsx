import { useRequireNoAuth } from "../../hooks/auth";
import RegisterForm from "./register-form";

export default async function Register() {
  await useRequireNoAuth();

  return <RegisterForm />;
}
