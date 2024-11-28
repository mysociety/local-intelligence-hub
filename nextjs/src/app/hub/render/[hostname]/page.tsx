import { GetPageQuery, GetPageQueryVariables } from '@/__generated__/graphql'
import { Params } from '@/app/hub/render/[hostname]/params'
import { GET_PAGE } from '@/app/hub/render/[hostname]/query'
import { getClient } from '@/services/apollo-client'
import RenderPuck from './RenderPuck'

export default async function Page({
  params: { hostname, slug },
}: {
  params: Params
}) {
  const client = getClient()
  const page = await client.query<GetPageQuery, GetPageQueryVariables>({
    query: GET_PAGE,
    variables: {
      hostname,
      path: slug,
    },
  })

  const puckJsonContent = page.data?.hubPageByPath?.puckJsonContent

  // // TODO: display 404 in this case
  // if (!puckJsonContent) {
  //   return redirect('/')
  // }

  return (
    <RenderPuck
      hostname={hostname}
      page={page.data.hubPageByPath?.puckJsonContent}
    />
  )
}
