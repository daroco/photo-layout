// Azure App Service deployment for Photo Layout Planner
// Simple static web app hosting using App Service

@description('The environment name (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string

@description('The location for all resources')
param location string = resourceGroup().location

@description('The base name for resources')
param baseName string = 'photolayout'

// Variables
var appServicePlanName = '${baseName}-${environment}-plan'
var appServiceName = '${baseName}-${environment}-app'
var appServiceSku = environment == 'prod' ? 'B1' : 'F1'

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: appServiceSku
    tier: environment == 'prod' ? 'Basic' : 'Free'
  }
  kind: 'linux'
  properties: {
    reserved: true // Required for Linux
  }
}

// App Service
resource appService 'Microsoft.Web/sites@2022-03-01' = {
  name: appServiceName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      appCommandLine: 'npx http-server -p 8080'
      alwaysOn: environment == 'prod' ? true : false
      appSettings: [
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '18-lts'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'false'
        }
      ]
    }
  }
}

// Outputs
output appServiceName string = appService.name
output appServiceUrl string = 'https://${appService.properties.defaultHostName}'
output appServicePlanName string = appServicePlan.name
