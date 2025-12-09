// Photo Layout Planner App
class PhotoLayoutApp {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.wallImage = null;
        this.frames = [];
        this.selectedFrame = null;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.frameIdCounter = 1;
        
        // Standard photo sizes in inches scaled for wall photos taken 8-10 feet away
        // Photos taken from that distance need smaller scale to look proportional
        // Using ~12 pixels per inch to scale frames appropriately for the photo perspective
        this.PIXELS_PER_INCH = 12;
        
        // Photo sizes - short side in inches (corresponds to button labels)
        this.photoSizes = {
            8: 8 * this.PIXELS_PER_INCH,   // 96px
            9: 9 * this.PIXELS_PER_INCH,   // 108px
            10: 10 * this.PIXELS_PER_INCH, // 120px
            12: 12 * this.PIXELS_PER_INCH, // 144px
            15: 15 * this.PIXELS_PER_INCH  // 180px
        };
        
        // 3:2 aspect ratio constant for all photo sizes
        // Portrait: short side × (short side × 1.5), Landscape: (short side × 1.5) × short side
        this.ASPECT_RATIO = 3 / 2;
        
        // Legacy scale for backwards compatibility with old saved layouts
        this.LEGACY_PIXELS_PER_INCH = 96;
        
        // Touch interaction settings
        this.TOUCH_PADDING = 10; // Extra pixels around frame for easier touch selection

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.loadFromURL();
    }

    setupCanvas() {
        this.canvas = document.getElementById('layoutCanvas');
        this.ctx = this.canvas.getContext('2d');
    }

    setupEventListeners() {
        // Image upload
        document.getElementById('imageUpload').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Canvas interactions
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Buttons
        document.getElementById('addFrameBtn').addEventListener('click', () => this.addFrame());
        document.getElementById('saveLayoutBtn').addEventListener('click', () => this.saveLayout());
        document.getElementById('shareBtn').addEventListener('click', () => this.showShareModal());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetLayout());

        // Frame properties
        document.getElementById('deleteFrameBtn').addEventListener('click', () => this.deleteSelectedFrame());

        // Property inputs
        document.getElementById('frameLabel').addEventListener('change', () => this.updateSelectedFrame());
        document.getElementById('frameColor').addEventListener('change', () => this.updateSelectedFrame());
        
        // Size buttons
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSizeChange(btn.dataset.size);
            });
        });
        
        // Orientation buttons
        document.getElementById('orientationPortrait').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleOrientationChange('portrait');
        });
        document.getElementById('orientationLandscape').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleOrientationChange('landscape');
        });

        // Modal
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('copyLinkBtn').addEventListener('click', () => this.copyShareLink());
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('shareModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.wallImage = img;
                this.resizeCanvas(img.width, img.height);
                this.render();
                this.showCanvasSection();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    resizeCanvas(width, height) {
        // Limit canvas size for performance
        const maxWidth = 1200;
        const maxHeight = 900;
        
        let scale = 1;
        if (width > maxWidth || height > maxHeight) {
            scale = Math.min(maxWidth / width, maxHeight / height);
        }

        this.canvas.width = width * scale;
        this.canvas.height = height * scale;
        this.canvasScale = scale;
    }

    showCanvasSection() {
        document.getElementById('canvasSection').style.display = 'block';
        document.getElementById('propertiesPanel').style.display = 'block';
        document.getElementById('framesList').style.display = 'block';
    }

    addFrame() {
        // Default to 8x12 portrait (3:2 aspect ratio)
        const defaultSize = this.photoSizes[8];
        const frame = {
            id: this.frameIdCounter++,
            x: 100,
            y: 100,
            width: defaultSize,
            height: defaultSize * this.ASPECT_RATIO,
            label: `Frame ${this.frames.length + 1}`,
            color: '#000000',
            photoSize: 8,
            orientation: 'portrait'
        };
        
        this.frames.push(frame);
        this.selectedFrame = frame;
        this.updatePropertiesPanel();
        this.updateFramesList();
        this.render();
    }

    deleteSelectedFrame() {
        if (!this.selectedFrame) return;
        
        this.frames = this.frames.filter(f => f.id !== this.selectedFrame.id);
        this.selectedFrame = null;
        this.updatePropertiesPanel();
        this.updateFramesList();
        this.render();
    }

    handleSizeChange(size) {
        if (!this.selectedFrame) return;
        
        const sizeInPixels = this.photoSizes[size];
        this.selectedFrame.photoSize = parseInt(size);
        
        // Apply size based on current orientation with 3:2 aspect ratio
        if (this.selectedFrame.orientation === 'portrait') {
            // Portrait: short side × long side (e.g., 8" × 12")
            this.selectedFrame.width = sizeInPixels;
            this.selectedFrame.height = sizeInPixels * this.ASPECT_RATIO;
        } else {
            // Landscape: long side × short side (e.g., 12" × 8")
            this.selectedFrame.width = sizeInPixels * this.ASPECT_RATIO;
            this.selectedFrame.height = sizeInPixels;
        }
        
        this.updatePropertiesPanel();
        this.updateFramesList();
        this.render();
    }
    
    handleOrientationChange(orientation) {
        if (!this.selectedFrame) return;
        
        this.selectedFrame.orientation = orientation;
        
        // Swap dimensions
        const temp = this.selectedFrame.width;
        this.selectedFrame.width = this.selectedFrame.height;
        this.selectedFrame.height = temp;
        
        this.updatePropertiesPanel();
        this.updateFramesList();
        this.render();
    }

    updateSelectedFrame() {
        if (!this.selectedFrame) return;

        this.selectedFrame.label = document.getElementById('frameLabel').value;
        this.selectedFrame.color = document.getElementById('frameColor').value;

        this.updateFramesList();
        this.render();
    }

    updatePropertiesPanel() {
        if (!this.selectedFrame) {
            document.getElementById('frameLabel').value = '';
            document.getElementById('frameColor').value = '#000000';
            
            // Reset button states
            document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.orientation-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById('sizeDisplay').textContent = 'Current size: 8" × 12" (Portrait)';
            return;
        }

        // Set frame properties
        document.getElementById('frameLabel').value = this.selectedFrame.label;
        document.getElementById('frameColor').value = this.selectedFrame.color;
        
        // Set default values for old frames without size/orientation
        if (!this.selectedFrame.photoSize) {
            this.selectedFrame.photoSize = 8;
            this.selectedFrame.orientation = 'portrait';
        }
        
        // Update size buttons
        document.querySelectorAll('.size-btn').forEach(btn => {
            if (parseInt(btn.dataset.size) === this.selectedFrame.photoSize) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Update orientation buttons
        document.getElementById('orientationPortrait').classList.toggle('active', 
            this.selectedFrame.orientation === 'portrait');
        document.getElementById('orientationLandscape').classList.toggle('active', 
            this.selectedFrame.orientation === 'landscape');
        
        // Update size display with 3:2 aspect ratio
        const shortSide = this.selectedFrame.photoSize;
        const longSide = Math.round(shortSide * this.ASPECT_RATIO);
        const orientationText = this.selectedFrame.orientation === 'portrait' ? 'Portrait' : 'Landscape';
        const displaySize = this.selectedFrame.orientation === 'portrait' 
            ? `${shortSide}" × ${longSide}"` 
            : `${longSide}" × ${shortSide}"`;
        document.getElementById('sizeDisplay').textContent = `Current size: ${displaySize} (${orientationText})`;
    }

    updateFramesList() {
        const container = document.getElementById('framesContainer');
        
        if (this.frames.length === 0) {
            container.innerHTML = '<p class="empty-state">No frames yet. Click "Add Frame" to get started!</p>';
            return;
        }

        container.innerHTML = this.frames.map(frame => {
            // Calculate display size
            let sizeText;
            if (frame.photoSize && frame.orientation) {
                const shortSide = frame.photoSize;
                const longSide = Math.round(shortSide * this.ASPECT_RATIO);
                sizeText = frame.orientation === 'portrait' 
                    ? `${shortSide}" × ${longSide}"` 
                    : `${longSide}" × ${shortSide}"`;
            } else {
                // Legacy frames without size info - display in inches using old scale
                sizeText = `${Math.round(frame.width / this.LEGACY_PIXELS_PER_INCH)}" × ${Math.round(frame.height / this.LEGACY_PIXELS_PER_INCH)}"`;
            }
            
            return `
                <div class="frame-item ${this.selectedFrame?.id === frame.id ? 'selected' : ''}" 
                     data-frame-id="${frame.id}">
                    <h4>${frame.label}</h4>
                    <p>${sizeText}</p>
                </div>
            `;
        }).join('');

        // Add click handlers
        container.querySelectorAll('.frame-item').forEach(item => {
            item.addEventListener('click', () => {
                const frameId = parseInt(item.dataset.frameId);
                this.selectedFrame = this.frames.find(f => f.id === frameId);
                this.updatePropertiesPanel();
                this.updateFramesList();
                this.render();
            });
        });
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking on a frame (check in reverse order for top frame)
        for (let i = this.frames.length - 1; i >= 0; i--) {
            const frame = this.frames[i];
            if (x >= frame.x && x <= frame.x + frame.width &&
                y >= frame.y && y <= frame.y + frame.height) {
                this.selectedFrame = frame;
                this.isDragging = true;
                this.dragStartX = x - frame.x;
                this.dragStartY = y - frame.y;
                this.updatePropertiesPanel();
                this.updateFramesList();
                this.render();
                return;
            }
        }

        // Clicked on empty space
        this.selectedFrame = null;
        this.updatePropertiesPanel();
        this.updateFramesList();
        this.render();
    }

    // Helper method to constrain frame position within canvas bounds
    constrainFramePosition(frame, x, y) {
        frame.x = Math.max(0, Math.min(x - this.dragStartX, this.canvas.width - frame.width));
        frame.y = Math.max(0, Math.min(y - this.dragStartY, this.canvas.height - frame.height));
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.selectedFrame) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.constrainFramePosition(this.selectedFrame, x, y);
        this.render();
    }

    handleMouseUp(e) {
        this.isDragging = false;
    }

    handleDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        for (let i = this.frames.length - 1; i >= 0; i--) {
            const frame = this.frames[i];
            if (x >= frame.x && x <= frame.x + frame.width &&
                y >= frame.y && y <= frame.y + frame.height) {
                this.selectedFrame = frame;
                this.updatePropertiesPanel();
                this.updateFramesList();
                document.getElementById('frameLabel').focus();
                return;
            }
        }
    }

    // Touch event handlers
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // Check if touching a frame (check in reverse order for top frame)
        // Use a larger hit area for touch (add padding for easier selection)
        for (let i = this.frames.length - 1; i >= 0; i--) {
            const frame = this.frames[i];
            if (x >= frame.x - this.TOUCH_PADDING && x <= frame.x + frame.width + this.TOUCH_PADDING &&
                y >= frame.y - this.TOUCH_PADDING && y <= frame.y + frame.height + this.TOUCH_PADDING) {
                this.selectedFrame = frame;
                this.isDragging = true;
                this.dragStartX = x - frame.x;
                this.dragStartY = y - frame.y;
                this.updatePropertiesPanel();
                this.updateFramesList();
                this.render();
                return;
            }
        }

        // Touched on empty space
        this.selectedFrame = null;
        this.updatePropertiesPanel();
        this.updateFramesList();
        this.render();
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging || !this.selectedFrame) return;

        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        this.constrainFramePosition(this.selectedFrame, x, y);
        this.render();
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.isDragging = false;
    }

    render() {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw wall image
        if (this.wallImage) {
            this.ctx.drawImage(this.wallImage, 0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw frames
        this.frames.forEach(frame => {
            const isSelected = this.selectedFrame?.id === frame.id;

            // Draw frame border
            this.ctx.strokeStyle = frame.color;
            this.ctx.lineWidth = isSelected ? 4 : 2;
            this.ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);

            // Draw semi-transparent fill
            this.ctx.fillStyle = isSelected ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(frame.x, frame.y, frame.width, frame.height);

            // Draw label
            this.ctx.fillStyle = frame.color;
            this.ctx.font = 'bold 14px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Add background for label
            const labelWidth = this.ctx.measureText(frame.label).width + 10;
            const labelHeight = 20;
            const labelX = frame.x + frame.width / 2 - labelWidth / 2;
            const labelY = frame.y + frame.height / 2 - labelHeight / 2;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
            
            this.ctx.fillStyle = frame.color;
            this.ctx.fillText(frame.label, frame.x + frame.width / 2, frame.y + frame.height / 2);

            // Draw resize handles for selected frame
            if (isSelected) {
                const handleSize = 8;
                this.ctx.fillStyle = '#667eea';
                
                // Corner handles
                this.ctx.fillRect(frame.x - handleSize / 2, frame.y - handleSize / 2, handleSize, handleSize);
                this.ctx.fillRect(frame.x + frame.width - handleSize / 2, frame.y - handleSize / 2, handleSize, handleSize);
                this.ctx.fillRect(frame.x - handleSize / 2, frame.y + frame.height - handleSize / 2, handleSize, handleSize);
                this.ctx.fillRect(frame.x + frame.width - handleSize / 2, frame.y + frame.height - handleSize / 2, handleSize, handleSize);
            }
        });
    }

    saveLayout() {
        const layoutData = {
            wallImage: this.canvas.toDataURL('image/jpeg', 0.8),
            frames: this.frames,
            timestamp: Date.now()
        };

        const compressed = this.compressData(JSON.stringify(layoutData));
        localStorage.setItem('photoLayout', compressed);
        
        alert('Layout saved successfully! ✓');
    }

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const layoutParam = params.get('layout');
        
        if (layoutParam) {
            try {
                const decompressed = this.decompressData(layoutParam);
                const layoutData = JSON.parse(decompressed);
                this.loadLayout(layoutData);
            } catch (e) {
                console.error('Failed to load layout from URL:', e);
            }
        } else {
            // Try to load from localStorage
            const saved = localStorage.getItem('photoLayout');
            if (saved) {
                try {
                    const decompressed = this.decompressData(saved);
                    const layoutData = JSON.parse(decompressed);
                    this.loadLayout(layoutData);
                } catch (e) {
                    console.error('Failed to load saved layout:', e);
                }
            }
        }
    }

    loadLayout(layoutData) {
        if (!layoutData.wallImage) return;

        const img = new Image();
        img.onload = () => {
            this.wallImage = img;
            this.resizeCanvas(img.width, img.height);
            this.frames = layoutData.frames || [];
            this.frameIdCounter = Math.max(...this.frames.map(f => f.id), 0) + 1;
            this.render();
            this.showCanvasSection();
            this.updateFramesList();
        };
        img.src = layoutData.wallImage;
    }

    resetLayout() {
        if (!confirm('Are you sure you want to reset? This will clear all frames.')) return;

        this.frames = [];
        this.selectedFrame = null;
        this.frameIdCounter = 1;
        this.updatePropertiesPanel();
        this.updateFramesList();
        this.render();
    }

    showShareModal() {
        if (!this.wallImage) {
            alert('Please upload a wall image first!');
            return;
        }

        const layoutData = {
            wallImage: this.canvas.toDataURL('image/jpeg', 0.8),
            frames: this.frames,
            timestamp: Date.now()
        };

        const compressed = this.compressData(JSON.stringify(layoutData));
        const shareURL = `${window.location.origin}${window.location.pathname}?layout=${encodeURIComponent(compressed)}`;
        
        document.getElementById('shareLink').value = shareURL;
        document.getElementById('shareModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('shareModal').style.display = 'none';
    }

    async copyShareLink() {
        const linkInput = document.getElementById('shareLink');
        const btn = document.getElementById('copyLinkBtn');
        const originalText = btn.textContent;
        
        try {
            // Use modern Clipboard API
            await navigator.clipboard.writeText(linkInput.value);
            btn.textContent = 'Copied! ✓';
        } catch (err) {
            // Fallback for older browsers
            linkInput.select();
            try {
                document.execCommand('copy');
                btn.textContent = 'Copied! ✓';
            } catch (fallbackErr) {
                btn.textContent = 'Failed to copy';
                console.error('Copy failed:', fallbackErr);
            }
        }
        
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }

    // Simple compression using base64 encoding
    compressData(str) {
        try {
            return btoa(encodeURIComponent(str));
        } catch (e) {
            return str;
        }
    }

    decompressData(str) {
        try {
            return decodeURIComponent(atob(str));
        } catch (e) {
            return str;
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PhotoLayoutApp();
});
