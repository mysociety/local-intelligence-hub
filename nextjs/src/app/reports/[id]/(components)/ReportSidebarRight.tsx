import { Sidebar, SidebarProvider } from '@/components/ui/sidebar'
import { useExplorerState } from '@/lib/map'
import { NAVBAR_HEIGHT } from './ReportNavbar'
import { AreaExplorer } from './explorer/AreaExplorer'
import { RecordExplorer } from './explorer/RecordExplorer'

export function ReportSidebarRight() {
  const [explorer, setExplorer] = useExplorerState()

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '360px',
        } as React.CSSProperties
      }
      open={!!explorer.entity && !!explorer.id && !!explorer.showExplorer}
    >
      <Sidebar
        style={{
          top: NAVBAR_HEIGHT + 'px',
        }}
        className="border border-r-meepGray-800"
        side="right"
      >
        {!!explorer.id ? (
          explorer.entity === 'area' ? (
            <AreaExplorer gss={explorer.id} />
          ) : (
            <RecordExplorer id={explorer.id} />
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
