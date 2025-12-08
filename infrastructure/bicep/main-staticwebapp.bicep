// Main Bicep template for Photo Layout Planner using Azure Static Web Apps
targetScope = 'resourceGroup'

@description('Environment name (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string

@description('Location for resources')
param location string = resourceGroup().location

@description('Static Web App name (leave empty for auto-generated name)')
param staticWebAppName string = 'photolayout-${environment}-${uniqueString(resourceGroup().id)}'

@description('Resource tags')
param tags object = {}

@description('SKU for Static Web App')
@allowed([
  'Free'
  'Standard'
])
param sku string = 'Free'

// Deploy Static Web App
module staticWebApp 'modules/staticwebapp.bicep' = {
  name: 'staticwebapp-deployment'
  params: {
    staticWebAppName: staticWebAppName
    location: location
    environment: environment
    tags: tags
    sku: sku
  }
}

// Outputs
output staticWebAppName string = staticWebApp.outputs.staticWebAppName
output staticWebAppUrl string = staticWebApp.outputs.staticWebAppUrl
output defaultHostname string = staticWebApp.outputs.defaultHostname
