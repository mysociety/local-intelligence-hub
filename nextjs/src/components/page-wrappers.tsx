export function AppPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="p-4 sm:p-8 md:p-20 relative 2xl:p-24 overflow-x-hidden overflow-y-auto">
        {children}
    </main>
  );
}

export function MarketingPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="p-4 sm:p-8 md:p-20 relative 2xl:p-24">
        {children}
    </main>
  );
}