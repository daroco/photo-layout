# PowerShell deployment script for Photo Layout Planner to Azure
# Usage: .\deploy.ps1 -Environment <env> -ResourceGroup <rg> -Location <location>
# Example: .\deploy.ps1 -Environment dev -ResourceGroup photo-layout-rg -Location eastus

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,
    
    [Parameter(Mandatory=$true)]
    [string]$Location
)

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Photo Layout Planner - Azure Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment"
Write-Host "Resource Group: $ResourceGroup"
Write-Host "Location: $Location"
Write-Host "================================================" -ForegroundColor Cyan

# Check if Azure CLI is installed
try {
    az --version | Out-Null
} catch {
    Write-Host "Error: Azure CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if logged in to Azure
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
try {
    az account show | Out-Null
} catch {
    Write-Host "Not logged in to Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

# Create resource group if it doesn't exist
Write-Host "Creating resource group (if it doesn't exist)..." -ForegroundColor Yellow
az group create `
    --name $ResourceGroup `
    --location $Location `
    --output table

# Deploy Bicep template
Write-Host "Deploying infrastructure..." -ForegroundColor Yellow
$DeploymentName = "photolayout-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

az deployment group create `
    --name $DeploymentName `
    --resource-group $ResourceGroup `
    --template-file main.bicep `
    --parameters "parameters/$Environment.bicepparam" `
    --output table

# Get deployment outputs
Write-Host "Retrieving deployment outputs..." -ForegroundColor Yellow
$StorageAccount = az deployment group show `
    --name $DeploymentName `
    --resource-group $ResourceGroup `
    --query properties.outputs.storageAccountName.value `
    --output tsv

$StaticWebsiteUrl = az deployment group show `
    --name $DeploymentName `
    --resource-group $ResourceGroup `
    --query properties.outputs.staticWebsiteUrl.value `
    --output tsv

$PrimaryEndpoint = az deployment group show `
    --name $DeploymentName `
    --resource-group $ResourceGroup `
    --query properties.outputs.primaryEndpoint.value `
    --output tsv

# Enable static website hosting
Write-Host "Enabling static website hosting..." -ForegroundColor Yellow
az storage blob service-properties update `
    --account-name $StorageAccount `
    --static-website `
    --404-document "index.html" `
    --index-document "index.html"

# Upload website files
Write-Host "Uploading website files..." -ForegroundColor Yellow
Push-Location ../..

# Upload HTML files
Write-Host "Uploading HTML files..." -ForegroundColor Yellow
az storage blob upload-batch `
    --account-name $StorageAccount `
    --destination '$web' `
    --source . `
    --pattern "*.html" `
    --overwrite true

# Upload CSS files
Write-Host "Uploading CSS files..." -ForegroundColor Yellow
az storage blob upload-batch `
    --account-name $StorageAccount `
    --destination '$web' `
    --source . `
    --pattern "*.css" `
    --overwrite true

# Upload JavaScript files
Write-Host "Uploading JavaScript files..." -ForegroundColor Yellow
az storage blob upload-batch `
    --account-name $StorageAccount `
    --destination '$web' `
    --source . `
    --pattern "*.js" `
    --overwrite true

Pop-Location

Write-Host "================================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "Storage Account: $StorageAccount"
Write-Host "Website URL: $StaticWebsiteUrl"
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application at: $StaticWebsiteUrl" -ForegroundColor Cyan
Write-Host ""
