# 📸 Photo Layout Planner

A simple, intuitive web application for planning photo frame layouts on your wall. Take a picture of your blank wall, add virtual photo frames with custom labels, and design your perfect gallery layout.

## Features

- **📷 Wall Photo Upload**: Take a photo of your wall or upload an existing image
- **🖼️ Interactive Frame Management**: Add, move, resize, and customize photo frames
- **🏷️ Custom Labels**: Label each frame (e.g., "Wedding Photos", "Baby Photos", "Vacation")
- **🎨 Customization**: Adjust frame sizes and border colors
- **💾 Save & Load**: Save your layouts and reload them later
- **🔗 Share**: Generate shareable URLs to show others your layout plans
- **📱 Mobile Friendly**: Works on desktop, tablet, and mobile devices

## Getting Started

### Quick Start

Simply open `index.html` in your web browser. No installation or build process required!

### Online Usage

1. **Upload Your Wall Photo**
   - Click "Click to upload or take a photo"
   - Select a photo from your device or take a new one with your camera
   
2. **Add Photo Frames**
   - Click the "+ Add Frame" button to add new frames
   - Drag frames to position them on your wall
   - Click a frame to select it
   - Double-click a frame to quickly edit its label
   
3. **Customize Frames**
   - Use the Frame Properties panel to adjust:
     - Label text
     - Width and height
     - Border color
   - Changes apply automatically
   
4. **Save Your Layout**
   - Click "💾 Save Layout" to save locally
   - Click "🔗 Share" to generate a shareable URL
   - Copy and share the URL with others
   
5. **Reset or Start Over**
   - Click "🔄 Reset" to clear all frames and start fresh

## Technical Details

- **Pure HTML/CSS/JavaScript**: No frameworks or dependencies
- **Canvas-based**: Uses HTML5 Canvas for rendering
- **LocalStorage**: Saves layouts locally in your browser
- **URL Sharing**: Encodes layout data in URL parameters for sharing

## Browser Support

Works in all modern browsers that support:
- HTML5 Canvas
- FileReader API
- LocalStorage
- ES6+ JavaScript

## Deployment to Azure

This application can be easily deployed to Azure as a static website. See the [infrastructure/bicep/README.md](infrastructure/bicep/README.md) for detailed deployment instructions.

### Quick Azure Deployment

```bash
cd infrastructure/bicep
./deploy.sh dev photo-layout-rg eastus
```

Or use the GitHub Actions workflow for automated CI/CD deployment.

## File Structure

```
photo-layout/
├── index.html                  # Main HTML structure
├── styles.css                  # Styling and responsive design
├── app.js                      # Application logic
├── infrastructure/
│   └── bicep/                 # Azure deployment templates
│       ├── main.bicep         # Main infrastructure template
│       ├── modules/           # Bicep modules
│       ├── parameters/        # Environment parameters
│       ├── deploy.sh          # Deployment script (Bash)
│       ├── deploy.ps1         # Deployment script (PowerShell)
│       └── README.md          # Deployment documentation
├── .github/
│   └── workflows/
│       └── azure-deploy.yml   # CI/CD pipeline
└── README.md                  # This file
```

## Tips

- **Drag**: Click and hold to drag frames around
- **Select**: Click once to select a frame
- **Edit**: Double-click for quick label editing
- **Touch**: Full touch support for mobile devices
- **Persist**: Layouts are automatically saved in your browser

## Future Enhancements

Possible future additions:
- Image templates for common frame sizes
- Grid snapping for precise alignment
- Export to PDF or image
- Measurement tools
- Multiple wall photos in one project

## License

Open source - feel free to use and modify as needed.

## Contributing

This is a simple single-page application. To contribute:
1. Fork the repository
2. Make your changes
3. Test in multiple browsers
4. Submit a pull request

---

Made with ❤️ for home decorators and photo enthusiasts