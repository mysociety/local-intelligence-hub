// 'use client';

// import { useRequireAuth } from '@/components/authenticationHandler';
// import { AirtableLogo } from '@/components/logos';
// import { Button } from '@/components/ui/button';
// import { twMerge } from 'tailwind-merge';
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { UpdateConfigDict, AirtableSourceInput, CreateAirtableSourceMutation, CreateAirtableSourceMutationVariables } from '@/__generated__/graphql';
// import { Combobox } from '@/components/ui/combobox';
// import { TailSpin } from 'react-loader-spinner'
// import { gql } from '@apollo/client';
// import { client } from '@/components/apollo-client';

// const CREATE_AIRTABLE_SOURCE = gql`
//   mutation CreateAirtableSource($AirtableSource: AirtableSourceInput!) {
//     createAirtableSource(data: $AirtableSource) {
//       id
//       healthcheck
//     }
//   }
// `

// export default function Page() {
//   const authLoading = useRequireAuth();
//   const router = useRouter()

//   type Config = {
//     externalDataSource: keyof typeof externalDataSourceOptions,
//     connectionDetails: {
//       airtable?: CreateAirtableSourceMutationVariables['AirtableSource']
//     },
//     postcodeColumn: string
//     mapping: Array<UpdateConfigDict>
//   }

//   const [step, setStep] = useState(0)
//   const [config, setConfig] = useState<Partial<Config>>({
//     externalDataSource: 'airtable'
//   });

//   function Navigation ({ isValid }: { isValid?: boolean }) {
//     return (
//       <div>
//         {step > 0 && (
//           <Button onClick={() => {
//             setStep(step - 1)
//           }}>Back</Button>
//         )}
//         {step < steps.length - 1 && (
//           <Button disabled={!isValid} variant={'reverse'} onClick={() => {
//             setStep(step + 1)
//           }}>Continue</Button>
//         )}
//       </div>
//     )
//   }

//   const steps = [
//     {
//       title: "Select platform",
//       keys: ["externalDataSource"],
//       page: () => {
//         return (
//           <div>
//             <header>
//               <h1 className='text-hLg'>Select platform to sync data to</h1>
//               <p className='mt-6 text-muted-text max-w-sm'>We currently support the following platforms. If your platform isn’t on this list, <a href='mailto:hello@commonknowledge.coop'>get in touch to see how we can help.</a></p>
//             </header>
//             {Object.values(externalDataSourceOptions).map((externalDataSource) => (
//               <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7'>
//                 <div onClick={() => {
//                   setConfig(config => ({ ...config, externalDataSource: externalDataSource.key as any }))
//                 }} className={twMerge(
//                   'cursor-pointer rounded-3xl bg-background-secondary px-10 py-6 overflow-hidden flex flex-row items-center justify-center transition-all hover:border-brand hover:border-2',
//                   config.externalDataSource === externalDataSource.key && "border-brand border-2"
//                 )}>
//                   <externalDataSource.logo className="w-full" />
//                 </div>
//               </div>
//             ))}
//             <Navigation />
//           </div>
//         )
//       }
//     },
//     {
//       title: "Provide information",
//       keys: ["connectionDetails"],
//       page: () => {
//         return (
//           <div>
//             <header>
//               <h1 className='text-hLg'>Syncing to your Airtable base</h1>
//               <p className='mt-6 text-muted-text max-w-sm'>In order to send data across to your Airtable, we’ll need a few details that gives us permission to make updates to your base, as well as tell us which table to update in the first place. You can find out more about how we do this securely here.</p>
//             </header>
//             {config.externalDataSource === 'airtable' && (
//               <div>
//                 <label>
//                   <div>
//                     <h3>Personal Access Token / API Key</h3>
//                   </div>
//                   <input type="apiKey" className="form-input px-4 py-3 rounded-full" />
//                   <p className='text-sm'>Make sure your token has read and write permissions for table data, table schema and webhooks. <a href='https://support.airtable.com/docs/creating-personal-access-tokens#:~:text=Click%20the%20Developer%20hub%20option,right%20portion%20of%20the%20screen.'>Learn how to find your personal access token.</a></p>
//                 </label>
//                 <label>
//                   <div>
//                     <h3>Base ID</h3>
//                   </div>
//                   <input type="baseId" className="form-input px-4 py-3 rounded-full" />
//                   <p className='text-sm'>The unique identifier for your base. <a href='https://support.airtable.com/docs/en/finding-airtable-ids#:~:text=Finding%20base%20URL%20IDs,-Base%20URLs'>Learn how to find your base ID.</a></p>
//                 </label>
//                 <label>
//                   <div>
//                     <h3>Table ID</h3>
//                   </div>
//                   <input type="tableId" className="form-input px-4 py-3 rounded-full" />
//                   <p className='text-sm'>The unique identifier for your table. <a href='https://support.airtable.com/docs/en/finding-airtable-ids#:~:text=Finding%20base%20URL%20IDs,-Base%20URLs'>Learn how to find your table ID.</a></p>
//                 </label>
//               </div>
//             )}
//             <Navigation />
//           </div>
//         )
//       }
//     },
//     {
//       title: "Test connection",
//       page: () => {
//         if (config.connectionDetails?.airtable) {
//           const createAirtableSource = client.mutate<CreateAirtableSourceMutation, CreateAirtableSourceMutationVariables>({
//             mutation: CREATE_AIRTABLE_SOURCE,
//             variables: {
//               AirtableSource: config.connectionDetails.airtable
//             }
//           })
//         }
        
