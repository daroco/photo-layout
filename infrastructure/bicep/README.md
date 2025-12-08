# Azure Infrastructure Deployment

This directory contains Bicep templates for deploying the Photo Layout Planner app to Azure.

## Architecture

The application is deployed as a static website on Azure with the following components:

- **Azure Storage Account**: Hosts the static website files (HTML, CSS, JS)
- **Static Website Hosting**: Enabled on the storage account for direct web access
- **Azure CDN** (optional): Provides global content delivery and caching for production

## Prerequisites

1. **Azure CLI**: Install from https://docs.microsoft.com/cli/azure/install-azure-cli
2. **Azure Subscription**: Active Azure subscription
3. **Permissions**: Contributor access to create resources

## Project Structure

```
infrastructure/bicep/
├── main.bicep                  # Main orchestration template
├── modules/
│   ├── storage.bicep          # Storage account module
│   └── cdn.bicep              # CDN module
├── parameters/
│   ├── dev.bicepparam         # Development parameters
│   ├── staging.bicepparam     # Staging parameters
│   └── prod.bicepparam        # Production parameters
├── deploy.sh                  # Bash deployment script
├── deploy.ps1                 # PowerShell deployment script
└── README.md                  # This file
```

## Quick Start

### Option 1: Using Deployment Scripts (Recommended)

#### Bash (Linux/macOS)

```bash
# Navigate to the bicep directory
cd infrastructure/bicep

# Deploy to development
./deploy.sh dev photo-layout-dev-rg eastus

# Deploy to production
./deploy.sh prod photo-layout-prod-rg eastus
```

#### PowerShell (Windows)

```powershell
# Navigate to the bicep directory
cd infrastructure/bicep

# Deploy to development
.\deploy.ps1 -Environment dev -ResourceGroup photo-layout-dev-rg -Location eastus

# Deploy to production
.\deploy.ps1 -Environment prod -ResourceGroup photo-layout-prod-rg -Location eastus
```

### Option 2: Manual Deployment with Azure CLI

```bash
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account set --subscription "Your-Subscription-Name"

# Create a resource group
az group create \
  --name photo-layout-rg \
  --location eastus

# Deploy the Bicep template
az deployment group create \
  --name photolayout-deployment \
  --resource-group photo-layout-rg \
  --template-file main.bicep \
  --parameters parameters/dev.bicepparam

# Get the storage account name from outputs
STORAGE_ACCOUNT=$(az deployment group show \
  --name photolayout-deployment \
  --resource-group photo-layout-rg \
  --query properties.outputs.storageAccountName.value \
  --output tsv)

# Enable static website hosting
az storage blob service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --static-website \
  --404-document "index.html" \
  --index-document "index.html"

# Upload the website files
cd ../..
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --destination '$web' \
  --source . \
  --pattern "*.html" \
  --pattern "*.css" \
  --pattern "*.js" \
  --overwrite true

# Get the website URL
az storage account show \
  --name $STORAGE_ACCOUNT \
  --resource-group photo-layout-rg \
  --query "primaryEndpoints.web" \
  --output tsv
```

## Parameters

### Environment Parameters

Each environment has its own parameter file with specific configurations:

- **dev**: Development environment without CDN
- **staging**: Staging environment with CDN
- **prod**: Production environment with CDN

### Customizable Parameters

You can customize the deployment by modifying the parameter files or passing parameters directly:

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `storageAccountName` | Storage account name (globally unique) | Auto-generated | No |
| `location` | Azure region | Resource group location | No |
| `environment` | Environment name (dev/staging/prod) | dev | Yes |
| `enableCdn` | Enable CDN for content delivery | Varies by env | No |
| `tags` | Resource tags | See param files | No |

### Custom Deployment Example

```bash
az deployment group create \
  --name custom-deployment \
  --resource-group photo-layout-rg \
  --template-file main.bicep \
  --parameters \
    environment=prod \
    enableCdn=true \
    storageAccountName=myphotolayout123
```

## Outputs

After deployment, the following outputs are available:

