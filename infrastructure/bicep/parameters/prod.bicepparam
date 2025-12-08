// Production environment parameters
using '../main-staticwebapp.bicep'

param environment = 'prod'
param sku = 'Standard'
param tags = {
  Application: 'PhotoLayoutPlanner'
  ManagedBy: 'Bicep'
  Environment: 'Production'
}
