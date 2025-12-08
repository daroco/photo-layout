// Staging environment parameters
using '../main.bicep'

param environment = 'staging'
param enableCdn = true
param tags = {
  Application: 'PhotoLayoutPlanner'
  ManagedBy: 'Bicep'
  Environment: 'Staging'
}