- `storageAccountName`: Name of the created storage account
- `staticWebsiteUrl`: Direct URL to the static website
- `cdnEndpointUrl`: CDN endpoint URL (if CDN is enabled)
- `primaryEndpoint`: Primary URL to access the application

### View Outputs

```bash
# View all outputs
az deployment group show \
  --name photolayout-deployment \
  --resource-group photo-layout-rg \
  --query properties.outputs

# View specific output
az deployment group show \
  --name photolayout-deployment \
  --resource-group photo-layout-rg \
  --query properties.outputs.primaryEndpoint.value \
  --output tsv
```

## Updating the Application

To update the deployed application with new changes:

```bash
# Get storage account name
STORAGE_ACCOUNT=<your-storage-account-name>

# Upload updated files
cd ../..
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --destination '$web' \
  --source . \
  --pattern "*.html" \
  --pattern "*.css" \
  --pattern "*.js" \
  --overwrite true

# If using CDN, purge the cache
az cdn endpoint purge \
  --resource-group photo-layout-rg \
  --profile-name <cdn-profile-name> \
  --name <cdn-endpoint-name> \
  --content-paths "/*"
```

## Cost Considerations

### Development Environment
- Storage Account (LRS): ~$0.02/GB/month
- Data egress: First 100GB free, then ~$0.087/GB
- **Estimated**: $1-5/month for low traffic

### Production Environment (with CDN)
- Storage Account (LRS): ~$0.02/GB/month
- CDN (Standard Microsoft): $0.081/GB for first 10TB
- Data egress from storage to CDN: Free
- **Estimated**: $5-50/month depending on traffic

## Security

The deployment includes:

- HTTPS-only traffic enforcement
- TLS 1.2 minimum version
- CORS enabled for web access
- Public blob access for static website hosting

### Custom Domain (Optional)

To use a custom domain:

1. Add CNAME record pointing to your CDN endpoint or storage account
2. Configure custom domain in Azure Portal:
   - For Storage: Storage Account → Static website → Custom domain
   - For CDN: CDN Profile → Endpoint → Custom domains

## Troubleshooting

### Deployment Fails

```bash
# Check deployment status
az deployment group show \
  --name photolayout-deployment \
  --resource-group photo-layout-rg

# View deployment logs
az monitor activity-log list \
  --resource-group photo-layout-rg \
  --max-events 50
```

### Storage Account Name Already Exists

Storage account names must be globally unique. Either:
1. Choose a different name
2. Use the auto-generated name (default behavior)

### 404 Error: "The requested content does not exist"

This error occurs when static website hosting is not enabled on the storage account.

**Solution:**

```bash
# Enable static website hosting manually
az storage blob service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --static-website \
  --404-document "index.html" \
  --index-document "index.html"

# Re-upload the files
cd /path/to/photo-layout
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --destination '$web' \
  --source . \
  --pattern "*.html" \
  --overwrite true

az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --destination '$web' \
  --source . \
  --pattern "*.css" \
  --overwrite true

az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --destination '$web' \
  --source . \
  --pattern "*.js" \
  --overwrite true
```

**Note:** The deployment scripts automatically enable static website hosting and upload files. If you deployed manually, you may need to run these commands.

### Files Not Showing Up

```bash
# Verify files were uploaded
az storage blob list \
  --account-name $STORAGE_ACCOUNT \
  --container-name '$web' \
  --output table

# Check static website is enabled
az storage blob service-properties show \
  --account-name $STORAGE_ACCOUNT
```

## Cleanup

To remove all deployed resources:

```bash
# Delete the entire resource group
az group delete \
  --name photo-layout-rg \
  --yes \
  --no-wait
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy Infrastructure
        run: |
          cd infrastructure/bicep
          ./deploy.sh prod photo-layout-prod-rg eastus
```

## Additional Resources

- [Azure Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure Storage Static Websites](https://docs.microsoft.com/azure/storage/blobs/storage-blob-static-website)
- [Azure CDN Documentation](https://docs.microsoft.com/azure/cdn/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Azure deployment logs
3. Open an issue in the repository
