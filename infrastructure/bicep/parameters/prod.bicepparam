// Production environment parameters
using '../main.bicep'

param environment = 'prod'
param enableCdn = true
param tags = {
  Application: 'PhotoLayoutPlanner'
  ManagedBy: 'Bicep'
  Environment: 'Production'
}
