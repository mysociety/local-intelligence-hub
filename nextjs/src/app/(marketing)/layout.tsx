import SignUp from "@/components/marketing/SignUp";
import { AreaPattern } from "@/components/areaPattern";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import PreFooter from "@/components/pre-footer";
import { useAuth } from "@/hooks/auth";
import { Toaster } from "sonner";
import FeedbackBanner from "@/components/marketing/FeedbackBanner";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await useAuth();
  const isLoggedIn = Boolean(user);

  return (
    <div className='flex flex-col min-h-dvh'>
      <AreaPattern />
      <main className="p-4 relative">
      <FeedbackBanner/>
      <Navbar isLoggedIn={isLoggedIn} />
        {children}
      </main>
      <Toaster />
      <div className='flex flex-col gap-4 mt-auto mx-4'>
        {!isLoggedIn && <SignUp />}
        <PreFooter />
        <Footer />
      </div>
    </div>
  );
}