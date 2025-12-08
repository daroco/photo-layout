// Development environment parameters
using '../main.bicep'

param environment = 'dev'
param enableCdn = false
param tags = {
  Application: 'PhotoLayoutPlanner'
  ManagedBy: 'Bicep'
  Environment: 'Development'
}
