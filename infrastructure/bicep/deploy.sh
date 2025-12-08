#!/bin/bash

# Deployment script for Photo Layout Planner to Azure
# Usage: ./deploy.sh <environment> <resource-group> <location>
# Example: ./deploy.sh dev photo-layout-rg eastus

set -e

# Check if required parameters are provided
if [ $# -lt 3 ]; then
    echo "Usage: $0 <environment> <resource-group> <location>"
    echo "Example: $0 dev photo-layout-rg eastus"
    exit 1
fi

ENVIRONMENT=$1
RESOURCE_GROUP=$2
LOCATION=$3

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo "Error: Environment must be dev, staging, or prod"
    exit 1
fi

echo "================================================"
echo "Photo Layout Planner - Azure Deployment"
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
az account show &> /dev/null || {
    echo "Not logged in to Azure. Please run 'az login' first."
    exit 1
}

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
    --template-file main.bicep \
    --parameters "parameters/${ENVIRONMENT}.bicepparam" \
    --output table

# Get deployment outputs
echo "Retrieving deployment outputs..."
STORAGE_ACCOUNT=$(az deployment group show \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.outputs.storageAccountName.value \
    --output tsv)

STATIC_WEBSITE_URL=$(az deployment group show \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.outputs.staticWebsiteUrl.value \
    --output tsv)

PRIMARY_ENDPOINT=$(az deployment group show \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.outputs.primaryEndpoint.value \
    --output tsv)

# Enable static website hosting
echo "Enabling static website hosting..."
az storage blob service-properties update \
    --account-name "$STORAGE_ACCOUNT" \
    --static-website \
    --404-document "index.html" \
    --index-document "index.html"

# Upload website files
echo "Uploading website files..."
cd ../..

# Upload HTML files
echo "Uploading HTML files..."
az storage blob upload-batch \
    --account-name "$STORAGE_ACCOUNT" \
    --destination '$web' \
    --source . \
    --pattern "*.html" \
    --overwrite true

# Upload CSS files
echo "Uploading CSS files..."
az storage blob upload-batch \
    --account-name "$STORAGE_ACCOUNT" \
    --destination '$web' \
    --source . \
    --pattern "*.css" \
    --overwrite true

# Upload JavaScript files
echo "Uploading JavaScript files..."
az storage blob upload-batch \
    --account-name "$STORAGE_ACCOUNT" \
    --destination '$web' \
    --source . \
    --pattern "*.js" \
    --overwrite true

echo "================================================"
echo "Deployment completed successfully!"
echo "================================================"
echo "Storage Account: $STORAGE_ACCOUNT"
echo "Website URL: $STATIC_WEBSITE_URL"
echo "================================================"
echo ""
echo "Access your application at: $STATIC_WEBSITE_URL"
echo ""
