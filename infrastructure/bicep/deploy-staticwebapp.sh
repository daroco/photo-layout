#!/bin/bash

# Deployment script for Photo Layout Planner to Azure Static Web Apps
# Usage: ./deploy-staticwebapp.sh <environment> <resource-group> <location>
# Example: ./deploy-staticwebapp.sh dev photo-layout-rg eastus2

set -e

ENVIRONMENT=$1
RESOURCE_GROUP=$2
LOCATION=$3

if [ -z "$ENVIRONMENT" ] || [ -z "$RESOURCE_GROUP" ] || [ -z "$LOCATION" ]; then
    echo "Usage: ./deploy-staticwebapp.sh <environment> <resource-group> <location>"
    echo "Example: ./deploy-staticwebapp.sh dev photo-layout-rg eastus2"
    exit 1
fi

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo "Error: Environment must be dev, staging, or prod"
    exit 1
fi

echo "================================================"
echo "Photo Layout Planner - Azure Static Web Apps Deployment"
echo "================================================"
echo "Environment: $ENVIRONMENT"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "================================================"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed. Please install it first."
    exit 1
fi

# Check if logged in to Azure
echo "Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Create resource group if it doesn't exist
echo "Creating resource group (if it doesn't exist)..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output table

# Deploy Bicep template
echo "Deploying infrastructure..."
DEPLOYMENT_NAME="photolayout-$(date +%Y%m%d-%H%M%S)"

az deployment group create \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --template-file main-staticwebapp.bicep \
    --parameters "parameters/${ENVIRONMENT}.bicepparam" \
    --output table

# Get deployment outputs
echo "Retrieving deployment outputs..."
STATIC_WEB_APP_NAME=$(az deployment group show \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.outputs.staticWebAppName.value \
    --output tsv)

STATIC_WEB_APP_URL=$(az deployment group show \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.outputs.staticWebAppUrl.value \
    --output tsv)

# Get deployment token
echo "Retrieving deployment token..."
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" \
    --output tsv)

# Deploy website files using SWA CLI or manual upload
echo "Deploying website files..."
cd ../..

# Check if SWA CLI is installed
if command -v swa &> /dev/null; then
    echo "Using Static Web Apps CLI for deployment..."
    swa deploy \
        --app-location . \
        --output-location . \
        --deployment-token "$DEPLOYMENT_TOKEN" \
        --env production
else
    echo "Static Web Apps CLI not found. Installing temporarily..."
    echo "Note: For faster deployments, install SWA CLI globally: npm install -g @azure/static-web-apps-cli"
    
    # Use Azure CLI to upload files directly
    echo "Uploading files using Azure CLI..."
    
    # Create a zip of the website files
    zip -r /tmp/website.zip index.html styles.css app.js
    
    # Upload the zip file
    az staticwebapp environment create \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --source /tmp/website.zip
    
    rm /tmp/website.zip
fi

echo "================================================"
echo "Deployment completed successfully!"
echo "================================================"
echo "Static Web App Name: $STATIC_WEB_APP_NAME"
echo "Website URL: $STATIC_WEB_APP_URL"
echo "================================================"
echo ""
echo "Access your application at: $STATIC_WEB_APP_URL"
echo ""
echo "Note: It may take a few minutes for the deployment to propagate."
echo ""