//         return (
//           <div>
//             <header>
//               <h1 className='text-hLg'>Verify connection</h1>
//               <p className='mt-6 text-muted-text max-w-sm'>Please wait whilst we try to connect to your CRM using the information you provided.</p>
//             </header>
//             <TailSpin
//               visible={true}
//               height="60"
//               width="60"
//               color="#444"
//               ariaLabel="tail-spin-loading"
//               radius="5"
//               wrapperStyle={{}}
//               wrapperClass=""
//             />
//           </div>
//         )
//       }
//     },
//     {
//       title: "Postcode",
//       keys: ["postcodeColumn"],
//       page: () => {
//         return (
//           <div>
//             <header>
//               <h1 className='text-hLg'>Now specify the postcode field</h1>
//               <p className='mt-6 text-muted-text max-w-sm'>We use the postcode to match your records to the correct constituency and other geographic data.</p>
//             </header>
//             <label>
//               <div>
//                 <h3>Postcode column</h3>
//               </div>
//               <input type="postcodeColumn" className="form-input px-4 py-3 rounded-full" />
//             </label>
//             <Navigation />
//           </div>
//         )
//       }
//     },
//     {
//       title: "Select data layers",
//       keys: ["mapping"],
//       page: () => {
//         // A UI which lists available data sources, their fields, and allows the user to map them to the fields in the CRM
//         return (
//           <div>
//             <header>
//               <h1 className='text-hLg'>Select data layers to sync</h1>
//               <p className='mt-6 text-muted-text max-w-sm'>We use the postcode to match your records to the correct constituency and other geographic data.</p>
//             </header>
//             <div>
//               {config.mapping?.map((mapping, i) => (
//                 <div key={i}>
//                   <SourceDropdown value={mapping.source} onChange={source => {

//                   }} />
//                   <input type="text" value={mapping.sourcePath} />
//                   <input type="text" value={mapping.destinationColumn} />
//                   <Button onClick={() => {

//                   }}>Delete</Button>
//                 </div>
//               ))}
//               <Button onClick={() => {

//               }}>
//                 Add a row
//               </Button>
//             </div>
//             <Navigation />
//           </div>
//         )
//       }
//     },
//     {
//       title: "Activate sync",
//       page: () => {
//         return (
//           <div>
//             <header>
//               <h1 className='text-hLg'>Activate data sync</h1>
//               <p className='mt-6 text-muted-text max-w-sm'>Your almost there! Active the data sync to start syncing data. Note, this may take a while if you are using a large amount of data layers.</p>
//             </header>
//             {/* TODO: Put the card here */}
//             {/* TODO: Trigger Manual Sync option */}
//             <Button variant='reverse' onClick={() => {
//               router.push('/external-data-source-updates')
//             }}>Back to CRM Data Syncs</Button>
//           </div>
//         )
//       }
//     }
//   ]

//   if (authLoading) {
//     return <h2>Loading...</h2>
//   }

//   const Page = steps[step].page!

//   return (
//     <div className='p-6 max-w-6xl mx-auto flex flex-row gap-7'>
//       <aside className='w-[180px]'>
//         {steps.slice(0, step).map((step, i) => (
//           <div key={i} className='flex flex-row items-center gap-2'>
//             <span>{i + 1}</span>
//             <span>{step.title}</span>
//           </div>
//         ))}
//       </aside>
//       <main className='space-y-7'>
//         <Page />
//         {/* {step > 0 && (
//           <Button onClick={() => {
//             setStep(step - 1)
//           }}>Back</Button>
//         )}
//         {step < steps.length - 1 && (
//           <Button variant={'reverse'} onClick={() => {
//             setStep(step + 1)
//           }}>Continue</Button>
//         )} */}
//       </main>
//     </div>
//   );
// }