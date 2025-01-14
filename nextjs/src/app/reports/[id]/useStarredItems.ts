import { StarredState } from '@/lib/map'
import { useApolloClient } from '@apollo/client'
import { useReport } from './(components)/ReportProvider'

const useStarredItems = () => {
  const { updateReport, report, refreshReportData } = useReport()
  const client = useApolloClient()

  // Helper function to clean starred item data

  function addStarredItem(starredItemData: StarredState) {
    const existingStarred = report.displayOptions.starred || []

    // Check if item already exists (prevent duplicates)
    if (existingStarred.find((item) => item.id === starredItemData.id)) return

    // Only send the necessary fields for the mutation
    const updatePayload = {
      id: report.id,
      displayOptions: {
        ...report.displayOptions,
        starred: [...existingStarred, starredItemData],
      },
    }

    updateReport(updatePayload)
  }

  function removeStarredItem(itemId: string) {
    const existingStarred = report.displayOptions.starred || []

    const filteredStarred = existingStarred.filter((item) => item.id !== itemId)

    const updatePayload = {
      id: report.id,
      displayOptions: report.displayOptions, // Include all existing display options
    }
    // Update the starred items in the payload
    updatePayload.displayOptions.starred = filteredStarred

    updateReport(updatePayload)
  }

  const clearAllStarredItems = () => {
    const updatePayload = {
      displayOptions: {
        ...report.displayOptions,
        starred: [],
      },
    }
    updateReport(updatePayload)
  }

  return {
    addStarredItem,
    removeStarredItem,
    clearAllStarredItems,
    starredItems: report.displayOptions.starred || [],
  }
}
export default useStarredItems
