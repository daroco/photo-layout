// CDN module for content delivery
@description('CDN Profile name')
param cdnProfileName string

@description('CDN Endpoint name')
param cdnEndpointName string

@description('Location for CDN resources')
param location string

@description('Origin hostname (storage static website)')
param originHostName string

@description('Resource tags')
param tags object

// CDN Profile
resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: cdnProfileName
  location: location
  tags: tags
  sku: {
    name: 'Standard_Microsoft'
  }
  properties: {}
}

// CDN Endpoint
resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = {
  parent: cdnProfile
  name: cdnEndpointName
  location: location
  tags: tags
  properties: {
    originHostHeader: originHostName
    isHttpAllowed: false
    isHttpsAllowed: true
    queryStringCachingBehavior: 'IgnoreQueryString'
    contentTypesToCompress: [
      'text/plain'
      'text/html'
      'text/css'
      'application/javascript'
      'application/json'
      'image/svg+xml'
    ]
    isCompressionEnabled: true
    origins: [
      {
        name: 'origin1'
        properties: {
          hostName: originHostName
          httpPort: 80
          httpsPort: 443
          originHostHeader: originHostName
        }
      }
    ]
    deliveryPolicy: {
      rules: [
        {
          name: 'Global'
          order: 0
          actions: [
            {
              name: 'CacheExpiration'
              parameters: {
                cacheBehavior: 'SetIfMissing'
                cacheType: 'All'
                cacheDuration: '7.00:00:00'
                typeName: 'DeliveryRuleCacheExpirationActionParameters'
              }
            }
          ]
        }
      ]
    }
  }
}

// Outputs
output cdnProfileName string = cdnProfile.name
output cdnEndpointName string = cdnEndpoint.name
output cdnEndpointUrl string = 'https://${cdnEndpoint.properties.hostName}'
