# Azure Static Web Apps Deployment

This directory contains Bicep templates for deploying the Photo Layout Planner app to **Azure Static Web Apps** - the recommended approach for this application.

## Why Azure Static Web Apps?

Azure Static Web Apps is the **better choice** for this application compared to Storage Account + CDN:

### Advantages of Static Web Apps:
✅ **Simpler deployment** - No need to manually enable static website hosting  
✅ **Built-in CI/CD** - Automatic deployments from Git repositories  
✅ **Free tier** - Generous free tier perfect for development and small projects  
✅ **Custom domains** - Easy SSL certificate management  
✅ **Global CDN** - Automatically distributed worldwide  
✅ **Staging environments** - Built-in preview deployments  
✅ **No 404 errors** - Proper static site hosting from the start  
✅ **Zero configuration** - Works out of the box  

### Storage Account approach issues:
❌ Requires manual static website enabling (causing 404 errors)  
❌ Multiple upload commands needed for different file types  
❌ Zone-specific URLs that vary by region  
❌ More complex setup and troubleshooting  
❌ CDN is optional extra (costs more)  

## Architecture

- **Azure Static Web Apps**: Modern serverless hosting for static content
- **Free Tier**: 100GB bandwidth/month, custom domains, SSL included
- **Standard Tier**: Unlimited bandwidth, staging environments, custom authentication

## Prerequisites

1. **Azure CLI**: Install from https://docs.microsoft.com/cli/azure/install-azure-cli
2. **Azure Subscription**: Active Azure subscription
3. **Permissions**: Contributor access to create resources
4. **(Optional) SWA CLI**: `npm install -g @azure/static-web-apps-cli` for faster deployments

## Project Structure

```
infrastructure/bicep/
├── main-staticwebapp.bicep       # Main template for Static Web Apps
├── modules/
│   └── staticwebapp.bicep        # Static Web Apps module
├── parameters/
│   ├── dev.bicepparam            # Development (Free tier)
│   ├── staging.bicepparam        # Staging (Standard tier)
│   └── prod.bicepparam           # Production (Standard tier)
├── deploy-staticwebapp.sh        # Deployment script
└── README-STATICWEBAPP.md        # This file
```

## Quick Start

### Deploy to Azure Static Web Apps

```bash
cd infrastructure/bicep
./deploy-staticwebapp.sh dev photo-layout-rg eastus2
```

That's it! No manual configuration needed.

## Deployment Process

The deployment script will:

1. ✅ Create resource group (if needed)
2. ✅ Deploy Azure Static Web App
3. ✅ Get deployment token
4. ✅ Upload website files
5. ✅ Display the website URL

## Parameters

| Parameter | Description | Default | Values |
|-----------|-------------|---------|--------|
| `environment` | Environment name | - | dev, staging, prod |
| `sku` | Static Web Apps tier | Free (dev), Standard (staging/prod) | Free, Standard |
| `location` | Azure region | Resource group location | eastus2, westus2, etc. |

## Cost Comparison

### Static Web Apps (Recommended)
- **Free Tier**: $0/month
  - 100GB bandwidth/month
  - Custom domains with SSL
  - Perfect for development and small projects
- **Standard Tier**: ~$9/month
  - Unlimited bandwidth
  - Staging environments
  - SLA and support

### Storage Account + CDN (Old Approach)
- **Development**: ~$1-5/month (Storage only, limited features)
- **Production**: ~$5-50/month (Storage + CDN, complex setup)

**Savings**: Static Web Apps Free tier = $0 vs Storage ~$1-5/month  
**Better Value**: Static Web Apps Standard = $9 vs Storage+CDN ~$5-50/month

## Features Comparison

