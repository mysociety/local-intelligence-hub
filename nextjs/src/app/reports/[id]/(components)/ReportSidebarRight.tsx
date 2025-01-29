import { Sidebar, SidebarProvider } from '@/components/ui/sidebar'
import { useExplorer } from '@/lib/map/useExplorer'
import { NAVBAR_HEIGHT } from './ReportNavbar'
import { AreaExplorer } from './explorer/AreaExplorer'
import { RecordExplorer } from './explorer/RecordExplorer'

export function ReportSidebarRight() {
  const explorer = useExplorer()

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '360px',
        } as React.CSSProperties
      }
      open={
        explorer.isValidEntity(explorer.state) && explorer.state.showExplorer
      }
    >
      <Sidebar
        style={{
          top: NAVBAR_HEIGHT + 'px',
        }}
        className="border border-r-meepGray-800"
        side="right"
      >
        {explorer.isValidEntity(explorer.state) ? (
          explorer.state.entity === 'area' ? (
            <AreaExplorer gss={explorer.state.id} />
          ) : (
            <RecordExplorer id={explorer.state.id} />
          )
        ) : (
          <div>
            <div className="text-white text-center text-hSm py-4">
              No data to display
            </div>
          </div>
        )}
      </Sidebar>
    </SidebarProvider>
  )
}
