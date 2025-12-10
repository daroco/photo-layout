#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Deployment script for Photo Layout Planner to Azure App Service

.DESCRIPTION
    Deploys the Photo Layout Planner application to Azure App Service using Bicep templates

.PARAMETER Environment
    The deployment environment (dev, staging, or prod)

.PARAMETER ResourceGroup
    The Azure resource group name

.PARAMETER Location
    The Azure region/location

.EXAMPLE
    .\deploy-appservice.ps1 -Environment dev -ResourceGroup photo-layout-rg -Location eastus2
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment,
    
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,
    
    [Parameter(Mandatory=$true)]
    [string]$Location
)

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Photo Layout Planner - Azure App Service Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "Location: $Location" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan

# Check if Azure CLI is installed
Write-Host "Checking for Azure CLI..." -ForegroundColor Yellow
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Azure CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if logged in to Azure
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
try {
    az account show 2>$null | Out-Null
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
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$deploymentName = "photolayout-$timestamp"

az deployment group create `
    --name $deploymentName `
    --resource-group $ResourceGroup `
    --template-file main-appservice.bicep `
    --parameters "parameters/$Environment.bicepparam" `
    --output table

# Get deployment outputs
Write-Host "Retrieving deployment outputs..." -ForegroundColor Yellow
$appServiceName = az deployment group show `
    --name $deploymentName `
    --resource-group $ResourceGroup `
    --query properties.outputs.appServiceName.value `
    --output tsv

$appServiceUrl = az deployment group show `
    --name $deploymentName `
    --resource-group $ResourceGroup `
    --query properties.outputs.appServiceUrl.value `
    --output tsv

# Deploy website files
Write-Host "Deploying website files..." -ForegroundColor Yellow
Set-Location -Path (Join-Path $PSScriptRoot "..\..") 

# Create a deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
$deployPath = Join-Path $env:TEMP "photolayout-deploy"
if (Test-Path $deployPath) {
    Remove-Item $deployPath -Recurse -Force
}
New-Item -ItemType Directory -Path $deployPath -Force | Out-Null

# Copy files
Copy-Item index.html, styles.css, app.js -Destination $deployPath

# Create a simple package.json for http-server
@"
{
  "name": "photo-layout-planner",
  "version": "1.0.0",
  "description": "Photo Layout Planner",
  "scripts": {
    "start": "http-server -p 8080"
  },
  "dependencies": {
    "http-server": "^14.1.1"
  }
}
"@ | Out-File -FilePath (Join-Path $deployPath "package.json") -Encoding utf8

# Create .deployment file
@"
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT = true
"@ | Out-File -FilePath (Join-Path $deployPath ".deployment") -Encoding utf8

# Create web.config for proper MIME types
@"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <mimeMap fileExtension=".js" mimeType="application/javascript" />
      <mimeMap fileExtension=".css" mimeType="text/css" />
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
"@ | Out-File -FilePath (Join-Path $deployPath "web.config") -Encoding utf8

# Zip the files
$zipPath = Join-Path $env:TEMP "photolayout.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Write-Host "Creating zip archive..." -ForegroundColor Yellow
Compress-Archive -Path "$deployPath\*" -DestinationPath $zipPath -Force

# Deploy using az webapp deployment
Write-Host "Uploading to App Service..." -ForegroundColor Green
az webapp deployment source config-zip `
    --resource-group $ResourceGroup `
    --name $appServiceName `
    --src $zipPath

# Cleanup
Remove-Item $deployPath -Recurse -Force
Remove-Item $zipPath -Force

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "App Service Name: $appServiceName" -ForegroundColor White
Write-Host "Website URL: $appServiceUrl" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application at: $appServiceUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: It may take a minute for the app to start." -ForegroundColor Yellow
Write-Host ""
