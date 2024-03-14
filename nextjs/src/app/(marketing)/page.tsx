import { buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/hooks/auth";
import Link from 'next/link';

export default async function Home() {
  const user = await useAuth();
  const isLoggedIn = Boolean(user);

  return (
    <div className='p-8'>
      {isLoggedIn ? (
        <div>
          <h1 className="text-hXlg tracking-[-1.47px] font-light font-IBMPlexSans w-[915px] mb-12">
    Welcome back, <span className="font-PPRightGrotesk font-bold text-[84.468px] tracking-normal">{user?.username}</span>! ✊</h1>
          <div className='grid grid-cols-2 gap-16'>
            <Link href="/reports" className={buttonVariants({ variant: "brand" })}>
              Your reports
            </Link>
            <Link href="/data-sources" className={buttonVariants({ variant: "brand" })}>
              Your data sources
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-hXlg tracking-[-1.47px] font-light font-IBMPlexSans w-[915px] mb-6">
          Empowering <span className="font-PPRightGrotesk font-bold text-[84.468px] tracking-normal">organisers</span> and <span className="font-PPRightGrotesk font-bold text-[84.468px] tracking-normal">activists</span> with mapping tools and data enrichment ✊</h1>
          <p className="text-base w-[582px] mb-9">Take your organising to the next level with our free to use tools that enhance your existing membership lists with geographic and political data. </p>
          <Link href="/signup" className={buttonVariants({ variant: "brand" })}>Get started</Link>
        </div>
      )}
    </div>
  );
}
