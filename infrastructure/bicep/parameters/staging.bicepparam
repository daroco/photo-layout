// Staging environment parameters
using '../main-staticwebapp.bicep'

param environment = 'staging'
param sku = 'Standard'
param tags = {
  Application: 'PhotoLayoutPlanner'
  ManagedBy: 'Bicep'
  Environment: 'Staging'
}
