// Main Bicep template for Photo Layout Planner deployment to Azure
@description('The name of the storage account (must be globally unique)')
@minLength(3)
@maxLength(24)
param storageAccountName string = 'photolayout${uniqueString(resourceGroup().id)}'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Environment name (e.g., dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'dev'

@description('Enable CDN for better performance')
param enableCdn bool = true

@description('Tags to apply to all resources')
param tags object = {
  Application: 'PhotoLayoutPlanner'
  ManagedBy: 'Bicep'
}

// Storage Account for static website hosting
module storage 'modules/storage.bicep' = {
  name: 'storage-deployment'
  params: {
    storageAccountName: storageAccountName
    location: location
    environment: environment
    tags: tags
  }
}

// CDN Profile and Endpoint (optional)
module cdn 'modules/cdn.bicep' = if (enableCdn) {
  name: 'cdn-deployment'
  params: {
    cdnProfileName: 'cdn-${storageAccountName}'
    cdnEndpointName: 'photolayout-${environment}'
    location: location
    originHostName: storage.outputs.staticWebsiteHostName
    tags: tags
  }
}

// Outputs
output storageAccountName string = storage.outputs.storageAccountName
output staticWebsiteUrl string = storage.outputs.staticWebsiteUrl
output cdnEndpointUrl string = enableCdn && cdn != null ? cdn!.outputs.cdnEndpointUrl : ''
output primaryEndpoint string = enableCdn && cdn != null ? cdn!.outputs.cdnEndpointUrl : storage.outputs.staticWebsiteUrl
