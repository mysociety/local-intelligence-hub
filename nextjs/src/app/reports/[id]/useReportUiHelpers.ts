import { useEffect, useState } from 'react'
import { useReport } from './(components)/ReportProvider'

const HELPER_TIMEOUT = 3000

const useReportUiHelpers = () => {
  const { report } = useReport()
  const [userJourneyHelpers, setUserJourneyHelpers] = useState<{
    visualiseYourData: {
      triggered: boolean
      open: boolean
    }
  }>({
    // Triggered tarts off true in case this is an existing report
    visualiseYourData: {
      triggered: true,
      open: false,
    },
  })

  useEffect(() => {
    // Reset the user journey helper if there are no layers
    if (
      report.layers.length === 0 &&
      userJourneyHelpers?.visualiseYourData.triggered
    ) {
      setUserJourneyHelpers({
        ...userJourneyHelpers,
        visualiseYourData: {
          triggered: false,
          open: false,
        },
      })
    }
    // Trigger the user journey helper when the first layer is added
    else if (
      report.layers.length === 1 &&
      !userJourneyHelpers?.visualiseYourData.triggered
    ) {
      setUserJourneyHelpers({
        ...userJourneyHelpers,
        visualiseYourData: {
          triggered: true,
          open: true,
        },
      })
      setTimeout(() => {
        setUserJourneyHelpers({
          visualiseYourData: {
            triggered: true,
            open: false,
          },
        })
      }, HELPER_TIMEOUT)
    }
  }, [report.layers, userJourneyHelpers])

  function updateUserJourneyHelpers(
    key: keyof typeof userJourneyHelpers,
    state: boolean
  ) {
    setUserJourneyHelpers({
      ...userJourneyHelpers,
      [key]: {
        open: state,
        triggered: true,
      },
    })
  }

  return {
    userJourneyHelpers,
    updateUserJourneyHelpers,
  }
}

export default useReportUiHelpers
