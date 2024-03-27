import { getSourceOptionForTypename } from "@/lib/data";

export function SharedDataSource ({
  externalDataSource
}: {
  externalDataSource: {
    name: string
    id: string
    crmType: string
    organisation: {
      name: string
    }
  }
}) {
  const Logo = getSourceOptionForTypename(
    externalDataSource.crmType,
  )!.logo;

  return (
    <article className="rounded-xl border border-meepGray-600 px-6 py-5 space-y-3">
      <header className="flex flex-row justify-between items-start">
        <div className='space-y-3'>
          <Logo className='w-20'/>
          <h3 className="text-hSm">
            {externalDataSource.name}
          </h3>
        </div>
      </header>
      <div className='text-sm text-meepGray-400'>
        Shared by {externalDataSource.organisation.name}
      </div>
    </article>
  )
}