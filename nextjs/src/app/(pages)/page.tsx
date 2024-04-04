import { useAuth } from "@/hooks/auth";
import Dashboard from "./Dashboard";
import MarketingHome from "./MarketingHome";

export default async function Home() {
  const user = await useAuth();
  const isLoggedIn = Boolean(user);

  return (
    <div className="">
      {isLoggedIn ? (
        <Dashboard user={user} />
      ) : (
        <MarketingHome />
      )}
    </div>
  );
}
