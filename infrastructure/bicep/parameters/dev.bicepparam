// Development environment parameters
using '../main-staticwebapp.bicep'

param environment = 'dev'
param sku = 'Free'
param tags = {
  Application: 'PhotoLayoutPlanner'
  ManagedBy: 'Bicep'
  Environment: 'Development'
}
