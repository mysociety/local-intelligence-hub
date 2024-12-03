import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import LayersCard from './LayersCard'

export function ReportSidebarLeft() {
  return (
    <Sidebar className="bg-meepGray-800 top-[48px]">
      <SidebarContent className="bg-meepGray-800">
        <LayersCard />
      </SidebarContent>
    </Sidebar>
  )
}
