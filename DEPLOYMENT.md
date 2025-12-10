# Azure Static Web App Deployment

## Manual Deployment (If Needed)

The PowerShell script `deploy-staticwebapp.ps1` creates the Azure infrastructure but may have issues with the SWA CLI deployment step.

## Recommended: GitHub Actions Deployment

The easiest and most reliable way to deploy is using GitHub Actions:

### Setup Steps:

1. **Add the deployment token to GitHub Secrets:**
   - Go to your repository on GitHub
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: `aabbc91175e089ed344538dbd4157837e1280ab7c15a861fbdcb60a114ee67eb03-4c31a789-2404-473c-b57b-503bdaf063ba0102926099eca110`

2. **The GitHub Actions workflow is already configured** in `.github/workflows/azure-static-web-apps.yml`

3. **Deploy by pushing to main branch:**
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

4. **Or trigger manually:**
   - Go to Actions tab in GitHub
   - Select "Azure Static Web Apps CI/CD" workflow
   - Click "Run workflow"

GitHub Actions will automatically deploy your app on every push to main.

## Your Deployment Details

- **Static Web App Name:** `photolayout-dev-vbgq53tail6b6`
- **Website URL:** https://witty-tree-099eca110.3.azurestaticapps.net
- **Resource Group:** `photo-layout-v2-rg`
- **Environment:** `dev`

