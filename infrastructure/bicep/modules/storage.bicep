// Storage Account module for static website hosting
@description('Storage account name')
param storageAccountName string

@description('Location for the storage account')
param location string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

// Storage Account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: union(tags, {
    Environment: environment
  })
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: true
    allowSharedKeyAccess: true
    publicNetworkAccess: 'Enabled'
  }
}

// Blob Service
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: [
        {
          allowedOrigins: [
            '*'
          ]
          allowedMethods: [
            'GET'
            'HEAD'
            'OPTIONS'
          ]
          maxAgeInSeconds: 3600
          exposedHeaders: [
            '*'
          ]
          allowedHeaders: [
            '*'
          ]
        }
      ]
    }
  }
}

// Web container for static website
resource webContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: '$web'
  properties: {
    publicAccess: 'Blob'
  }
}

// Outputs
output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id
// Static website URL will be available after enabling static website hosting via CLI
// Format: https://<account-name>.<zone>.web.core.windows.net/
output staticWebsiteUrl string = 'https://${storageAccount.name}.z13.web.${az.environment().suffixes.storage}/'
output staticWebsiteHostName string = '${storageAccount.name}.z13.web.${az.environment().suffixes.storage}'
output primaryEndpoint string = storageAccount.properties.primaryEndpoints.blob
