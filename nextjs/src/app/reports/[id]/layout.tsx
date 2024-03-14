import Navbar from "@/components/navbar";
import { AppPageWrapper } from "@/components/page-wrappers";
import { useAuth } from "@/hooks/auth";
import { Toaster } from "sonner";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await useAuth();
  const isLoggedIn = Boolean(user);

  return (
    <div className='h-dvh flex flex-col'>
      <Navbar isLoggedIn={isLoggedIn} />
      <main className="h-full relative overflow-x-hidden overflow-y-hidden flex-grow">
        {children}
      </main>
      <Toaster />
    </div>
  );
}