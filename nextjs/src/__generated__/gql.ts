/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'
import * as types from './graphql'

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
const documents = {
  '\n  query DeveloperAPIContext {\n    listApiTokens {\n      token\n      signature\n      revoked\n      createdAt\n      expiresAt\n    }\n  }\n':
    types.DeveloperApiContextDocument,
  '\n        mutation CreateToken {\n          createApiToken {\n            token\n            signature\n            revoked\n            createdAt\n            expiresAt\n          }\n        }\n      ':
    types.CreateTokenDocument,
  '\n        mutation RevokeToken($signature: ID!) {\n          revokeApiToken(signature: $signature) {\n            signature\n            revoked\n          }\n        }\n      ':
    types.RevokeTokenDocument,
  '\n  mutation Verify($token: String!) {\n    verifyAccount(token: $token) {\n      errors\n      success\n    }\n  }\n':
    types.VerifyDocument,
  '\n  query Example {\n    myOrganisations {\n      id\n      name\n    }\n  }\n':
    types.ExampleDocument,
  '\n  mutation Login($username: String!, $password: String!) {\n    tokenAuth(username: $username, password: $password) {\n      errors\n      success\n      token {\n        token\n        payload {\n          exp\n        }\n      }\n    }\n  }\n':
    types.LoginDocument,
  '\n  mutation PerformPasswordReset(\n    $token: String!\n    $password1: String!\n    $password2: String!\n  ) {\n    performPasswordReset(\n      token: $token\n      newPassword1: $password1\n      newPassword2: $password2\n    ) {\n      errors\n      success\n    }\n  }\n':
    types.PerformPasswordResetDocument,
  '\n  mutation ResetPassword($email: String!) {\n    requestPasswordReset(email: $email) {\n      errors\n      success\n    }\n  }\n':
    types.ResetPasswordDocument,
  '\n  query ListOrganisations($currentOrganisationId: ID!) {\n    myOrganisations(filters: { id: $currentOrganisationId }) {\n      id\n      externalDataSources {\n        id\n        name\n        dataType\n        connectionDetails {\n          ... on AirtableSource {\n            baseId\n            tableId\n          }\n          ... on MailchimpSource {\n            apiKey\n            listId\n          }\n        }\n        crmType\n        autoImportEnabled\n        autoUpdateEnabled\n        jobs(pagination: { limit: 10 }) {\n          lastEventAt\n          status\n        }\n        updateMapping {\n          source\n          sourcePath\n          destinationColumn\n        }\n        sharingPermissions {\n          id\n          organisation {\n            id\n            name\n          }\n        }\n      }\n      sharingPermissionsFromOtherOrgs {\n        id\n        externalDataSource {\n          id\n          name\n          dataType\n          crmType\n          organisation {\n            name\n          }\n        }\n      }\n    }\n  }\n':
    types.ListOrganisationsDocument,
  '\n  query GetSourceMapping($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      autoImportEnabled\n      autoUpdateEnabled\n      allowUpdates\n      hasWebhooks\n      updateMapping {\n        destinationColumn\n        source\n        sourcePath\n      }\n      fieldDefinitions {\n        label\n        value\n        description\n        editable\n      }\n      crmType\n      geographyColumn\n      geographyColumnType\n      geocodingConfig\n      usesValidGeocodingConfig\n      postcodeField\n      firstNameField\n      lastNameField\n      emailField\n      phoneField\n      addressField\n      canDisplayPointField\n    }\n  }\n':
    types.GetSourceMappingDocument,
  '\n  query TestDataSource($input: CreateExternalDataSourceInput!) {\n    testDataSource(input: $input) {\n      __typename\n      crmType\n      fieldDefinitions {\n        label\n        value\n        description\n        editable\n      }\n      geographyColumn\n      geographyColumnType\n      geocodingConfig\n      usesValidGeocodingConfig\n      healthcheck\n      predefinedColumnNames\n      defaultDataType\n      remoteName\n      allowUpdates\n      defaults\n      oauthCredentials\n    }\n  }\n':
    types.TestDataSourceDocument,
  '\n  query GoogleSheetsOauthUrl($redirectUrl: String!) {\n    googleSheetsOauthUrl(redirectUrl: $redirectUrl)\n  }\n':
    types.GoogleSheetsOauthUrlDocument,
  '\n  query GoogleSheetsOauthCredentials($redirectSuccessUrl: String!) {\n    googleSheetsOauthCredentials(redirectSuccessUrl: $redirectSuccessUrl)\n  }\n':
    types.GoogleSheetsOauthCredentialsDocument,
  '\n  mutation CreateSource($input: CreateExternalDataSourceInput!) {\n    createExternalDataSource(input: $input) {\n      code\n      errors {\n        message\n      }\n      result {\n        id\n        name\n        crmType\n        dataType\n        allowUpdates\n      }\n    }\n  }\n':
    types.CreateSourceDocument,
  '\n  query AutoUpdateCreationReview($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      name\n      geographyColumn\n      geographyColumnType\n      geocodingConfig\n      usesValidGeocodingConfig\n      dataType\n      crmType\n      autoImportEnabled\n      autoUpdateEnabled\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n      jobs(pagination: { limit: 10 }) {\n        lastEventAt\n        status\n      }\n      automatedWebhooks\n      webhookUrl\n      ...DataSourceCard\n    }\n  }\n  \n':
    types.AutoUpdateCreationReviewDocument,
  '\n  query ExternalDataSourceInspectPage($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      name\n      dataType\n      remoteUrl\n      crmType\n      connectionDetails {\n        ... on AirtableSource {\n          apiKey\n          baseId\n          tableId\n        }\n        ... on MailchimpSource {\n          apiKey\n          listId\n        }\n        ... on ActionNetworkSource {\n          apiKey\n          groupSlug\n        }\n        ... on TicketTailorSource {\n          apiKey\n        }\n      }\n      lastImportJob {\n        id\n        lastEventAt\n        status\n      }\n      lastUpdateJob {\n        id\n        lastEventAt\n        status\n      }\n      autoImportEnabled\n      autoUpdateEnabled\n      hasWebhooks\n      allowUpdates\n      automatedWebhooks\n      webhookUrl\n      webhookHealthcheck\n      geographyColumn\n      geographyColumnType\n      geocodingConfig\n      usesValidGeocodingConfig\n      postcodeField\n      firstNameField\n      lastNameField\n      fullNameField\n      emailField\n      phoneField\n      addressField\n      titleField\n      descriptionField\n      imageField\n      startTimeField\n      endTimeField\n      publicUrlField\n      socialUrlField\n      canDisplayPointField\n      isImportScheduled\n      importProgress {\n        id\n        hasForecast\n        status\n        total\n        succeeded\n        estimatedFinishTime\n        actualFinishTime\n        inQueue\n        numberOfJobsAheadInQueue\n        sendEmail\n      }\n      isUpdateScheduled\n      updateProgress {\n        id\n        hasForecast\n        status\n        total\n        succeeded\n        estimatedFinishTime\n        actualFinishTime\n        inQueue\n        numberOfJobsAheadInQueue\n        sendEmail\n      }\n      importedDataCount\n      importedDataGeocodingRate\n      regionCount: importedDataCountOfAreas(\n        analyticalAreaType: european_electoral_region\n      )\n      constituencyCount: importedDataCountOfAreas(\n        analyticalAreaType: parliamentary_constituency\n      )\n      ladCount: importedDataCountOfAreas(analyticalAreaType: admin_district)\n      wardCount: importedDataCountOfAreas(analyticalAreaType: admin_ward)\n      fieldDefinitions {\n        label\n        value\n        description\n        editable\n      }\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n      sharingPermissions {\n        id\n      }\n      organisation {\n        id\n        name\n      }\n    }\n  }\n':
    types.ExternalDataSourceInspectPageDocument,
  '\n  mutation DeleteUpdateConfig($id: String!) {\n    deleteExternalDataSource(data: { id: $id }) {\n      id\n    }\n  }\n':
    types.DeleteUpdateConfigDocument,
  '\n                        mutation DeleteRecords($externalDataSourceId: String!) {\n                          deleteAllRecords(\n                            externalDataSourceId: $externalDataSourceId\n                          ) {\n                            id\n                          }\n                        }\n                      ':
    types.DeleteRecordsDocument,
  '\n      query ManageSourceSharing($externalDataSourceId: ID!) {\n        externalDataSource(pk: $externalDataSourceId) {\n          sharingPermissions {\n            id\n            organisationId\n            organisation {\n              name\n            }\n            externalDataSourceId\n            visibilityRecordCoordinates\n            visibilityRecordDetails\n            deleted\n          }\n        }\n      }\n    ':
    types.ManageSourceSharingDocument,
  '\n          mutation UpdateSourceSharingObject(\n            $data: SharingPermissionCUDInput!\n          ) {\n            updateSharingPermission(data: $data) {\n              id\n              organisationId\n              externalDataSourceId\n              visibilityRecordCoordinates\n              visibilityRecordDetails\n              deleted\n            }\n          }\n        ':
    types.UpdateSourceSharingObjectDocument,
  '\n          mutation DeleteSourceSharingObject($pk: String!) {\n            deleteSharingPermission(data: { id: $pk }) {\n              id\n            }\n          }\n        ':
    types.DeleteSourceSharingObjectDocument,
  '\n      mutation ImportData($id: String!) {\n        importAll(externalDataSourceId: $id) {\n          id\n          externalDataSource {\n            importedDataCount\n            importProgress {\n              status\n              hasForecast\n              id\n              total\n              succeeded\n              failed\n              estimatedFinishTime\n              inQueue\n            }\n          }\n        }\n      }\n    ':
    types.ImportDataDocument,
  '\n      mutation CancelImport($id: String!, $requestId: String!) {\n        cancelImport(externalDataSourceId: $id, requestId: $requestId) {\n          id\n        }\n      }\n    ':
    types.CancelImportDocument,
  '\n  query ExternalDataSourceName($externalDataSourceId: ID!) {\n    externalDataSource(pk: $externalDataSourceId) {\n      name\n      crmType\n      dataType\n      name\n      remoteUrl\n    }\n  }\n':
    types.ExternalDataSourceNameDocument,
  '\n          mutation ShareDataSources(\n            $fromOrgId: String!\n            $permissions: [SharingPermissionInput!]!\n          ) {\n            updateSharingPermissions(\n              fromOrgId: $fromOrgId\n              permissions: $permissions\n            ) {\n              id\n              sharingPermissions {\n                id\n                organisationId\n                externalDataSourceId\n                visibilityRecordCoordinates\n                visibilityRecordDetails\n                deleted\n              }\n            }\n          }\n        ':
    types.ShareDataSourcesDocument,
  '\n  query YourSourcesForSharing {\n    myOrganisations {\n      id\n      name\n      externalDataSources {\n        id\n        name\n        crmType\n        importedDataCount\n        dataType\n        fieldDefinitions {\n          label\n          editable\n        }\n        organisationId\n        sharingPermissions {\n          id\n          organisationId\n          externalDataSourceId\n          visibilityRecordCoordinates\n          visibilityRecordDetails\n          deleted\n        }\n      }\n    }\n  }\n':
    types.YourSourcesForSharingDocument,
  '\n  query ShareWithOrgPage($orgSlug: String!) {\n    allOrganisations(filters: { slug: $orgSlug }) {\n      id\n      name\n    }\n  }\n':
    types.ShareWithOrgPageDocument,
  '\n  mutation CreateMapReport($data: MapReportInput!) {\n    createMapReport(data: $data) {\n      ... on MapReport {\n        id\n      }\n      ... on OperationInfo {\n        messages {\n          message\n        }\n      }\n    }\n  }\n':
    types.CreateMapReportDocument,
  '\n  query ListReports($currentOrganisationId: ID!) {\n    reports(filters: { organisation: { pk: $currentOrganisationId } }) {\n      id\n      name\n      lastUpdate\n    }\n  }\n':
    types.ListReportsDocument,
  '\n  query ListExternalDataSources {\n    myOrganisations {\n      id\n      externalDataSources {\n        id\n      }\n    }\n  }\n':
    types.ListExternalDataSourcesDocument,
  '\n  query GetPublicMapReport($orgSlug: String!, $reportSlug: String!) {\n    publicMapReport(orgSlug: $orgSlug, reportSlug: $reportSlug) {\n      id\n      name\n    }\n  }\n':
    types.GetPublicMapReportDocument,
  '\n  query GetPublicMapReportForLayout($orgSlug: String!, $reportSlug: String!) {\n    publicMapReport(orgSlug: $orgSlug, reportSlug: $reportSlug) {\n      id\n      name\n      displayOptions\n      organisation {\n        id\n        slug\n        name\n      }\n      layers {\n        id\n        name\n      }\n    }\n  }\n':
    types.GetPublicMapReportForLayoutDocument,
  '\n      query GetEditableHubs {\n        hubHomepages {\n          id\n        }\n      }\n    ':
    types.GetEditableHubsDocument,
  '\n          query VerifyPage($pageId: ID!) {\n            hubHomepages {\n              id\n            }\n            hubPage(pk: $pageId) {\n              id\n              hub {\n                id\n              }\n            }\n          }\n        ':
    types.VerifyPageDocument,
  '\n  query HostAnalytics($hostname: String!) {\n    hubByHostname(hostname: $hostname) {\n      googleAnalyticsTagId\n      primaryColour\n      secondaryColour\n      customCss\n    }\n  }\n':
    types.HostAnalyticsDocument,
  '\n  query GetHubMapData($hostname: String!) {\n    hubByHostname(hostname: $hostname) {\n      id\n      organisation {\n        id\n        slug\n        name\n      }\n      layers {\n        id\n        name\n        type\n        visible\n        iconImage\n        source\n        sourceData {\n          id\n        }\n        mapboxPaint\n        mapboxLayout\n      }\n      navLinks {\n        label\n        link\n      }\n    }\n  }\n':
    types.GetHubMapDataDocument,
  '\n  fragment EventFragment on GenericData {\n    id\n    title\n    address\n    postcode\n    startTime\n    publicUrl\n    description\n    dataType {\n      id\n      dataSet {\n        externalDataSource {\n          dataType\n        }\n      }\n    }\n  }\n':
    types.EventFragmentFragmentDoc,
  '\n  fragment ConstituencyViewFragment on Area {\n    id\n    gss\n    name\n    # For zooming\n    fitBounds\n    # For loudspeek\n    samplePostcode {\n      postcode\n    }\n    mp: person(filters: { personType: "MP" }) {\n      id\n      name\n      photo {\n        url\n      }\n      party: personDatum(filters: { dataType_Name: "party" }) {\n        name: data\n        shade\n      }\n      email: personDatum(filters: { dataType_Name: "email" }) {\n        data\n      }\n    }\n    # PPCs\n    ppcs: people(filters: { personType: "PPC" }) {\n      id\n      name\n      photo {\n        url\n      }\n      party: personDatum(filters: { dataType_Name: "party" }) {\n        name: data\n        shade\n      }\n      email: personDatum(filters: { dataType_Name: "email" }) {\n        data\n      }\n    }\n  }\n':
    types.ConstituencyViewFragmentFragmentDoc,
  '\n  query GetLocalData($postcode: String!, $hostname: String!) {\n    postcodeSearch(postcode: $postcode) {\n      postcode\n      constituency: constituency2024 {\n        ...ConstituencyViewFragment\n        # List of events\n        genericDataForHub(hostname: $hostname) {\n          ...EventFragment\n        }\n      }\n    }\n  }\n  \n  \n':
    types.GetLocalDataDocument,
  '\n  query GetEventData($eventId: String!, $hostname: String!) {\n    importedDataGeojsonPoint(genericDataId: $eventId) {\n      properties {\n        ...EventFragment\n        constituency: area {\n          ...ConstituencyViewFragment\n          # List of events\n          genericDataForHub(hostname: $hostname) {\n            ...EventFragment\n          }\n        }\n      }\n    }\n  }\n  \n  \n':
    types.GetEventDataDocument,
  '\n  query GetPage($hostname: String!, $path: String) {\n    hubPageByPath(hostname: $hostname, path: $path) {\n      id\n      title\n      path\n      puckJsonContent\n      seoTitle\n      searchDescription\n      hub {\n        faviconUrl\n        seoTitle\n        seoImageUrl\n        searchDescription\n        primaryColour\n        secondaryColour\n        customCss\n        navLinks {\n          link\n          label\n        }\n      }\n    }\n  }\n':
    types.GetPageDocument,
  '\n  query GetMemberList($currentOrganisationId: ID!) {\n    myOrganisations(filters: { id: $currentOrganisationId }) {\n      externalDataSources {\n        id\n        name\n        importedDataCount\n        crmType\n        dataType\n      }\n      sharingPermissionsFromOtherOrgs {\n        externalDataSource {\n          id\n          name\n          importedDataCount\n          crmType\n          dataType\n          organisation {\n            name\n          }\n        }\n      }\n    }\n  }\n':
    types.GetMemberListDocument,
  '\n  query AreaExplorerSummary($gss: String!) {\n    area(gss: $gss) {\n      id\n      fitBounds\n      name\n      areaType {\n        name\n        description\n      }\n      samplePostcode {\n        parliamentaryConstituency2024\n        adminWard\n        adminDistrict\n        europeanElectoralRegion\n        codes {\n          adminWard\n          adminDistrict\n          parliamentaryConstituency2024\n        }\n      }\n    }\n  }\n':
    types.AreaExplorerSummaryDocument,
  '\n  query AreaLayerData(\n    $gss: String!\n    $externalDataSource: String!\n    $mode: AreaQueryMode\n  ) {\n    # collect point data\n    data: genericDataFromSourceAboutArea(\n      gss: $gss\n      sourceId: $externalDataSource\n      mode: $mode\n    ) {\n      json\n      id\n      startTime\n      postcode\n      date\n      description\n      name\n      publicUrl\n      area {\n        id\n        gss\n        name\n        areaType {\n          name\n        }\n      }\n    }\n    # aggregate statistics about any data related to this area\n    summary: genericDataSummaryFromSourceAboutArea(\n      gss: $gss\n      sourceId: $externalDataSource\n      mode: $mode\n    ) {\n      aggregated\n      metadata {\n        first\n        second\n        third\n        last\n        total\n        count\n        mean\n        median\n      }\n    }\n  }\n':
    types.AreaLayerDataDocument,
  '\n  query RecordExplorerSummary($id: String!) {\n    import: importedDataGeojsonPoint(genericDataId: $id) {\n      id\n      geometry {\n        type\n        coordinates\n      }\n      record: properties {\n        id\n        dataType {\n          id\n          name\n          dataSet {\n            id\n            externalDataSource {\n              id\n              name\n              organisation {\n                id\n                name\n              }\n              crmType\n              dataType\n            }\n          }\n        }\n        postcode\n        postcodeData {\n          adminWard\n          adminDistrict\n          europeanElectoralRegion\n          codes {\n            adminWard\n            adminDistrict\n          }\n        }\n        title\n        firstName\n        lastName\n        fullName\n        email\n        phone\n        startTime\n        endTime\n        publicUrl\n        address\n        description\n        json\n        remoteUrl\n      }\n    }\n  }\n':
    types.RecordExplorerSummaryDocument,
  '\n  query MapReportLayerGeoJSONPoint($genericDataId: String!) {\n    importedDataGeojsonPoint(genericDataId: $genericDataId) {\n      id\n      type\n      geometry {\n        type\n        coordinates\n      }\n      properties {\n        id\n        lastUpdate\n        name\n        phone\n        email\n        postcodeData {\n          postcode\n        }\n        address\n        json\n        remoteUrl\n        dataType {\n          id\n          dataSet {\n            id\n            externalDataSource {\n              id\n              name\n              dataType\n            }\n          }\n        }\n      }\n    }\n  }\n':
    types.MapReportLayerGeoJsonPointDocument,
  '\n  query MapReportLayerAnalytics($reportID: ID!) {\n    mapReport(pk: $reportID) {\n      id\n      layers {\n        id\n        name\n        mapboxPaint\n        mapboxLayout\n        source\n        sourceData {\n          id\n          dataType\n          organisation {\n            name\n          }\n        }\n      }\n    }\n  }\n':
    types.MapReportLayerAnalyticsDocument,
  '\n  query GetMapReport($id: ID!) {\n    mapReport(pk: $id) {\n      id\n      name\n      slug\n      displayOptions\n      organisation {\n        id\n        slug\n        name\n      }\n      layers {\n        id\n        name\n        inspectorType\n        inspectorConfig\n        mapboxPaint\n        mapboxLayout\n        sharingPermission {\n          visibilityRecordDetails\n          visibilityRecordCoordinates\n          organisation {\n            name\n          }\n        }\n        source\n        sourceData {\n          id\n          name\n          isImportScheduled\n          importedDataCount\n          idField\n          crmType\n          dataType\n          remoteUrl\n          organisation {\n            name\n          }\n          fieldDefinitions {\n            externalId\n            value\n            label\n          }\n        }\n      }\n    }\n  }\n':
    types.GetMapReportDocument,
  '\n  mutation PatchMapReport($patch: JSON!, $reportId: String!) {\n    patchMapReportDisplayOptions(patch: $patch, reportId: $reportId) {\n      id\n      name\n      displayOptions\n      layers {\n        id\n        name\n        source\n        sourceData {\n          id\n          name\n        }\n        inspectorType\n        inspectorConfig\n        mapboxPaint\n        mapboxLayout\n      }\n    }\n  }\n':
    types.PatchMapReportDocument,
  '\n  mutation UpdateMapReport($input: MapReportInput!) {\n    updateMapReport(data: $input) {\n      id\n      name\n      displayOptions\n      layers {\n        id\n        name\n        source\n        sourceData {\n          id\n          name\n        }\n        inspectorType\n        inspectorConfig\n        mapboxPaint\n        mapboxLayout\n      }\n    }\n  }\n':
    types.UpdateMapReportDocument,
  '\n  mutation DeleteMapReport($id: IDObject!) {\n    deleteMapReport(data: $id) {\n      id\n    }\n  }\n':
    types.DeleteMapReportDocument,
  '\n  query GetMapReportName($id: ID!) {\n    mapReport(pk: $id) {\n      id\n      name\n    }\n  }\n':
    types.GetMapReportNameDocument,
  '\n  query SourceStatsByBoundary(\n    $sourceId: String!\n    $analyticalAreaType: AnalyticalAreaType!\n    $mode: ChoroplethMode\n    $field: String\n    $formula: String\n    $mapBounds: MapBounds\n  ) {\n    choroplethDataForSource(\n      sourceId: $sourceId\n      analyticalAreaKey: $analyticalAreaType\n      mode: $mode\n      field: $field\n      formula: $formula\n      mapBounds: $mapBounds\n    ) {\n      label\n      gss\n      count\n      formattedCount\n      gssArea {\n        point {\n          type\n          geometry {\n            type\n            coordinates\n          }\n        }\n      }\n    }\n  }\n':
    types.SourceStatsByBoundaryDocument,
  '\n  query SourceMetadata($sourceId: ID!) {\n    externalDataSource(pk: $sourceId) {\n      fieldDefinitions {\n        externalId\n        value\n        label\n      }\n    }\n  }\n':
    types.SourceMetadataDocument,
  '\n  mutation WebhookRefresh($ID: String!) {\n    refreshWebhooks(externalDataSourceId: $ID) {\n      id\n      hasWebhooks\n      automatedWebhooks\n      webhookHealthcheck\n    }\n  }\n':
    types.WebhookRefreshDocument,
  '\n  fragment DataSourceCard on ExternalDataSource {\n    id\n    name\n    dataType\n    crmType\n    automatedWebhooks\n    autoImportEnabled\n    autoUpdateEnabled\n    updateMapping {\n      source\n      sourcePath\n      destinationColumn\n    }\n    jobs(pagination: { limit: 10 }) {\n      lastEventAt\n      status\n    }\n    sharingPermissions {\n      id\n      organisation {\n        id\n        name\n      }\n    }\n  }\n':
    types.DataSourceCardFragmentDoc,
  '\n  query ExternalDataSourceExternalDataSourceCard($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      ...DataSourceCard\n    }\n  }\n  \n':
    types.ExternalDataSourceExternalDataSourceCardDocument,
  '\n  mutation EnableWebhook($ID: String!, $webhookType: WebhookType!) {\n    enableWebhook(externalDataSourceId: $ID, webhookType: $webhookType) {\n      id\n      autoImportEnabled\n      autoUpdateEnabled\n      hasWebhooks\n      automatedWebhooks\n      webhookHealthcheck\n      name\n    }\n  }\n':
    types.EnableWebhookDocument,
  '\n  mutation DisableWebhook($ID: String!, $webhookType: WebhookType!) {\n    disableWebhook(externalDataSourceId: $ID, webhookType: $webhookType) {\n      id\n      autoImportEnabled\n      autoUpdateEnabled\n      hasWebhooks\n      automatedWebhooks\n      webhookHealthcheck\n      name\n    }\n  }\n':
    types.DisableWebhookDocument,
  '\n  mutation TriggerFullUpdate($externalDataSourceId: String!) {\n    triggerUpdate(externalDataSourceId: $externalDataSourceId) {\n      id\n      externalDataSource {\n        jobs(pagination: { limit: 10 }) {\n          status\n          id\n          taskName\n          args\n          lastEventAt\n        }\n        id\n        name\n        crmType\n      }\n    }\n  }\n':
    types.TriggerFullUpdateDocument,
  '\n  query GetOrganisations {\n    myOrganisations {\n      id\n      name\n    }\n  }\n':
    types.GetOrganisationsDocument,
  '\n  query EnrichmentLayers($organisationPk: String!) {\n    mappingSources(organisationPk: $organisationPk) {\n      slug\n      name\n      author\n      description\n      descriptionUrl\n      sourcePaths {\n        label\n        value\n        description\n      }\n      # For custom data sources, get some useful data\n      externalDataSource {\n        id\n        name\n        dataType\n        crmType\n        organisation {\n          id\n          name\n        }\n      }\n      builtin\n    }\n  }\n':
    types.EnrichmentLayersDocument,
  '\n  query MyOrgs {\n    myOrganisations {\n      id\n      name\n      slug\n    }\n  }\n':
    types.MyOrgsDocument,
  '\n  query UserData {\n    me {\n      id\n      email\n      username\n    }\n    publicUser {\n      firstName\n      lastName\n    }\n  }\n':
    types.UserDataDocument,
  '\n        mutation PublishPage($pageId: String!, $input: HubPageInput!) {\n          updatePage(pageId: $pageId, input: $input) {\n            id\n            # Refresh cache\n            title\n            slug\n            puckJsonContent\n          }\n        }\n      ':
    types.PublishPageDocument,
  '\n        mutation CreateChildPage($parentId: String!, $title: String!) {\n          createChildPage(parentId: $parentId, title: $title) {\n            id\n          }\n        }\n      ':
    types.CreateChildPageDocument,
  '\n        mutation DeletePage($pageId: String!) {\n          deletePage(pageId: $pageId)\n        }\n      ':
    types.DeletePageDocument,
  '\n  query GetHubPages($hubId: ID!) {\n    hubHomepage(pk: $hubId) {\n      hostname\n      descendants(inclusive: true) {\n        id\n        title\n        path\n        slug\n        modelName\n        ancestors(inclusive: true) {\n          id\n          title\n          path\n          slug\n          modelName\n        }\n      }\n    }\n  }\n':
    types.GetHubPagesDocument,
  '\n  query GetPageEditorData($pageId: ID!) {\n    hubPage(pk: $pageId) {\n      id\n      title\n      path\n      slug\n      puckJsonContent\n      modelName\n      liveUrl\n      # For breadcrumbs\n      ancestors(inclusive: true) {\n        id\n        title\n        path\n        slug\n        modelName\n      }\n    }\n  }\n':
    types.GetPageEditorDataDocument,
  '\n  query GetHubContext($hostname: String!) {\n    hubByHostname(hostname: $hostname) {\n      id\n      customCss\n      primaryColour\n      secondaryColour\n    }\n  }\n':
    types.GetHubContextDocument,
  '\n              query GetEventSources {\n                externalDataSources(filters: { dataType: EVENT }) {\n                  name\n                  id\n                  eventCount: importedDataCount\n                  # For custom filtering\n                  fieldDefinitions {\n                    label\n                    value\n                  }\n                }\n              }\n            ':
    types.GetEventSourcesDocument,
  '\n      query GetEventList($sourceId: String!) {\n        genericDataByExternalDataSource(externalDataSourceId: $sourceId) {\n          id\n          title\n          description\n          startTime\n          endTime\n          publicUrl\n          json\n        }\n      }\n    ':
    types.GetEventListDocument,
  '\n  query GetHubHomepageJson($hostname: String!) {\n    hubPageByPath(hostname: $hostname) {\n      puckJsonContent\n    }\n  }\n':
    types.GetHubHomepageJsonDocument,
  '\n  query HubListDataSources($currentOrganisationId: ID!) {\n    myOrganisations(filters: { id: $currentOrganisationId }) {\n      id\n      externalDataSources {\n        id\n        name\n        dataType\n      }\n    }\n  }\n':
    types.HubListDataSourcesDocument,
  '\n  mutation AddMember($externalDataSourceId: String!, $email: String!, $postcode: String!, $customFields: JSON!, $tags: [String!]!) {\n    addMember(externalDataSourceId: $externalDataSourceId, email: $email, postcode: $postcode, customFields: $customFields, tags: $tags)\n  }\n':
    types.AddMemberDocument,
  '\n  mutation UpdateExternalDataSource($input: ExternalDataSourceInput!) {\n    updateExternalDataSource(input: $input) {\n      id\n      name\n      geographyColumn\n      geographyColumnType\n      geocodingConfig\n      usesValidGeocodingConfig\n      postcodeField\n      firstNameField\n      lastNameField\n      emailField\n      phoneField\n      addressField\n      canDisplayPointField\n      autoImportEnabled\n      autoUpdateEnabled\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n    }\n  }\n':
    types.UpdateExternalDataSourceDocument,
  '\n  query RecordGeometry($id: String!) {\n    import: importedDataGeojsonPoint(genericDataId: $id) {\n      id\n      geometry {\n        type\n        coordinates\n      }\n    }\n  }\n':
    types.RecordGeometryDocument,
  '\n  query AreaGeometry($gss: String!) {\n    area(gss: $gss) {\n      id\n      fitBounds\n    }\n  }\n':
    types.AreaGeometryDocument,
  '\n  query PublicUser {\n    publicUser {\n      id\n      username\n      email\n    }\n  }\n':
    types.PublicUserDocument,
}

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query DeveloperAPIContext {\n    listApiTokens {\n      token\n      signature\n      revoked\n      createdAt\n      expiresAt\n    }\n  }\n'
): (typeof documents)['\n  query DeveloperAPIContext {\n    listApiTokens {\n      token\n      signature\n      revoked\n      createdAt\n      expiresAt\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n        mutation CreateToken {\n          createApiToken {\n            token\n            signature\n            revoked\n            createdAt\n            expiresAt\n          }\n        }\n      '
): (typeof documents)['\n        mutation CreateToken {\n          createApiToken {\n            token\n            signature\n            revoked\n            createdAt\n            expiresAt\n          }\n        }\n      ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n        mutation RevokeToken($signature: ID!) {\n          revokeApiToken(signature: $signature) {\n            signature\n            revoked\n          }\n        }\n      '
): (typeof documents)['\n        mutation RevokeToken($signature: ID!) {\n          revokeApiToken(signature: $signature) {\n            signature\n            revoked\n          }\n        }\n      ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation Verify($token: String!) {\n    verifyAccount(token: $token) {\n      errors\n      success\n    }\n  }\n'
): (typeof documents)['\n  mutation Verify($token: String!) {\n    verifyAccount(token: $token) {\n      errors\n      success\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query Example {\n    myOrganisations {\n      id\n      name\n    }\n  }\n'
): (typeof documents)['\n  query Example {\n    myOrganisations {\n      id\n      name\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation Login($username: String!, $password: String!) {\n    tokenAuth(username: $username, password: $password) {\n      errors\n      success\n      token {\n        token\n        payload {\n          exp\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation Login($username: String!, $password: String!) {\n    tokenAuth(username: $username, password: $password) {\n      errors\n      success\n      token {\n        token\n        payload {\n          exp\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation PerformPasswordReset(\n    $token: String!\n    $password1: String!\n    $password2: String!\n  ) {\n    performPasswordReset(\n      token: $token\n      newPassword1: $password1\n      newPassword2: $password2\n    ) {\n      errors\n      success\n    }\n  }\n'
): (typeof documents)['\n  mutation PerformPasswordReset(\n    $token: String!\n    $password1: String!\n    $password2: String!\n  ) {\n    performPasswordReset(\n      token: $token\n      newPassword1: $password1\n      newPassword2: $password2\n    ) {\n      errors\n      success\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation ResetPassword($email: String!) {\n    requestPasswordReset(email: $email) {\n      errors\n      success\n    }\n  }\n'
): (typeof documents)['\n  mutation ResetPassword($email: String!) {\n    requestPasswordReset(email: $email) {\n      errors\n      success\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query ListOrganisations($currentOrganisationId: ID!) {\n    myOrganisations(filters: { id: $currentOrganisationId }) {\n      id\n      externalDataSources {\n        id\n        name\n        dataType\n        connectionDetails {\n          ... on AirtableSource {\n            baseId\n            tableId\n          }\n          ... on MailchimpSource {\n            apiKey\n            listId\n          }\n        }\n        crmType\n        autoImportEnabled\n        autoUpdateEnabled\n        jobs(pagination: { limit: 10 }) {\n          lastEventAt\n          status\n        }\n        updateMapping {\n          source\n          sourcePath\n          destinationColumn\n        }\n        sharingPermissions {\n          id\n          organisation {\n            id\n            name\n          }\n        }\n      }\n      sharingPermissionsFromOtherOrgs {\n        id\n        externalDataSource {\n          id\n          name\n          dataType\n          crmType\n          organisation {\n            name\n          }\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query ListOrganisations($currentOrganisationId: ID!) {\n    myOrganisations(filters: { id: $currentOrganisationId }) {\n      id\n      externalDataSources {\n        id\n        name\n        dataType\n        connectionDetails {\n          ... on AirtableSource {\n            baseId\n            tableId\n          }\n          ... on MailchimpSource {\n            apiKey\n            listId\n          }\n        }\n        crmType\n        autoImportEnabled\n        autoUpdateEnabled\n        jobs(pagination: { limit: 10 }) {\n          lastEventAt\n          status\n        }\n        updateMapping {\n          source\n          sourcePath\n          destinationColumn\n        }\n        sharingPermissions {\n          id\n          organisation {\n            id\n            name\n          }\n        }\n      }\n      sharingPermissionsFromOtherOrgs {\n        id\n        externalDataSource {\n          id\n          name\n          dataType\n          crmType\n          organisation {\n            name\n          }\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetSourceMapping($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      autoImportEnabled\n      autoUpdateEnabled\n      allowUpdates\n      hasWebhooks\n      updateMapping {\n        destinationColumn\n        source\n        sourcePath\n      }\n      fieldDefinitions {\n        label\n        value\n        description\n        editable\n      }\n      crmType\n      geographyColumn\n      geographyColumnType\n      geocodingConfig\n      usesValidGeocodingConfig\n      postcodeField\n      firstNameField\n      lastNameField\n      emailField\n      phoneField\n      addressField\n      canDisplayPointField\n    }\n  }\n'
): (typeof documents)['\n  query GetSourceMapping($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      autoImportEnabled\n      autoUpdateEnabled\n      allowUpdates\n      hasWebhooks\n      updateMapping {\n        destinationColumn\n        source\n        sourcePath\n      }\n      fieldDefinitions {\n        label\n        value\n        description\n        editable\n      }\n      crmType\n      geographyColumn\n      geographyColumnType\n      geocodingConfig\n      usesValidGeocodingConfig\n      postcodeField\n      firstNameField\n      lastNameField\n      emailField\n      phoneField\n      addressField\n      canDisplayPointField\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query TestDataSource($input: CreateExternalDataSourceInput!) {\n    testDataSource(input: $input) {\n      __typename\n      crmType\n      fieldDefinitions {\n        label\n        value\n        description\n        editable\n      }\n      geographyColumn\n      geographyColumnType\n      geocodingConfig\n      usesValidGeocodingConfig\n      healthcheck\n      predefinedColumnNames\n      defaultDataType\n      remoteName\n      allowUpdates\n      defaults\n      oauthCredentials\n    }\n  }\n'
): (typeof documents)['\n  query TestDataSource($input: CreateExternalDataSourceInput!) {\n    testDataSource(input: $input) {\n      __typename\n      crmType\n      fieldDefinitions {\n        label\n        value\n        description\n        editable\n      }\n      geographyColumn\n      geographyColumnType\n      geocodingConfig\n      usesValidGeocodingConfig\n      healthcheck\n      predefinedColumnNames\n      defaultDataType\n      remoteName\n      allowUpdates\n      defaults\n      oauthCredentials\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GoogleSheetsOauthUrl($redirectUrl: String!) {\n    googleSheetsOauthUrl(redirectUrl: $redirectUrl)\n  }\n'
): (typeof documents)['\n  query GoogleSheetsOauthUrl($redirectUrl: String!) {\n    googleSheetsOauthUrl(redirectUrl: $redirectUrl)\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GoogleSheetsOauthCredentials($redirectSuccessUrl: String!) {\n    googleSheetsOauthCredentials(redirectSuccessUrl: $redirectSuccessUrl)\n  }\n'
): (typeof documents)['\n  query GoogleSheetsOauthCredentials($redirectSuccessUrl: String!) {\n    googleSheetsOauthCredentials(redirectSuccessUrl: $redirectSuccessUrl)\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation CreateSource($input: CreateExternalDataSourceInput!) {\n    createExternalDataSource(input: $input) {\n      code\n      errors {\n        message\n      }\n      result {\n        id\n        name\n        crmType\n        dataType\n        allowUpdates\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation CreateSource($input: CreateExternalDataSourceInput!) {\n    createExternalDataSource(input: $input) {\n      code\n      errors {\n        message\n      }\n      result {\n        id\n        name\n        crmType\n        dataType\n        allowUpdates\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query AutoUpdateCreationReview($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      name\n      geographyColumn\n      geographyColumnType\n      geocodingConfig\n      usesValidGeocodingConfig\n      dataType\n      crmType\n      autoImportEnabled\n      autoUpdateEnabled\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n      jobs(pagination: { limit: 10 }) {\n        lastEventAt\n        status\n      }\n      automatedWebhooks\n      webhookUrl\n      ...DataSourceCard\n    }\n  }\n  \n'
): (typeof documents)['\n  query AutoUpdateCreationReview($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      name\n      geographyColumn\n      geographyColumnType\n      geocodingConfig\n      usesValidGeocodingConfig\n      dataType\n      crmType\n      autoImportEnabled\n      autoUpdateEnabled\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n      jobs(pagination: { limit: 10 }) {\n        lastEventAt\n        status\n      }\n      automatedWebhooks\n      webhookUrl\n      ...DataSourceCard\n    }\n  }\n  \n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query ExternalDataSourceInspectPage($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      name\n      dataType\n      remoteUrl\n      crmType\n      connectionDetails {\n        ... on AirtableSource {\n          apiKey\n          baseId\n          tableId\n        }\n        ... on MailchimpSource {\n          apiKey\n          listId\n        }\n        ... on ActionNetworkSource {\n          apiKey\n          groupSlug\n        }\n        ... on TicketTailorSource {\n          apiKey\n        }\n      }\n      lastImportJob {\n        id\n        lastEventAt\n        status\n      }\n      lastUpdateJob {\n        id\n        lastEventAt\n        status\n      }\n      autoImportEnabled\n      autoUpdateEnabled\n      hasWebhooks\n      allowUpdates\n      automatedWebhooks\n      webhookUrl\n      webhookHealthcheck\n      geographyColumn\n      geographyColumnType\n      geocodingConfig\n      usesValidGeocodingConfig\n      postcodeField\n      firstNameField\n      lastNameField\n      fullNameField\n      emailField\n      phoneField\n      addressField\n      titleField\n      descriptionField\n      imageField\n      startTimeField\n      endTimeField\n      publicUrlField\n      socialUrlField\n      canDisplayPointField\n      isImportScheduled\n      importProgress {\n        id\n        hasForecast\n        status\n        total\n        succeeded\n        estimatedFinishTime\n        actualFinishTime\n        inQueue\n        numberOfJobsAheadInQueue\n        sendEmail\n      }\n      isUpdateScheduled\n      updateProgress {\n        id\n        hasForecast\n        status\n        total\n        succeeded\n        estimatedFinishTime\n        actualFinishTime\n        inQueue\n        numberOfJobsAheadInQueue\n        sendEmail\n      }\n      importedDataCount\n      importedDataGeocodingRate\n      regionCount: importedDataCountOfAreas(\n        analyticalAreaType: european_electoral_region\n      )\n      constituencyCount: importedDataCountOfAreas(\n        analyticalAreaType: parliamentary_constituency\n      )\n      ladCount: importedDataCountOfAreas(analyticalAreaType: admin_district)\n      wardCount: importedDataCountOfAreas(analyticalAreaType: admin_ward)\n      fieldDefinitions {\n        label\n        value\n        description\n        editable\n      }\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n      sharingPermissions {\n        id\n      }\n      organisation {\n        id\n        name\n      }\n    }\n  }\n'
): (typeof documents)['\n  query ExternalDataSourceInspectPage($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      name\n      dataType\n      remoteUrl\n      crmType\n      connectionDetails {\n        ... on AirtableSource {\n          apiKey\n          baseId\n          tableId\n        }\n        ... on MailchimpSource {\n          apiKey\n          listId\n        }\n        ... on ActionNetworkSource {\n          apiKey\n          groupSlug\n        }\n        ... on TicketTailorSource {\n          apiKey\n        }\n      }\n      lastImportJob {\n        id\n        lastEventAt\n        status\n      }\n      lastUpdateJob {\n        id\n        lastEventAt\n        status\n      }\n      autoImportEnabled\n      autoUpdateEnabled\n      hasWebhooks\n      allowUpdates\n      automatedWebhooks\n      webhookUrl\n      webhookHealthcheck\n      geographyColumn\n      geographyColumnType\n      geocodingConfig\n      usesValidGeocodingConfig\n      postcodeField\n      firstNameField\n      lastNameField\n      fullNameField\n      emailField\n      phoneField\n      addressField\n      titleField\n      descriptionField\n      imageField\n      startTimeField\n      endTimeField\n      publicUrlField\n      socialUrlField\n      canDisplayPointField\n      isImportScheduled\n      importProgress {\n        id\n        hasForecast\n        status\n        total\n        succeeded\n        estimatedFinishTime\n        actualFinishTime\n        inQueue\n        numberOfJobsAheadInQueue\n        sendEmail\n      }\n      isUpdateScheduled\n      updateProgress {\n        id\n        hasForecast\n        status\n        total\n        succeeded\n        estimatedFinishTime\n        actualFinishTime\n        inQueue\n        numberOfJobsAheadInQueue\n        sendEmail\n      }\n      importedDataCount\n      importedDataGeocodingRate\n      regionCount: importedDataCountOfAreas(\n        analyticalAreaType: european_electoral_region\n      )\n      constituencyCount: importedDataCountOfAreas(\n        analyticalAreaType: parliamentary_constituency\n      )\n      ladCount: importedDataCountOfAreas(analyticalAreaType: admin_district)\n      wardCount: importedDataCountOfAreas(analyticalAreaType: admin_ward)\n      fieldDefinitions {\n        label\n        value\n        description\n        editable\n      }\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n      sharingPermissions {\n        id\n      }\n      organisation {\n        id\n        name\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation DeleteUpdateConfig($id: String!) {\n    deleteExternalDataSource(data: { id: $id }) {\n      id\n    }\n  }\n'
): (typeof documents)['\n  mutation DeleteUpdateConfig($id: String!) {\n    deleteExternalDataSource(data: { id: $id }) {\n      id\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n                        mutation DeleteRecords($externalDataSourceId: String!) {\n                          deleteAllRecords(\n                            externalDataSourceId: $externalDataSourceId\n                          ) {\n                            id\n                          }\n                        }\n                      '
): (typeof documents)['\n                        mutation DeleteRecords($externalDataSourceId: String!) {\n                          deleteAllRecords(\n                            externalDataSourceId: $externalDataSourceId\n                          ) {\n                            id\n                          }\n                        }\n                      ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n      query ManageSourceSharing($externalDataSourceId: ID!) {\n        externalDataSource(pk: $externalDataSourceId) {\n          sharingPermissions {\n            id\n            organisationId\n            organisation {\n              name\n            }\n            externalDataSourceId\n            visibilityRecordCoordinates\n            visibilityRecordDetails\n            deleted\n          }\n        }\n      }\n    '
): (typeof documents)['\n      query ManageSourceSharing($externalDataSourceId: ID!) {\n        externalDataSource(pk: $externalDataSourceId) {\n          sharingPermissions {\n            id\n            organisationId\n            organisation {\n              name\n            }\n            externalDataSourceId\n            visibilityRecordCoordinates\n            visibilityRecordDetails\n            deleted\n          }\n        }\n      }\n    ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n          mutation UpdateSourceSharingObject(\n            $data: SharingPermissionCUDInput!\n          ) {\n            updateSharingPermission(data: $data) {\n              id\n              organisationId\n              externalDataSourceId\n              visibilityRecordCoordinates\n              visibilityRecordDetails\n              deleted\n            }\n          }\n        '
): (typeof documents)['\n          mutation UpdateSourceSharingObject(\n            $data: SharingPermissionCUDInput!\n          ) {\n            updateSharingPermission(data: $data) {\n              id\n              organisationId\n              externalDataSourceId\n              visibilityRecordCoordinates\n              visibilityRecordDetails\n              deleted\n            }\n          }\n        ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n          mutation DeleteSourceSharingObject($pk: String!) {\n            deleteSharingPermission(data: { id: $pk }) {\n              id\n            }\n          }\n        '
): (typeof documents)['\n          mutation DeleteSourceSharingObject($pk: String!) {\n            deleteSharingPermission(data: { id: $pk }) {\n              id\n            }\n          }\n        ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n      mutation ImportData($id: String!) {\n        importAll(externalDataSourceId: $id) {\n          id\n          externalDataSource {\n            importedDataCount\n            importProgress {\n              status\n              hasForecast\n              id\n              total\n              succeeded\n              failed\n              estimatedFinishTime\n              inQueue\n            }\n          }\n        }\n      }\n    '
): (typeof documents)['\n      mutation ImportData($id: String!) {\n        importAll(externalDataSourceId: $id) {\n          id\n          externalDataSource {\n            importedDataCount\n            importProgress {\n              status\n              hasForecast\n              id\n              total\n              succeeded\n              failed\n              estimatedFinishTime\n              inQueue\n            }\n          }\n        }\n      }\n    ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n      mutation CancelImport($id: String!, $requestId: String!) {\n        cancelImport(externalDataSourceId: $id, requestId: $requestId) {\n          id\n        }\n      }\n    '
): (typeof documents)['\n      mutation CancelImport($id: String!, $requestId: String!) {\n        cancelImport(externalDataSourceId: $id, requestId: $requestId) {\n          id\n        }\n      }\n    ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query ExternalDataSourceName($externalDataSourceId: ID!) {\n    externalDataSource(pk: $externalDataSourceId) {\n      name\n      crmType\n      dataType\n      name\n      remoteUrl\n    }\n  }\n'
): (typeof documents)['\n  query ExternalDataSourceName($externalDataSourceId: ID!) {\n    externalDataSource(pk: $externalDataSourceId) {\n      name\n      crmType\n      dataType\n      name\n      remoteUrl\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n          mutation ShareDataSources(\n            $fromOrgId: String!\n            $permissions: [SharingPermissionInput!]!\n          ) {\n            updateSharingPermissions(\n              fromOrgId: $fromOrgId\n              permissions: $permissions\n            ) {\n              id\n              sharingPermissions {\n                id\n                organisationId\n                externalDataSourceId\n                visibilityRecordCoordinates\n                visibilityRecordDetails\n                deleted\n              }\n            }\n          }\n        '
): (typeof documents)['\n          mutation ShareDataSources(\n            $fromOrgId: String!\n            $permissions: [SharingPermissionInput!]!\n          ) {\n            updateSharingPermissions(\n              fromOrgId: $fromOrgId\n              permissions: $permissions\n            ) {\n              id\n              sharingPermissions {\n                id\n                organisationId\n                externalDataSourceId\n                visibilityRecordCoordinates\n                visibilityRecordDetails\n                deleted\n              }\n            }\n          }\n        ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query YourSourcesForSharing {\n    myOrganisations {\n      id\n      name\n      externalDataSources {\n        id\n        name\n        crmType\n        importedDataCount\n        dataType\n        fieldDefinitions {\n          label\n          editable\n        }\n        organisationId\n        sharingPermissions {\n          id\n          organisationId\n          externalDataSourceId\n          visibilityRecordCoordinates\n          visibilityRecordDetails\n          deleted\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query YourSourcesForSharing {\n    myOrganisations {\n      id\n      name\n      externalDataSources {\n        id\n        name\n        crmType\n        importedDataCount\n        dataType\n        fieldDefinitions {\n          label\n          editable\n        }\n        organisationId\n        sharingPermissions {\n          id\n          organisationId\n          externalDataSourceId\n          visibilityRecordCoordinates\n          visibilityRecordDetails\n          deleted\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query ShareWithOrgPage($orgSlug: String!) {\n    allOrganisations(filters: { slug: $orgSlug }) {\n      id\n      name\n    }\n  }\n'
): (typeof documents)['\n  query ShareWithOrgPage($orgSlug: String!) {\n    allOrganisations(filters: { slug: $orgSlug }) {\n      id\n      name\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation CreateMapReport($data: MapReportInput!) {\n    createMapReport(data: $data) {\n      ... on MapReport {\n        id\n      }\n      ... on OperationInfo {\n        messages {\n          message\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation CreateMapReport($data: MapReportInput!) {\n    createMapReport(data: $data) {\n      ... on MapReport {\n        id\n      }\n      ... on OperationInfo {\n        messages {\n          message\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query ListReports($currentOrganisationId: ID!) {\n    reports(filters: { organisation: { pk: $currentOrganisationId } }) {\n      id\n      name\n      lastUpdate\n    }\n  }\n'
): (typeof documents)['\n  query ListReports($currentOrganisationId: ID!) {\n    reports(filters: { organisation: { pk: $currentOrganisationId } }) {\n      id\n      name\n      lastUpdate\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query ListExternalDataSources {\n    myOrganisations {\n      id\n      externalDataSources {\n        id\n      }\n    }\n  }\n'
): (typeof documents)['\n  query ListExternalDataSources {\n    myOrganisations {\n      id\n      externalDataSources {\n        id\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetPublicMapReport($orgSlug: String!, $reportSlug: String!) {\n    publicMapReport(orgSlug: $orgSlug, reportSlug: $reportSlug) {\n      id\n      name\n    }\n  }\n'
): (typeof documents)['\n  query GetPublicMapReport($orgSlug: String!, $reportSlug: String!) {\n    publicMapReport(orgSlug: $orgSlug, reportSlug: $reportSlug) {\n      id\n      name\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetPublicMapReportForLayout($orgSlug: String!, $reportSlug: String!) {\n    publicMapReport(orgSlug: $orgSlug, reportSlug: $reportSlug) {\n      id\n      name\n      displayOptions\n      organisation {\n        id\n        slug\n        name\n      }\n      layers {\n        id\n        name\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetPublicMapReportForLayout($orgSlug: String!, $reportSlug: String!) {\n    publicMapReport(orgSlug: $orgSlug, reportSlug: $reportSlug) {\n      id\n      name\n      displayOptions\n      organisation {\n        id\n        slug\n        name\n      }\n      layers {\n        id\n        name\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n      query GetEditableHubs {\n        hubHomepages {\n          id\n        }\n      }\n    '
): (typeof documents)['\n      query GetEditableHubs {\n        hubHomepages {\n          id\n        }\n      }\n    ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n          query VerifyPage($pageId: ID!) {\n            hubHomepages {\n              id\n            }\n            hubPage(pk: $pageId) {\n              id\n              hub {\n                id\n              }\n            }\n          }\n        '
): (typeof documents)['\n          query VerifyPage($pageId: ID!) {\n            hubHomepages {\n              id\n            }\n            hubPage(pk: $pageId) {\n              id\n              hub {\n                id\n              }\n            }\n          }\n        ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query HostAnalytics($hostname: String!) {\n    hubByHostname(hostname: $hostname) {\n      googleAnalyticsTagId\n      primaryColour\n      secondaryColour\n      customCss\n    }\n  }\n'
): (typeof documents)['\n  query HostAnalytics($hostname: String!) {\n    hubByHostname(hostname: $hostname) {\n      googleAnalyticsTagId\n      primaryColour\n      secondaryColour\n      customCss\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetHubMapData($hostname: String!) {\n    hubByHostname(hostname: $hostname) {\n      id\n      organisation {\n        id\n        slug\n        name\n      }\n      layers {\n        id\n        name\n        type\n        visible\n        iconImage\n        source\n        sourceData {\n          id\n        }\n        mapboxPaint\n        mapboxLayout\n      }\n      navLinks {\n        label\n        link\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetHubMapData($hostname: String!) {\n    hubByHostname(hostname: $hostname) {\n      id\n      organisation {\n        id\n        slug\n        name\n      }\n      layers {\n        id\n        name\n        type\n        visible\n        iconImage\n        source\n        sourceData {\n          id\n        }\n        mapboxPaint\n        mapboxLayout\n      }\n      navLinks {\n        label\n        link\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  fragment EventFragment on GenericData {\n    id\n    title\n    address\n    postcode\n    startTime\n    publicUrl\n    description\n    dataType {\n      id\n      dataSet {\n        externalDataSource {\n          dataType\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  fragment EventFragment on GenericData {\n    id\n    title\n    address\n    postcode\n    startTime\n    publicUrl\n    description\n    dataType {\n      id\n      dataSet {\n        externalDataSource {\n          dataType\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  fragment ConstituencyViewFragment on Area {\n    id\n    gss\n    name\n    # For zooming\n    fitBounds\n    # For loudspeek\n    samplePostcode {\n      postcode\n    }\n    mp: person(filters: { personType: "MP" }) {\n      id\n      name\n      photo {\n        url\n      }\n      party: personDatum(filters: { dataType_Name: "party" }) {\n        name: data\n        shade\n      }\n      email: personDatum(filters: { dataType_Name: "email" }) {\n        data\n      }\n    }\n    # PPCs\n    ppcs: people(filters: { personType: "PPC" }) {\n      id\n      name\n      photo {\n        url\n      }\n      party: personDatum(filters: { dataType_Name: "party" }) {\n        name: data\n        shade\n      }\n      email: personDatum(filters: { dataType_Name: "email" }) {\n        data\n      }\n    }\n  }\n'
): (typeof documents)['\n  fragment ConstituencyViewFragment on Area {\n    id\n    gss\n    name\n    # For zooming\n    fitBounds\n    # For loudspeek\n    samplePostcode {\n      postcode\n    }\n    mp: person(filters: { personType: "MP" }) {\n      id\n      name\n      photo {\n        url\n      }\n      party: personDatum(filters: { dataType_Name: "party" }) {\n        name: data\n        shade\n      }\n      email: personDatum(filters: { dataType_Name: "email" }) {\n        data\n      }\n    }\n    # PPCs\n    ppcs: people(filters: { personType: "PPC" }) {\n      id\n      name\n      photo {\n        url\n      }\n      party: personDatum(filters: { dataType_Name: "party" }) {\n        name: data\n        shade\n      }\n      email: personDatum(filters: { dataType_Name: "email" }) {\n        data\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetLocalData($postcode: String!, $hostname: String!) {\n    postcodeSearch(postcode: $postcode) {\n      postcode\n      constituency: constituency2024 {\n        ...ConstituencyViewFragment\n        # List of events\n        genericDataForHub(hostname: $hostname) {\n          ...EventFragment\n        }\n      }\n    }\n  }\n  \n  \n'
): (typeof documents)['\n  query GetLocalData($postcode: String!, $hostname: String!) {\n    postcodeSearch(postcode: $postcode) {\n      postcode\n      constituency: constituency2024 {\n        ...ConstituencyViewFragment\n        # List of events\n        genericDataForHub(hostname: $hostname) {\n          ...EventFragment\n        }\n      }\n    }\n  }\n  \n  \n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetEventData($eventId: String!, $hostname: String!) {\n    importedDataGeojsonPoint(genericDataId: $eventId) {\n      properties {\n        ...EventFragment\n        constituency: area {\n          ...ConstituencyViewFragment\n          # List of events\n          genericDataForHub(hostname: $hostname) {\n            ...EventFragment\n          }\n        }\n      }\n    }\n  }\n  \n  \n'
): (typeof documents)['\n  query GetEventData($eventId: String!, $hostname: String!) {\n    importedDataGeojsonPoint(genericDataId: $eventId) {\n      properties {\n        ...EventFragment\n        constituency: area {\n          ...ConstituencyViewFragment\n          # List of events\n          genericDataForHub(hostname: $hostname) {\n            ...EventFragment\n          }\n        }\n      }\n    }\n  }\n  \n  \n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetPage($hostname: String!, $path: String) {\n    hubPageByPath(hostname: $hostname, path: $path) {\n      id\n      title\n      path\n      puckJsonContent\n      seoTitle\n      searchDescription\n      hub {\n        faviconUrl\n        seoTitle\n        seoImageUrl\n        searchDescription\n        primaryColour\n        secondaryColour\n        customCss\n        navLinks {\n          link\n          label\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetPage($hostname: String!, $path: String) {\n    hubPageByPath(hostname: $hostname, path: $path) {\n      id\n      title\n      path\n      puckJsonContent\n      seoTitle\n      searchDescription\n      hub {\n        faviconUrl\n        seoTitle\n        seoImageUrl\n        searchDescription\n        primaryColour\n        secondaryColour\n        customCss\n        navLinks {\n          link\n          label\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetMemberList($currentOrganisationId: ID!) {\n    myOrganisations(filters: { id: $currentOrganisationId }) {\n      externalDataSources {\n        id\n        name\n        importedDataCount\n        crmType\n        dataType\n      }\n      sharingPermissionsFromOtherOrgs {\n        externalDataSource {\n          id\n          name\n          importedDataCount\n          crmType\n          dataType\n          organisation {\n            name\n          }\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetMemberList($currentOrganisationId: ID!) {\n    myOrganisations(filters: { id: $currentOrganisationId }) {\n      externalDataSources {\n        id\n        name\n        importedDataCount\n        crmType\n        dataType\n      }\n      sharingPermissionsFromOtherOrgs {\n        externalDataSource {\n          id\n          name\n          importedDataCount\n          crmType\n          dataType\n          organisation {\n            name\n          }\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query AreaExplorerSummary($gss: String!) {\n    area(gss: $gss) {\n      id\n      fitBounds\n      name\n      areaType {\n        name\n        description\n      }\n      samplePostcode {\n        parliamentaryConstituency2024\n        adminWard\n        adminDistrict\n        europeanElectoralRegion\n        codes {\n          adminWard\n          adminDistrict\n          parliamentaryConstituency2024\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query AreaExplorerSummary($gss: String!) {\n    area(gss: $gss) {\n      id\n      fitBounds\n      name\n      areaType {\n        name\n        description\n      }\n      samplePostcode {\n        parliamentaryConstituency2024\n        adminWard\n        adminDistrict\n        europeanElectoralRegion\n        codes {\n          adminWard\n          adminDistrict\n          parliamentaryConstituency2024\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query AreaLayerData(\n    $gss: String!\n    $externalDataSource: String!\n    $mode: AreaQueryMode\n  ) {\n    # collect point data\n    data: genericDataFromSourceAboutArea(\n      gss: $gss\n      sourceId: $externalDataSource\n      mode: $mode\n    ) {\n      json\n      id\n      startTime\n      postcode\n      date\n      description\n      name\n      publicUrl\n      area {\n        id\n        gss\n        name\n        areaType {\n          name\n        }\n      }\n    }\n    # aggregate statistics about any data related to this area\n    summary: genericDataSummaryFromSourceAboutArea(\n      gss: $gss\n      sourceId: $externalDataSource\n      mode: $mode\n    ) {\n      aggregated\n      metadata {\n        first\n        second\n        third\n        last\n        total\n        count\n        mean\n        median\n      }\n    }\n  }\n'
): (typeof documents)['\n  query AreaLayerData(\n    $gss: String!\n    $externalDataSource: String!\n    $mode: AreaQueryMode\n  ) {\n    # collect point data\n    data: genericDataFromSourceAboutArea(\n      gss: $gss\n      sourceId: $externalDataSource\n      mode: $mode\n    ) {\n      json\n      id\n      startTime\n      postcode\n      date\n      description\n      name\n      publicUrl\n      area {\n        id\n        gss\n        name\n        areaType {\n          name\n        }\n      }\n    }\n    # aggregate statistics about any data related to this area\n    summary: genericDataSummaryFromSourceAboutArea(\n      gss: $gss\n      sourceId: $externalDataSource\n      mode: $mode\n    ) {\n      aggregated\n      metadata {\n        first\n        second\n        third\n        last\n        total\n        count\n        mean\n        median\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query RecordExplorerSummary($id: String!) {\n    import: importedDataGeojsonPoint(genericDataId: $id) {\n      id\n      geometry {\n        type\n        coordinates\n      }\n      record: properties {\n        id\n        dataType {\n          id\n          name\n          dataSet {\n            id\n            externalDataSource {\n              id\n              name\n              organisation {\n                id\n                name\n              }\n              crmType\n              dataType\n            }\n          }\n        }\n        postcode\n        postcodeData {\n          adminWard\n          adminDistrict\n          europeanElectoralRegion\n          codes {\n            adminWard\n            adminDistrict\n          }\n        }\n        title\n        firstName\n        lastName\n        fullName\n        email\n        phone\n        startTime\n        endTime\n        publicUrl\n        address\n        description\n        json\n        remoteUrl\n      }\n    }\n  }\n'
): (typeof documents)['\n  query RecordExplorerSummary($id: String!) {\n    import: importedDataGeojsonPoint(genericDataId: $id) {\n      id\n      geometry {\n        type\n        coordinates\n      }\n      record: properties {\n        id\n        dataType {\n          id\n          name\n          dataSet {\n            id\n            externalDataSource {\n              id\n              name\n              organisation {\n                id\n                name\n              }\n              crmType\n              dataType\n            }\n          }\n        }\n        postcode\n        postcodeData {\n          adminWard\n          adminDistrict\n          europeanElectoralRegion\n          codes {\n            adminWard\n            adminDistrict\n          }\n        }\n        title\n        firstName\n        lastName\n        fullName\n        email\n        phone\n        startTime\n        endTime\n        publicUrl\n        address\n        description\n        json\n        remoteUrl\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query MapReportLayerGeoJSONPoint($genericDataId: String!) {\n    importedDataGeojsonPoint(genericDataId: $genericDataId) {\n      id\n      type\n      geometry {\n        type\n        coordinates\n      }\n      properties {\n        id\n        lastUpdate\n        name\n        phone\n        email\n        postcodeData {\n          postcode\n        }\n        address\n        json\n        remoteUrl\n        dataType {\n          id\n          dataSet {\n            id\n            externalDataSource {\n              id\n              name\n              dataType\n            }\n          }\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query MapReportLayerGeoJSONPoint($genericDataId: String!) {\n    importedDataGeojsonPoint(genericDataId: $genericDataId) {\n      id\n      type\n      geometry {\n        type\n        coordinates\n      }\n      properties {\n        id\n        lastUpdate\n        name\n        phone\n        email\n        postcodeData {\n          postcode\n        }\n        address\n        json\n        remoteUrl\n        dataType {\n          id\n          dataSet {\n            id\n            externalDataSource {\n              id\n              name\n              dataType\n            }\n          }\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query MapReportLayerAnalytics($reportID: ID!) {\n    mapReport(pk: $reportID) {\n      id\n      layers {\n        id\n        name\n        mapboxPaint\n        mapboxLayout\n        source\n        sourceData {\n          id\n          dataType\n          organisation {\n            name\n          }\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query MapReportLayerAnalytics($reportID: ID!) {\n    mapReport(pk: $reportID) {\n      id\n      layers {\n        id\n        name\n        mapboxPaint\n        mapboxLayout\n        source\n        sourceData {\n          id\n          dataType\n          organisation {\n            name\n          }\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetMapReport($id: ID!) {\n    mapReport(pk: $id) {\n      id\n      name\n      slug\n      displayOptions\n      organisation {\n        id\n        slug\n        name\n      }\n      layers {\n        id\n        name\n        inspectorType\n        inspectorConfig\n        mapboxPaint\n        mapboxLayout\n        sharingPermission {\n          visibilityRecordDetails\n          visibilityRecordCoordinates\n          organisation {\n            name\n          }\n        }\n        source\n        sourceData {\n          id\n          name\n          isImportScheduled\n          importedDataCount\n          idField\n          crmType\n          dataType\n          remoteUrl\n          organisation {\n            name\n          }\n          fieldDefinitions {\n            externalId\n            value\n            label\n          }\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetMapReport($id: ID!) {\n    mapReport(pk: $id) {\n      id\n      name\n      slug\n      displayOptions\n      organisation {\n        id\n        slug\n        name\n      }\n      layers {\n        id\n        name\n        inspectorType\n        inspectorConfig\n        mapboxPaint\n        mapboxLayout\n        sharingPermission {\n          visibilityRecordDetails\n          visibilityRecordCoordinates\n          organisation {\n            name\n          }\n        }\n        source\n        sourceData {\n          id\n          name\n          isImportScheduled\n          importedDataCount\n          idField\n          crmType\n          dataType\n          remoteUrl\n          organisation {\n            name\n          }\n          fieldDefinitions {\n            externalId\n            value\n            label\n          }\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation PatchMapReport($patch: JSON!, $reportId: String!) {\n    patchMapReportDisplayOptions(patch: $patch, reportId: $reportId) {\n      id\n      name\n      displayOptions\n      layers {\n        id\n        name\n        source\n        sourceData {\n          id\n          name\n        }\n        inspectorType\n        inspectorConfig\n        mapboxPaint\n        mapboxLayout\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation PatchMapReport($patch: JSON!, $reportId: String!) {\n    patchMapReportDisplayOptions(patch: $patch, reportId: $reportId) {\n      id\n      name\n      displayOptions\n      layers {\n        id\n        name\n        source\n        sourceData {\n          id\n          name\n        }\n        inspectorType\n        inspectorConfig\n        mapboxPaint\n        mapboxLayout\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation UpdateMapReport($input: MapReportInput!) {\n    updateMapReport(data: $input) {\n      id\n      name\n      displayOptions\n      layers {\n        id\n        name\n        source\n        sourceData {\n          id\n          name\n        }\n        inspectorType\n        inspectorConfig\n        mapboxPaint\n        mapboxLayout\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation UpdateMapReport($input: MapReportInput!) {\n    updateMapReport(data: $input) {\n      id\n      name\n      displayOptions\n      layers {\n        id\n        name\n        source\n        sourceData {\n          id\n          name\n        }\n        inspectorType\n        inspectorConfig\n        mapboxPaint\n        mapboxLayout\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation DeleteMapReport($id: IDObject!) {\n    deleteMapReport(data: $id) {\n      id\n    }\n  }\n'
): (typeof documents)['\n  mutation DeleteMapReport($id: IDObject!) {\n    deleteMapReport(data: $id) {\n      id\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetMapReportName($id: ID!) {\n    mapReport(pk: $id) {\n      id\n      name\n    }\n  }\n'
): (typeof documents)['\n  query GetMapReportName($id: ID!) {\n    mapReport(pk: $id) {\n      id\n      name\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query SourceStatsByBoundary(\n    $sourceId: String!\n    $analyticalAreaType: AnalyticalAreaType!\n    $mode: ChoroplethMode\n    $field: String\n    $formula: String\n    $mapBounds: MapBounds\n  ) {\n    choroplethDataForSource(\n      sourceId: $sourceId\n      analyticalAreaKey: $analyticalAreaType\n      mode: $mode\n      field: $field\n      formula: $formula\n      mapBounds: $mapBounds\n    ) {\n      label\n      gss\n      count\n      formattedCount\n      gssArea {\n        point {\n          type\n          geometry {\n            type\n            coordinates\n          }\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query SourceStatsByBoundary(\n    $sourceId: String!\n    $analyticalAreaType: AnalyticalAreaType!\n    $mode: ChoroplethMode\n    $field: String\n    $formula: String\n    $mapBounds: MapBounds\n  ) {\n    choroplethDataForSource(\n      sourceId: $sourceId\n      analyticalAreaKey: $analyticalAreaType\n      mode: $mode\n      field: $field\n      formula: $formula\n      mapBounds: $mapBounds\n    ) {\n      label\n      gss\n      count\n      formattedCount\n      gssArea {\n        point {\n          type\n          geometry {\n            type\n            coordinates\n          }\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query SourceMetadata($sourceId: ID!) {\n    externalDataSource(pk: $sourceId) {\n      fieldDefinitions {\n        externalId\n        value\n        label\n      }\n    }\n  }\n'
): (typeof documents)['\n  query SourceMetadata($sourceId: ID!) {\n    externalDataSource(pk: $sourceId) {\n      fieldDefinitions {\n        externalId\n        value\n        label\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation WebhookRefresh($ID: String!) {\n    refreshWebhooks(externalDataSourceId: $ID) {\n      id\n      hasWebhooks\n      automatedWebhooks\n      webhookHealthcheck\n    }\n  }\n'
): (typeof documents)['\n  mutation WebhookRefresh($ID: String!) {\n    refreshWebhooks(externalDataSourceId: $ID) {\n      id\n      hasWebhooks\n      automatedWebhooks\n      webhookHealthcheck\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  fragment DataSourceCard on ExternalDataSource {\n    id\n    name\n    dataType\n    crmType\n    automatedWebhooks\n    autoImportEnabled\n    autoUpdateEnabled\n    updateMapping {\n      source\n      sourcePath\n      destinationColumn\n    }\n    jobs(pagination: { limit: 10 }) {\n      lastEventAt\n      status\n    }\n    sharingPermissions {\n      id\n      organisation {\n        id\n        name\n      }\n    }\n  }\n'
): (typeof documents)['\n  fragment DataSourceCard on ExternalDataSource {\n    id\n    name\n    dataType\n    crmType\n    automatedWebhooks\n    autoImportEnabled\n    autoUpdateEnabled\n    updateMapping {\n      source\n      sourcePath\n      destinationColumn\n    }\n    jobs(pagination: { limit: 10 }) {\n      lastEventAt\n      status\n    }\n    sharingPermissions {\n      id\n      organisation {\n        id\n        name\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query ExternalDataSourceExternalDataSourceCard($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      ...DataSourceCard\n    }\n  }\n  \n'
): (typeof documents)['\n  query ExternalDataSourceExternalDataSourceCard($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      ...DataSourceCard\n    }\n  }\n  \n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation EnableWebhook($ID: String!, $webhookType: WebhookType!) {\n    enableWebhook(externalDataSourceId: $ID, webhookType: $webhookType) {\n      id\n      autoImportEnabled\n      autoUpdateEnabled\n      hasWebhooks\n      automatedWebhooks\n      webhookHealthcheck\n      name\n    }\n  }\n'
): (typeof documents)['\n  mutation EnableWebhook($ID: String!, $webhookType: WebhookType!) {\n    enableWebhook(externalDataSourceId: $ID, webhookType: $webhookType) {\n      id\n      autoImportEnabled\n      autoUpdateEnabled\n      hasWebhooks\n      automatedWebhooks\n      webhookHealthcheck\n      name\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation DisableWebhook($ID: String!, $webhookType: WebhookType!) {\n    disableWebhook(externalDataSourceId: $ID, webhookType: $webhookType) {\n      id\n      autoImportEnabled\n      autoUpdateEnabled\n      hasWebhooks\n      automatedWebhooks\n      webhookHealthcheck\n      name\n    }\n  }\n'
): (typeof documents)['\n  mutation DisableWebhook($ID: String!, $webhookType: WebhookType!) {\n    disableWebhook(externalDataSourceId: $ID, webhookType: $webhookType) {\n      id\n      autoImportEnabled\n      autoUpdateEnabled\n      hasWebhooks\n      automatedWebhooks\n      webhookHealthcheck\n      name\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation TriggerFullUpdate($externalDataSourceId: String!) {\n    triggerUpdate(externalDataSourceId: $externalDataSourceId) {\n      id\n      externalDataSource {\n        jobs(pagination: { limit: 10 }) {\n          status\n          id\n          taskName\n          args\n          lastEventAt\n        }\n        id\n        name\n        crmType\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation TriggerFullUpdate($externalDataSourceId: String!) {\n    triggerUpdate(externalDataSourceId: $externalDataSourceId) {\n      id\n      externalDataSource {\n        jobs(pagination: { limit: 10 }) {\n          status\n          id\n          taskName\n          args\n          lastEventAt\n        }\n        id\n        name\n        crmType\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetOrganisations {\n    myOrganisations {\n      id\n      name\n    }\n  }\n'
): (typeof documents)['\n  query GetOrganisations {\n    myOrganisations {\n      id\n      name\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query EnrichmentLayers($organisationPk: String!) {\n    mappingSources(organisationPk: $organisationPk) {\n      slug\n      name\n      author\n      description\n      descriptionUrl\n      sourcePaths {\n        label\n        value\n        description\n      }\n      # For custom data sources, get some useful data\n      externalDataSource {\n        id\n        name\n        dataType\n        crmType\n        organisation {\n          id\n          name\n        }\n      }\n      builtin\n    }\n  }\n'
): (typeof documents)['\n  query EnrichmentLayers($organisationPk: String!) {\n    mappingSources(organisationPk: $organisationPk) {\n      slug\n      name\n      author\n      description\n      descriptionUrl\n      sourcePaths {\n        label\n        value\n        description\n      }\n      # For custom data sources, get some useful data\n      externalDataSource {\n        id\n        name\n        dataType\n        crmType\n        organisation {\n          id\n          name\n        }\n      }\n      builtin\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query MyOrgs {\n    myOrganisations {\n      id\n      name\n      slug\n    }\n  }\n'
): (typeof documents)['\n  query MyOrgs {\n    myOrganisations {\n      id\n      name\n      slug\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query UserData {\n    me {\n      id\n      email\n      username\n    }\n    publicUser {\n      firstName\n      lastName\n    }\n  }\n'
): (typeof documents)['\n  query UserData {\n    me {\n      id\n      email\n      username\n    }\n    publicUser {\n      firstName\n      lastName\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n        mutation PublishPage($pageId: String!, $input: HubPageInput!) {\n          updatePage(pageId: $pageId, input: $input) {\n            id\n            # Refresh cache\n            title\n            slug\n            puckJsonContent\n          }\n        }\n      '
): (typeof documents)['\n        mutation PublishPage($pageId: String!, $input: HubPageInput!) {\n          updatePage(pageId: $pageId, input: $input) {\n            id\n            # Refresh cache\n            title\n            slug\n            puckJsonContent\n          }\n        }\n      ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n        mutation CreateChildPage($parentId: String!, $title: String!) {\n          createChildPage(parentId: $parentId, title: $title) {\n            id\n          }\n        }\n      '
): (typeof documents)['\n        mutation CreateChildPage($parentId: String!, $title: String!) {\n          createChildPage(parentId: $parentId, title: $title) {\n            id\n          }\n        }\n      ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n        mutation DeletePage($pageId: String!) {\n          deletePage(pageId: $pageId)\n        }\n      '
): (typeof documents)['\n        mutation DeletePage($pageId: String!) {\n          deletePage(pageId: $pageId)\n        }\n      ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetHubPages($hubId: ID!) {\n    hubHomepage(pk: $hubId) {\n      hostname\n      descendants(inclusive: true) {\n        id\n        title\n        path\n        slug\n        modelName\n        ancestors(inclusive: true) {\n          id\n          title\n          path\n          slug\n          modelName\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetHubPages($hubId: ID!) {\n    hubHomepage(pk: $hubId) {\n      hostname\n      descendants(inclusive: true) {\n        id\n        title\n        path\n        slug\n        modelName\n        ancestors(inclusive: true) {\n          id\n          title\n          path\n          slug\n          modelName\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetPageEditorData($pageId: ID!) {\n    hubPage(pk: $pageId) {\n      id\n      title\n      path\n      slug\n      puckJsonContent\n      modelName\n      liveUrl\n      # For breadcrumbs\n      ancestors(inclusive: true) {\n        id\n        title\n        path\n        slug\n        modelName\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetPageEditorData($pageId: ID!) {\n    hubPage(pk: $pageId) {\n      id\n      title\n      path\n      slug\n      puckJsonContent\n      modelName\n      liveUrl\n      # For breadcrumbs\n      ancestors(inclusive: true) {\n        id\n        title\n        path\n        slug\n        modelName\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetHubContext($hostname: String!) {\n    hubByHostname(hostname: $hostname) {\n      id\n      customCss\n      primaryColour\n      secondaryColour\n    }\n  }\n'
): (typeof documents)['\n  query GetHubContext($hostname: String!) {\n    hubByHostname(hostname: $hostname) {\n      id\n      customCss\n      primaryColour\n      secondaryColour\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n              query GetEventSources {\n                externalDataSources(filters: { dataType: EVENT }) {\n                  name\n                  id\n                  eventCount: importedDataCount\n                  # For custom filtering\n                  fieldDefinitions {\n                    label\n                    value\n                  }\n                }\n              }\n            '
): (typeof documents)['\n              query GetEventSources {\n                externalDataSources(filters: { dataType: EVENT }) {\n                  name\n                  id\n                  eventCount: importedDataCount\n                  # For custom filtering\n                  fieldDefinitions {\n                    label\n                    value\n                  }\n                }\n              }\n            ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n      query GetEventList($sourceId: String!) {\n        genericDataByExternalDataSource(externalDataSourceId: $sourceId) {\n          id\n          title\n          description\n          startTime\n          endTime\n          publicUrl\n          json\n        }\n      }\n    '
): (typeof documents)['\n      query GetEventList($sourceId: String!) {\n        genericDataByExternalDataSource(externalDataSourceId: $sourceId) {\n          id\n          title\n          description\n          startTime\n          endTime\n          publicUrl\n          json\n        }\n      }\n    ']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetHubHomepageJson($hostname: String!) {\n    hubPageByPath(hostname: $hostname) {\n      puckJsonContent\n    }\n  }\n'
): (typeof documents)['\n  query GetHubHomepageJson($hostname: String!) {\n    hubPageByPath(hostname: $hostname) {\n      puckJsonContent\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query HubListDataSources($currentOrganisationId: ID!) {\n    myOrganisations(filters: { id: $currentOrganisationId }) {\n      id\n      externalDataSources {\n        id\n        name\n        dataType\n      }\n    }\n  }\n'
): (typeof documents)['\n  query HubListDataSources($currentOrganisationId: ID!) {\n    myOrganisations(filters: { id: $currentOrganisationId }) {\n      id\n      externalDataSources {\n        id\n        name\n        dataType\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation AddMember($externalDataSourceId: String!, $email: String!, $postcode: String!, $customFields: JSON!, $tags: [String!]!) {\n    addMember(externalDataSourceId: $externalDataSourceId, email: $email, postcode: $postcode, customFields: $customFields, tags: $tags)\n  }\n'
): (typeof documents)['\n  mutation AddMember($externalDataSourceId: String!, $email: String!, $postcode: String!, $customFields: JSON!, $tags: [String!]!) {\n    addMember(externalDataSourceId: $externalDataSourceId, email: $email, postcode: $postcode, customFields: $customFields, tags: $tags)\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  mutation UpdateExternalDataSource($input: ExternalDataSourceInput!) {\n    updateExternalDataSource(input: $input) {\n      id\n      name\n      geographyColumn\n      geographyColumnType\n      geocodingConfig\n      usesValidGeocodingConfig\n      postcodeField\n      firstNameField\n      lastNameField\n      emailField\n      phoneField\n      addressField\n      canDisplayPointField\n      autoImportEnabled\n      autoUpdateEnabled\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation UpdateExternalDataSource($input: ExternalDataSourceInput!) {\n    updateExternalDataSource(input: $input) {\n      id\n      name\n      geographyColumn\n      geographyColumnType\n      geocodingConfig\n      usesValidGeocodingConfig\n      postcodeField\n      firstNameField\n      lastNameField\n      emailField\n      phoneField\n      addressField\n      canDisplayPointField\n      autoImportEnabled\n      autoUpdateEnabled\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query RecordGeometry($id: String!) {\n    import: importedDataGeojsonPoint(genericDataId: $id) {\n      id\n      geometry {\n        type\n        coordinates\n      }\n    }\n  }\n'
): (typeof documents)['\n  query RecordGeometry($id: String!) {\n    import: importedDataGeojsonPoint(genericDataId: $id) {\n      id\n      geometry {\n        type\n        coordinates\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query AreaGeometry($gss: String!) {\n    area(gss: $gss) {\n      id\n      fitBounds\n    }\n  }\n'
): (typeof documents)['\n  query AreaGeometry($gss: String!) {\n    area(gss: $gss) {\n      id\n      fitBounds\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query PublicUser {\n    publicUser {\n      id\n      username\n      email\n    }\n  }\n'
): (typeof documents)['\n  query PublicUser {\n    publicUser {\n      id\n      username\n      email\n    }\n  }\n']

export function gql(source: string) {
  return (documents as any)[source] ?? {}
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never
