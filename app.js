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
        document.getElementById('updateFrameBtn').addEventListener('click', () => this.updateSelectedFrame());
        document.getElementById('deleteFrameBtn').addEventListener('click', () => this.deleteSelectedFrame());

        // Property inputs
        ['frameLabel', 'frameWidth', 'frameHeight', 'frameColor'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.updateSelectedFrame());
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
        const frame = {
            id: this.frameIdCounter++,
            x: 100,
            y: 100,
            width: 200,
            height: 150,
            label: `Frame ${this.frames.length + 1}`,
            color: '#000000'
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

    updateSelectedFrame() {
        if (!this.selectedFrame) return;

        this.selectedFrame.label = document.getElementById('frameLabel').value;
        this.selectedFrame.width = parseInt(document.getElementById('frameWidth').value);
        this.selectedFrame.height = parseInt(document.getElementById('frameHeight').value);
        this.selectedFrame.color = document.getElementById('frameColor').value;

        this.updateFramesList();
        this.render();
    }

    updatePropertiesPanel() {
        if (!this.selectedFrame) {
            document.getElementById('frameLabel').value = '';
            document.getElementById('frameWidth').value = 200;
            document.getElementById('frameHeight').value = 150;
            document.getElementById('frameColor').value = '#000000';
            return;
        }

        document.getElementById('frameLabel').value = this.selectedFrame.label;
        document.getElementById('frameWidth').value = this.selectedFrame.width;
        document.getElementById('frameHeight').value = this.selectedFrame.height;
        document.getElementById('frameColor').value = this.selectedFrame.color;
    }

    updateFramesList() {
        const container = document.getElementById('framesContainer');
        
        if (this.frames.length === 0) {
            container.innerHTML = '<p class="empty-state">No frames yet. Click "Add Frame" to get started!</p>';
            return;
        }

        container.innerHTML = this.frames.map(frame => `
            <div class="frame-item ${this.selectedFrame?.id === frame.id ? 'selected' : ''}" 
                 data-frame-id="${frame.id}">
                <h4>${frame.label}</h4>
                <p>${frame.width} × ${frame.height} px</p>
            </div>
        `).join('');

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

    handleMouseMove(e) {
        if (!this.isDragging || !this.selectedFrame) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.selectedFrame.x = Math.max(0, Math.min(x - this.dragStartX, this.canvas.width - this.selectedFrame.width));
        this.selectedFrame.y = Math.max(0, Math.min(y - this.dragStartY, this.canvas.height - this.selectedFrame.height));

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
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        this.canvas.dispatchEvent(mouseEvent);
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