| Feature | Static Web Apps | Storage Account |
|---------|----------------|-----------------|
| Setup Complexity | ⭐ Simple | ⭐⭐⭐ Complex |
| Deployment | Automatic | Manual commands |
| CDN | ✅ Included | ❌ Separate resource |
| SSL/Custom Domain | ✅ Built-in | ⚠️ Manual setup |
| Staging | ✅ Built-in | ❌ Not available |
| 404 Issues | ✅ None | ❌ Common problem |
| Free Tier | ✅ Generous | ⚠️ Limited |

## Deployment Options

### Option 1: Using the Deploy Script (Recommended)

```bash
cd infrastructure/bicep
./deploy-staticwebapp.sh prod photo-layout-prod-rg eastus2
```

### Option 2: Manual with Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name photo-layout-rg \
  --location eastus2

# Deploy template
az deployment group create \
  --name photolayout-deployment \
  --resource-group photo-layout-rg \
  --template-file main-staticwebapp.bicep \
  --parameters parameters/dev.bicepparam

# Get the Static Web App name and URL
STATIC_WEB_APP_NAME=$(az deployment group show \
  --name photolayout-deployment \
  --resource-group photo-layout-rg \
  --query properties.outputs.staticWebAppName.value \
  --output tsv)

STATIC_WEB_APP_URL=$(az deployment group show \
  --name photolayout-deployment \
  --resource-group photo-layout-rg \
  --query properties.outputs.staticWebAppUrl.value \
  --output tsv)

echo "Your app: $STATIC_WEB_APP_URL"
```

### Option 3: Deploy Files with SWA CLI

```bash
# Install SWA CLI (if not already installed)
npm install -g @azure/static-web-apps-cli

# Get deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name $STATIC_WEB_APP_NAME \
  --resource-group photo-layout-rg \
  --query "properties.apiKey" \
  --output tsv)

# Deploy files
cd /path/to/photo-layout
swa deploy \
  --app-location . \
  --output-location . \
  --deployment-token "$DEPLOYMENT_TOKEN" \
  --env production
```

## Updating the Application

To update your deployed application:

```bash
# Option 1: Use the deploy script again
cd infrastructure/bicep
./deploy-staticwebapp.sh prod photo-layout-prod-rg eastus2

# Option 2: Use SWA CLI directly (faster)
cd /path/to/photo-layout
swa deploy --deployment-token $DEPLOYMENT_TOKEN --env production
```

## Custom Domain

Add a custom domain easily:

```bash
az staticwebapp hostname set \
  --name $STATIC_WEB_APP_NAME \
  --resource-group photo-layout-rg \
  --hostname www.yourdomain.com
```

SSL certificate is automatically provisioned!

## Troubleshooting

### Deployment Token Issues

```bash
# Get a new deployment token
az staticwebapp secrets list \
  --name $STATIC_WEB_APP_NAME \
  --resource-group photo-layout-rg \
  --query "properties.apiKey" \
  --output tsv
```

### Files Not Updating

Static Web Apps caches content. Wait 5-10 minutes or force refresh (Ctrl+Shift+R).

### SWA CLI Not Found

```bash
# Install globally
npm install -g @azure/static-web-apps-cli

# Or use without installing
npx @azure/static-web-apps-cli deploy --deployment-token $TOKEN
```

## Cleanup

```bash
# Delete the entire resource group
az group delete \
  --name photo-layout-rg \
  --yes
```

## GitHub Actions Integration

Azure Static Web Apps automatically creates a GitHub Actions workflow. You can also use our custom workflow in `.github/workflows/azure-staticwebapp.yml`.

## Migration from Storage Account

If you previously deployed using Storage Account:

1. Deploy using Static Web Apps (this approach)
2. Update DNS to point to new Static Web App URL
3. Delete old Storage Account and CDN resources
4. Save costs and reduce complexity!

## Additional Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [SWA CLI Documentation](https://azure.github.io/static-web-apps-cli/)
- [Pricing Details](https://azure.microsoft.com/pricing/details/app-service/static/)

## Support

For issues:
1. Check troubleshooting section above
2. Review Azure Static Web Apps logs in Azure Portal
3. Open an issue in the repository
