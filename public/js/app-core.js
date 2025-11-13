 // public/js/app-core.js with text toggle option
document.addEventListener('DOMContentLoaded', function() {
    // Always reset local state on load for fresh start
    try { localStorage.removeItem('tacticalMapState'); } catch(e) {}
    // Initialize Leaflet map
    const mapContainer = document.getElementById('tactical-map');
    const defaultLat = 33.88606768024337;
    const defaultLng = -83.35769023031618;
    
    // Create the map
    const map = L.map('tactical-map', {
      maxZoom: 22,  // Increased from default 18
      minZoom: 3    // Reasonable minimum zoom
    }).setView([defaultLat, defaultLng], 13);
    
    // Add OpenStreetMap tiles
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 22  // Match the map's maxZoom
    }).addTo(map);

    // Add Google Satellite layer
    const satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      attribution: '© Google Maps',
      maxZoom: 22  // Match the map's maxZoom
    });

    // Add Mapbox terrain visualization layers
    const terrainLayer = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWF0dGVvMTAxbWFuIiwiYSI6ImNtOGhjYTg1cjAwamQycnBtcWh6enNudXgifQ.SjTdBc7hQt1m5dtiJjpxlw', {
      maxZoom: 22,
      tileSize: 512,
      zoomOffset: -1,
      attribution: '© Mapbox'
    });

    // Add administrative boundaries overlay
    const boundariesLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      opacity: 0.6,
      pane: 'overlayPane'
    });

    // Create layer control
    const baseMaps = {
      "Standard": osmLayer,
      "Satellite": satelliteLayer,
      "Terrain": terrainLayer
    };

    // Add boundaries layer to satellite view by default
    satelliteLayer.on('add', function() {
      boundariesLayer.addTo(map);
    });

    satelliteLayer.on('remove', function() {
      boundariesLayer.removeFrom(map);
    });

    L.control.layers(baseMaps).addTo(map);

    // Add a custom control for terrain visualization
    const terrainControl = L.control({position: 'topright'});

    terrainControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
        div.innerHTML = `
            <a href="#" title="Toggle Terrain" style="
                width: 30px;
                height: 30px;
                line-height: 30px;
                text-align: center;
                text-decoration: none;
                color: black;
                background: white;
                display: block;
                border-radius: 4px;
                border: 2px solid rgba(0,0,0,0.2);
                font-size: 18px;
            ">⛰️</a>
        `;
        
        // Add click handler
        const link = div.querySelector('a');
        let terrainEnabled = false;
        
        link.onclick = function(e) {
            e.preventDefault();
            terrainEnabled = !terrainEnabled;
            
            if (terrainEnabled) {
                map.removeLayer(osmLayer);
                map.removeLayer(satelliteLayer);
                terrainLayer.addTo(map);
                link.style.backgroundColor = '#4CAF50';
                link.style.color = 'white';
            } else {
                map.removeLayer(terrainLayer);
                osmLayer.addTo(map);
                link.style.backgroundColor = 'white';
                link.style.color = 'black';
            }
        };
        
        return div;
    };

    terrainControl.addTo(map);

    // Grid configuration for 1:25,000 scale (1km grid cells)
    const gridConfig = {
      cellSize: 1000, // 1km grid cells for 1:25,000 scale
      lineColor: '#2c3e50',
      labelColor: '#2c3e50',
      lineWeight: 1,
      labelSize: 12
    };

    // Create grid overlay
    const gridLayerGroup = L.layerGroup().addTo(map);
    
    function updateGrid() {
      // Clear existing grid
      gridLayerGroup.clearLayers();
      
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      
      // Only show grid at certain zoom levels
      if (zoom < 10) return;
      
      const north = bounds.getNorth();
      const south = bounds.getSouth();
      const east = bounds.getEast();
      const west = bounds.getWest();
      
      // Calculate grid spacing based on cellSize (in meters)
      // Convert cellSize from meters to degrees (approximate)
      // 1 degree latitude ≈ 111,000 meters
      // 1 degree longitude ≈ 111,000 * cos(latitude) meters
      const centerLat = (north + south) / 2;
      const latSpacing = gridConfig.cellSize / 111000; // Convert meters to degrees
      const lngSpacing = gridConfig.cellSize / (111000 * Math.cos(centerLat * Math.PI / 180));
      
      // Find the nearest grid lines
      const startLng = Math.floor(west / lngSpacing) * lngSpacing;
      const endLng = Math.ceil(east / lngSpacing) * lngSpacing;
      const startLat = Math.floor(south / latSpacing) * latSpacing;
      const endLat = Math.ceil(north / latSpacing) * latSpacing;
      
      // Draw vertical grid lines (longitude lines)
      for (let lng = startLng; lng <= endLng; lng += lngSpacing) {
        const line = L.polyline([[south, lng], [north, lng]], {
          color: gridConfig.lineColor,
          weight: gridConfig.lineWeight,
          opacity: 0.5
        }).addTo(gridLayerGroup);
        
        // Add grid labels for major lines (every 5th line or at reasonable intervals)
        if (Math.abs(lng - Math.round(lng)) < 0.001) { // Near whole degrees
          const label = L.divIcon({
            className: 'grid-label',
            html: `<div style="background: rgba(255,255,255,0.8); padding: 2px 4px; border-radius: 2px; font-size: ${gridConfig.labelSize}px; font-family: 'Courier New', monospace;">${lng.toFixed(3)}°</div>`,
            iconSize: [60, 20],
            iconAnchor: [30, 10]
          });
          L.marker([north - 0.01, lng], { icon: label }).addTo(gridLayerGroup);
        }
      }
      
      // Draw horizontal grid lines (latitude lines)
      for (let lat = startLat; lat <= endLat; lat += latSpacing) {
        const line = L.polyline([[lat, west], [lat, east]], {
          color: gridConfig.lineColor,
          weight: gridConfig.lineWeight,
          opacity: 0.5
        }).addTo(gridLayerGroup);
        
        // Add grid labels for major lines
        if (Math.abs(lat - Math.round(lat)) < 0.001) { // Near whole degrees
          const label = L.divIcon({
            className: 'grid-label',
            html: `<div style="background: rgba(255,255,255,0.8); padding: 2px 4px; border-radius: 2px; font-size: ${gridConfig.labelSize}px; font-family: 'Courier New', monospace;">${lat.toFixed(3)}°</div>`,
            iconSize: [60, 20],
            iconAnchor: [30, 10]
          });
          L.marker([lat, west + 0.01], { icon: label }).addTo(gridLayerGroup);
        }
      }
    }

    // Update grid when map moves or zooms
    map.on('moveend', updateGrid);
    map.on('zoomend', updateGrid);

    // Initialize grid
    updateGrid();

    // Grid info display
    const gridInfoElement = document.getElementById('grid-info');
    const cursorPositionElement = document.getElementById('cursor-position');

    // Function to format MGRS coordinates with proper spacing
    function formatMgrs(mgrsString) {
        // Remove any existing spaces
        const clean = mgrsString.replace(/\s+/g, '');
        // Format as: 17S KT XXXXX XXXXX
        return clean.replace(/^(\d{2,3}[A-Z])([A-Z]{2})(\d{5})(\d{5})$/, '$1 $2 $3 $4');
    }

    // Update coordinate display
    map.on('mousemove', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        try {
            if (window.mgrs) {
                const mgrsRef = window.mgrs.forward([lng, lat]);
                coordDisplay.textContent = `MGRS: ${formatMgrs(mgrsRef)}`;
                // Store the raw MGRS value as a data attribute
                coordDisplay.setAttribute('data-mgrs', mgrsRef);
            }
        } catch (error) {
            console.error('Error converting to MGRS:', error);
            coordDisplay.textContent = 'Invalid coordinates';
        }
    });

    // Variables for map state
    let isMeasuring = false;
    let measureStartPoint = null;
    let measureLine = null;
    let measureText = null;
    let selectedUnit = null;
    let selectedUnits = []; // Array to track multiple selected units
    let measureDistanceBtn = null;
    
    // Array to track all placed units
    let placedUnits = [];
    
    // Store all loaded symbol images
    const symbolImages = {};

    // Add a flag to ignore the next map click after a drop event
    let ignoreNextMapClick = false;

    // Add map click handler for deselection (moved outside unit creation)
    map.on('click', function(e) {
      if (ignoreNextMapClick) {
        ignoreNextMapClick = false;
        return;
      }
      if (selectedUnit) {
        const markerElement = selectedUnit.getElement();
        const markerRect = markerElement.getBoundingClientRect();
        const mapRect = map.getContainer().getBoundingClientRect();
        
        // Check if click is within the marker's bounding box
        const isWithinMarker = (
          e.originalEvent.clientX >= markerRect.left - mapRect.left &&
          e.originalEvent.clientX <= markerRect.right - mapRect.left &&
          e.originalEvent.clientY >= markerRect.top - mapRect.top &&
          e.originalEvent.clientY <= markerRect.bottom - mapRect.top
        );
        
        // Only deselect if click is outside the marker
        if (!isWithinMarker) {
          selectedUnit.getElement().classList.remove('selected');
          selectedUnit = null;
          updateUnitHierarchy();
        }
      }
    });

    // Initialize tab functionality
    function initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and panes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Add active class to clicked button and corresponding pane
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    // Function to get symbol name from filename
    function getSymbolName(filename) {
      return filename.replace(/\.[^/.]+$/, "");
    }
  
    // Load all symbols from the symbols directory using the server API endpoint
    async function loadAllSymbols() {
      try {
        const response = await fetch('symbols/index.json');
        const data = await response.json();
        
        if (!data || !data.symbols || !Array.isArray(data.symbols)) {
          console.error("Invalid response from symbols API");
          return;
        }
        
        const symbolFiles = data.symbols;
        console.log(`Loading ${symbolFiles.length} symbols`);
        
        return new Promise((resolve) => {
          if (symbolFiles.length === 0) {
            console.log('No symbols found');
            resolve();
            return;
          }
          
          let imagesLoaded = 0;
          
          const checkAllLoaded = () => {
            imagesLoaded++;
            if (imagesLoaded >= symbolFiles.length) {
              console.log('All symbol images loaded successfully');
              resolve();
            }
          };
          
          symbolFiles.forEach(filename => {
            const symbolName = getSymbolName(filename);
            const symbolKey = symbolName;
            
            const img = new Image();
            img.onload = () => {
              symbolImages[symbolKey] = {
                image: img,
                symbolName: symbolName,
                filename: filename
              };
              checkAllLoaded();
            };
            img.onerror = () => {
              console.error(`Failed to load symbol: ${filename}`);
              checkAllLoaded();
            };
            img.src = `symbols/${filename}`;
          });
        });
      } catch (error) {
        console.error("Error loading symbols:", error);
        alert("Failed to load symbols. Please check the server connection.");
      }
    }

    // Initialize unit palette for drag and drop
    function initUnitPalette() {
      const palette = document.getElementById('unit-palette');
      if (!palette) {
        console.error('Unit palette element not found');
        return;
      }
      
      palette.innerHTML = '';
      
      // Add all loaded symbols to the palette directly
      Object.keys(symbolImages).forEach(symbolKey => {
        const img = symbolImages[symbolKey];
        
        const unitItem = document.createElement('div');
        unitItem.className = 'unit-item';
        unitItem.setAttribute('data-symbol-key', symbolKey);
        unitItem.draggable = true; // Make the item draggable
        unitItem.setAttribute('role', 'button');
        unitItem.setAttribute('aria-label', `Place ${img.symbolName} on map`);
        
        // Create the image element
        const imgElement = document.createElement('img');
        imgElement.style.width = '50px';
        imgElement.style.height = '50px';
        imgElement.style.marginBottom = '5px';
        imgElement.style.objectFit = 'contain'; 
        imgElement.alt = img.symbolName;
        imgElement.src = `symbols/${img.filename}`;
        
        const span = document.createElement('span');
        span.textContent = img.symbolName;
        span.style.fontWeight = 'bold';
        span.style.textAlign = 'center';
        span.style.fontSize = '10px';
        
        unitItem.appendChild(imgElement);
        unitItem.appendChild(span);
        palette.appendChild(unitItem);
      });

      // Add drag and drop event listeners
      const unitItems = palette.querySelectorAll('.unit-item');
      unitItems.forEach(item => {
        item.addEventListener('dragstart', function(e) {
          e.dataTransfer.setData('text/plain', this.getAttribute('data-symbol-key'));
          e.dataTransfer.effectAllowed = 'copy';
        });
      });

      // Touch devices: long-press symbol to create at map center (allows scrolling)
      let pendingSymbolKey = null;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (isTouch) {
        unitItems.forEach(item => {
          let longPressTimer = null;
          let touchStarted = false;
          let longPressed = false;
          
          item.addEventListener('touchstart', function(e) {
            touchStarted = true;
            longPressed = false;
            this.style.background = '#e8e8e8';
            this.style.transform = 'scale(0.95)';
            
            // Start long-press timer (500ms)
            longPressTimer = setTimeout(() => {
              if (touchStarted) {
                longPressed = true;
                this.style.background = '#4CAF50';
                this.style.transform = 'scale(1.05)';
                // Vibrate if available
                if (navigator.vibrate) navigator.vibrate(50);
                
                const key = this.getAttribute('data-symbol-key');
                if (!key || !symbolImages[key]) return;
                const center = map.getCenter();
                createUnitFromSymbolAt(center, key);
                // Close sidebar for placement/dragging
                try {
                  const sidebar = document.getElementById('sidebar');
                  const overlay = document.getElementById('sidebar-overlay');
                  if (sidebar && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                    if (overlay) {
                      overlay.style.display = 'none';
                      overlay.classList.remove('active');
                    }
                  }
                } catch(_){}
              }
            }, 500);
          }, {passive: true});
          
          item.addEventListener('touchmove', function(e) {
            // Cancel long-press if finger moves (scrolling)
            touchStarted = false;
            clearTimeout(longPressTimer);
            if (!longPressed) {
              this.style.background = '#fafafa';
              this.style.transform = 'scale(1)';
            }
          }, {passive: true});
          
          item.addEventListener('touchend', function(e) {
            touchStarted = false;
            clearTimeout(longPressTimer);
            this.style.background = '#fafafa';
            this.style.transform = 'scale(1)';
          }, {passive: true});
          
          item.addEventListener('touchcancel', function(e) {
            touchStarted = false;
            clearTimeout(longPressTimer);
            this.style.background = '#fafafa';
            this.style.transform = 'scale(1)';
          }, {passive: true});
        });
      }
      
      // Desktop: click to create immediately
      const isDesktop = !isTouch;
      if (isDesktop) {
        unitItems.forEach(item => {
          item.addEventListener('click', function(e) {
            const key = this.getAttribute('data-symbol-key');
            if (!key || !symbolImages[key]) return;
            const center = map.getCenter();
            createUnitFromSymbolAt(center, key);
          });
        });
      }

      // Add drop event listener to the map
      map.getContainer().addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
      });

      // Helper to create a symbol unit at a given position (used by DnD and touch)
      function createUnitFromSymbolAt(latlng, symbolKey) {
        if (!symbolKey || !symbolImages[symbolKey]) return;

        // Create a new unit marker
        const unitMarker = L.marker(latlng, {
          icon: L.divIcon({
            className: 'unit-marker',
            html: `
              <div class="unit-container">
                <div class="unit-label">${symbolImages[symbolKey].symbolName}</div>
                <img src="symbols/${symbolImages[symbolKey].filename}" style="width: 40px; height: 40px; object-fit: contain;">
                <div class="unit-controls" style="display: none;">
                  <button class="unit-lock-btn">🔒</button>
                  <button class="unit-copy-position-btn">📋</button>
                  <button class="unit-delete-btn">🗑️</button>
                </div>
              </div>
            `,
            iconSize: [60, 80],
            iconAnchor: [30, 40]
          })
        }).addTo(map);

        // Make marker draggable
        unitMarker.dragging.enable();

        // Add rotation and lock functionality
        const markerElement = unitMarker.getElement();
        const container = markerElement.querySelector('.unit-container');
        const lockBtn = markerElement.querySelector('.unit-lock-btn');
        const img = markerElement.querySelector('img');
        const label = markerElement.querySelector('.unit-label');
        let rotation = 0;
        let isLocked = false;
        let customName = null;
        let linkedTextMarker = null; // For position copy feature

        // Create bounding box for selection indication and pinch-to-resize
        // Make it MUCH larger for easier touch interaction (3x the unit size minimum)
        const boxSize = 0.0012; // Even larger bounding box for touch-friendly interaction
        const boundingBox = L.rectangle(unitMarker.getLatLng().toBounds(boxSize), {
          color: '#000000',
          fillColor: '#000000',
          fill: true,
          fillOpacity: 0.08,
          weight: 5,
          interactive: true,
          className: 'unit-bounding-box',
          opacity: 1,  // Always visible
          pane: 'overlayPane', // Ensure it renders above the map
          bubblingMouseEvents: false // Prevent events from going to map
        }).addTo(map);
        boundingBox._unitMarker = unitMarker;
        boundingBox._unitContainer = container;
        boundingBox._unitImg = img;
        boundingBox._boxSize = boxSize;
        
        // Make the bounding box the primary drag target (not the marker)
        boundingBox.dragging = unitMarker.dragging;
        
        // Make bounding box draggable by syncing with unit marker
        let isDraggingBox = false;
        let dragStartLatLng = null;
        let boxElement = boundingBox.getElement();
        
        // Single-finger drag on bounding box
        if (boxElement) {
          boxElement.addEventListener('touchstart', function(e) {
            if (isLocked || e.touches.length > 1) return;
            isDraggingBox = true;
            dragStartLatLng = unitMarker.getLatLng();
            e.stopPropagation();
            // Disable map dragging while dragging unit
            map.dragging.disable();
          }, {passive: false});
          
          boxElement.addEventListener('touchmove', function(e) {
            if (!isDraggingBox || e.touches.length > 1) return;
            e.preventDefault();
            e.stopPropagation();
            
            const touch = e.touches[0];
            const point = map.containerPointToLatLng([touch.clientX, touch.clientY]);
            unitMarker.setLatLng(point);
            boundingBox.setBounds(point.toBounds(boundingBox._boxSize));
            
            // Update linked text marker if exists
            if (linkedTextMarker) {
              const offsetLat = point.lat + 0.0002;
              linkedTextMarker.setLatLng([offsetLat, point.lng]);
              try {
                if (window.mgrs) {
                  const mgrsRef = window.mgrs.forward([point.lng, point.lat]);
                  const formattedMgrs = formatMgrs(mgrsRef);
                  const markerElement = linkedTextMarker.getElement();
                  if (markerElement) {
                    const textDiv = markerElement.querySelector('div');
                    if (textDiv) textDiv.textContent = formattedMgrs;
                  }
                  const unit = placedUnits.find(u => u.marker === linkedTextMarker);
                  if (unit) unit.customName = `Position: ${formattedMgrs}`;
                }
              } catch(e) {}
            }
          }, {passive: false});
          
          boxElement.addEventListener('touchend', function(e) {
            if (isDraggingBox) {
              isDraggingBox = false;
              const unit = placedUnits.find(u => u.marker === unitMarker);
              if (unit) {
                unit.position = [unitMarker.getLatLng().lat, unitMarker.getLatLng().lng];
                updateUnitHierarchy();
                saveState();
                syncUnitToFirebase(unit); // Sync position update
              }
              // Re-enable map dragging
              map.dragging.enable();
            }
          }, {passive: false});
        }
        
        // Prevent map interaction when touching bounding box
        boundingBox.on('mousedown touchstart', function(e) {
          L.DomEvent.stopPropagation(e);
        });

        // Two-finger rotation and pinch-to-resize state
        let isRotating = false;
        let isResizing = false;
        let startAngle = 0;
        let currentRotation = 0;
        let wasRotating = false;
        let activeTouches = new Map(); // Track active touches
        let initialDistance = 0;
        let initialSize = 40;

        function clientPoint(ev) {
            const t = ev.touches && ev.touches[0] ? ev.touches[0] : (ev.changedTouches && ev.changedTouches[0]) || ev;
            return { x: t.clientX, y: t.clientY };
        }

        // Style controls for iOS-friendly touch targets (minimum 44x44px per Apple HIG)
        const copyPositionBtn = markerElement.querySelector('.unit-copy-position-btn');
        const deleteBtn = markerElement.querySelector('.unit-delete-btn');
        const controlsDiv = markerElement.querySelector('.unit-controls');
        
        [lockBtn, copyPositionBtn, deleteBtn].forEach(function(btn){
          if (btn) { 
            btn.style.fontSize = '20px'; 
            btn.style.padding = '10px'; 
            btn.style.margin = '3px'; 
            btn.style.minWidth = '44px';
            btn.style.minHeight = '44px';
            btn.style.borderRadius = '6px';
            btn.style.border = '1px solid rgba(0,0,0,0.2)';
            btn.style.background = 'rgba(255,255,255,0.9)';
            btn.style.transition = 'all 0.15s ease';
            btn.style.touchAction = 'manipulation';
            btn.style.webkitTapHighlightColor = 'transparent';
            // Visual feedback on touch
            btn.addEventListener('touchstart', function(){ this.style.background = 'rgba(240,240,240,0.95)'; this.style.transform = 'scale(0.95)'; }, {passive:true});
            btn.addEventListener('touchend', function(){ this.style.background = 'rgba(255,255,255,0.9)'; this.style.transform = 'scale(1)'; }, {passive:true});
          }
        });
        
        // Toggle context menu on tap
        let menuVisible = false;
        container.addEventListener('click', function(e) {
          // Don't toggle if clicking a button
          if (e.target.tagName === 'BUTTON') return;
          e.stopPropagation();
          menuVisible = !menuVisible;
          controlsDiv.style.display = menuVisible ? 'flex' : 'none';
        });

        // Two-finger gesture helper
        function getDistance(touch1, touch2) {
          const dx = touch1.clientX - touch2.clientX;
          const dy = touch1.clientY - touch2.clientY;
          return Math.sqrt(dx * dx + dy * dy);
        }

        // Handle touch events for two-finger rotation and pinch resize
        const mapContainer = map.getContainer();
        let twoFingerActive = false;
        let touch1Id = null;
        let touch2Id = null;

        // Detect two-finger gestures on BOTH the unit marker AND bounding box for better touch detection
        const gestureElements = [markerElement, boundingBox.getElement()];
        gestureElements.forEach(element => {
          if (!element) return;
          element.addEventListener('touchstart', function(e) {
            if (isLocked) return;
            if (e.touches.length === 2) {
              e.preventDefault();
              e.stopPropagation();
              twoFingerActive = true;
              touch1Id = e.touches[0].identifier;
              touch2Id = e.touches[1].identifier;
              
              // Calculate initial angle for rotation
              const dx = e.touches[1].clientX - e.touches[0].clientX;
              const dy = e.touches[1].clientY - e.touches[0].clientY;
              startAngle = Math.atan2(dy, dx);
              
              // Calculate initial distance for pinch-to-zoom
              initialDistance = Math.sqrt(dx * dx + dy * dy);
              initialSize = parseInt(img.style.width) || 40;
            }
          }, {passive: false});
        });

        gestureElements.forEach(element => {
          if (!element) return;
          element.addEventListener('touchmove', function(e) {
            if (!twoFingerActive || e.touches.length !== 2) return;
            
            const touch1 = Array.from(e.touches).find(t => t.identifier === touch1Id);
            const touch2 = Array.from(e.touches).find(t => t.identifier === touch2Id);
            
            if (!touch1 || !touch2) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // Calculate current angle and rotation
            const dx = touch2.clientX - touch1.clientX;
            const dy = touch2.clientY - touch1.clientY;
            const currentAngle = Math.atan2(dy, dx);
            const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
            currentRotation = (rotation + angleDiff) % 360;
            container.style.transform = `rotate(${currentRotation}deg)`;
            
            // Calculate current distance and scale for pinch
            const currentDistance = Math.sqrt(dx * dx + dy * dy);
            const scale = currentDistance / initialDistance;
            const newSize = Math.max(20, Math.min(300, initialSize * scale));
            img.style.width = `${newSize}px`;
            img.style.height = `${newSize}px`;
            container.style.width = `${newSize + 20}px`;
            container.style.height = `${newSize + 40}px`;
            
            // Update bounding box to stay square and larger
            const latlng = unitMarker.getLatLng();
            boundingBox.setBounds(latlng.toBounds(boundingBox._boxSize));
          }, {passive: false});
        });

        gestureElements.forEach(element => {
          if (!element) return;
          element.addEventListener('touchend', function(e) {
            if (twoFingerActive && e.touches.length < 2) {
              twoFingerActive = false;
              rotation = currentRotation;
              const unit = placedUnits.find(u => u.marker === unitMarker);
              if (unit) {
                unit.rotation = rotation;
                unit.size = parseInt(img.style.width);
                updateUnitHierarchy();
                saveState();
                syncUnitToFirebase(unit); // Sync rotation/size update
              }
              touch1Id = null;
              touch2Id = null;
            }
          }, {passive: false});
        });


        // Update bounding box when unit moves
        unitMarker.on('drag', function() {
          const latlng = unitMarker.getLatLng();
          boundingBox.setBounds(latlng.toBounds(boundingBox._boxSize));
          // Update linked text marker if exists (keeping offset)
          if (linkedTextMarker) {
            const offsetLat = latlng.lat + 0.0002; // Maintain offset above unit
            linkedTextMarker.setLatLng([offsetLat, latlng.lng]);
            // Update text content with new coordinates
            try {
              if (window.mgrs) {
                const mgrsRef = window.mgrs.forward([latlng.lng, latlng.lat]);
                const formattedMgrs = formatMgrs(mgrsRef);
                const markerElement = linkedTextMarker.getElement();
                if (markerElement) {
                  const textDiv = markerElement.querySelector('div');
                  if (textDiv) textDiv.textContent = formattedMgrs;
                }
                const unit = placedUnits.find(u => u.marker === linkedTextMarker);
                if (unit) unit.customName = `Position: ${formattedMgrs}`;
              }
            } catch(e) {}
          }
        });

        // Sync position when drag ends (for standard Leaflet drag, not touch drag)
        unitMarker.on('dragend', function() {
          if (isLocked) return;
          const unit = placedUnits.find(u => u.marker === unitMarker);
          if (unit) {
            unit.position = [unitMarker.getLatLng().lat, unitMarker.getLatLng().lng];
            updateUnitHierarchy();
            saveState();
            syncUnitToFirebase(unit); // Sync position update
          }
        });


        // Lock functionality
        function toggleLock(e){
          e.stopPropagation();
          e.preventDefault();
          isLocked = !isLocked;
          lockBtn.style.color = isLocked ? '#e74c3c' : '#666';
          container.style.opacity = isLocked ? '0.7' : '1';
          if (isLocked) {
            unitMarker.dragging.disable();
          } else {
            unitMarker.dragging.enable();
          }
          const unit = placedUnits.find(u => u.marker === unitMarker);
          if (unit) {
            unit.isLocked = isLocked;
            updateUnitHierarchy();
            syncUnitToFirebase(unit); // Sync lock state
          }
        }
        lockBtn.addEventListener('click', toggleLock);
        lockBtn.addEventListener('touchstart', toggleLock, {passive:false});
        
        // Delete button functionality
        function deleteUnit(e) {
          e.stopPropagation();
          e.preventDefault();
          const index = placedUnits.findIndex(u => u.marker === unitMarker);
          if (index !== -1) {
            // Also delete linked text marker if it exists
            if (linkedTextMarker) {
              const textIndex = placedUnits.findIndex(u => u.marker === linkedTextMarker);
              if (textIndex !== -1) {
                map.removeLayer(linkedTextMarker);
                placedUnits.splice(textIndex, 1);
              }
            }
            removeUnit(index);
          }
        }
        deleteBtn.addEventListener('click', deleteUnit);
        deleteBtn.addEventListener('touchstart', deleteUnit, {passive:false});


        // Double-tap to rename (iOS compatible)
        let lastTap = 0;
        container.addEventListener('touchend', function(e) {
          const currentTime = new Date().getTime();
          const tapLength = currentTime - lastTap;
          if (tapLength < 500 && tapLength > 0 && !isLocked) {
            e.preventDefault();
            const currentName = customName || symbolImages[symbolKey].symbolName;
            const newName = prompt('Enter new name:', currentName);
            if (newName !== null && newName.trim() !== '') {
              customName = newName.trim();
              label.textContent = customName;
              const unit = placedUnits.find(u => u.marker === unitMarker);
              if (unit) {
                unit.customName = customName;
                updateUnitHierarchy();
                syncUnitToFirebase(unit); // Sync name update
              }
            }
          }
          lastTap = currentTime;
        });
        
        // Double-click to rename (desktop)
        container.addEventListener('dblclick', function(e) {
          e.stopPropagation();
          if (!isLocked) {
            const currentName = customName || symbolImages[symbolKey].symbolName;
            const newName = prompt('Enter new name:', currentName);
            if (newName !== null && newName.trim() !== '') {
              customName = newName.trim();
              label.textContent = customName;
              const unit = placedUnits.find(u => u.marker === unitMarker);
              if (unit) {
                unit.customName = customName;
                updateUnitHierarchy();
                syncUnitToFirebase(unit); // Sync name update
              }
            }
          }
        });

        // Track in placedUnits with unique ID for Firebase sync
        const unitId = 'unit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        placedUnits.push({
          id: unitId,
          marker: unitMarker,
          symbolKey: symbolKey,
          position: latlng,
          rotation: 0,
          isLocked: false,
          customName: null,
          type: 'symbol',
          size: 40,
          boundingBox: boundingBox
        });

        updateUnitHierarchy();
        saveState();
        addContextMenuListeners(container);
        
        // Sync this unit to Firebase immediately (unless it's being created from Firebase)
        const newUnit = placedUnits[placedUnits.length - 1];
        if (!isCreatingFromFirebase) {
            syncUnitToFirebase(newUnit);
        }

        // Copy position button (text marker follows parent unit and appears above label)
        function doCopy(e){
            e.stopPropagation();
            e.preventDefault();
            const latlngNow = unitMarker.getLatLng();
            try {
                if (window.mgrs) {
                    const mgrsRef = window.mgrs.forward([latlngNow.lng, latlngNow.lat]);
                    const formattedMgrs = formatMgrs(mgrsRef);
                    // Position text marker above the unit (offset by moving north)
                    const offsetLat = latlngNow.lat + 0.0002; // Offset north
                    const textMarker = L.marker([offsetLat, latlngNow.lng], {
                        icon: L.divIcon({
                            className: 'text-marker position-marker',
                            html: `<div style="background: rgba(255,255,255,0.95); padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 10px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3); border: 1px solid #666;">${formattedMgrs}</div>`,
                            iconSize: [200, 20],
                            iconAnchor: [100, 25]
                        })
                    }).addTo(map);
                    linkedTextMarker = textMarker;
                    placedUnits.push({ marker: textMarker, type: 'text', customName: `Position: ${formattedMgrs}`, parentUnit: unitMarker });
                    updateUnitHierarchy();
                }
            } catch (error) {
                console.error('Error converting to MGRS:', error);
            }
        }
        copyPositionBtn.addEventListener('click', doCopy);
        copyPositionBtn.addEventListener('touchstart', doCopy, {passive:false});
      }

      // Expose for external usage if needed
      if (!window.TacticalApp) window.TacticalApp = {};
      window.TacticalApp.createUnitFromSymbol = function(symbolKey, lat, lng) {
        createUnitFromSymbolAt(L.latLng(lat, lng), symbolKey);
      };

      // DnD drop support (desktop)
      map.getContainer().addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const symbolKey = e.dataTransfer.getData('text/plain');
        if (!symbolKey || !symbolImages[symbolKey]) return;
        const rect = map.getContainer().getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const latlng = map.containerPointToLatLng([x, y]);
        createUnitFromSymbolAt(latlng, symbolKey);

        ignoreNextMapClick = true;
      });
    }

    // Function to update the unit hierarchy display
    function updateUnitHierarchy() {
      const hierarchyContainer = document.getElementById('unit-hierarchy');
      if (!hierarchyContainer) return;

      // Clear existing content
      hierarchyContainer.innerHTML = '';

      if (placedUnits.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'hierarchy-empty';
        emptyMessage.textContent = 'No units placed on map';
        hierarchyContainer.appendChild(emptyMessage);
        return;
      }

      // Create list for units
      const unitList = document.createElement('ul');
      unitList.className = 'hierarchy-list';

      placedUnits.forEach((unit, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'hierarchy-item';
        if (selectedUnits.includes(unit.marker)) {
          listItem.classList.add('selected');
        }
        if (unit.isLocked) {
          listItem.classList.add('locked');
        }

        const unitDiv = document.createElement('div');
        unitDiv.className = 'hierarchy-unit';

        // Handle different types of units
        if (unit.type === 'distance') {
          // For distance measurements
          const distanceIcon = document.createElement('div');
          distanceIcon.className = 'hierarchy-icon';
          distanceIcon.innerHTML = '📏';
          unitDiv.appendChild(distanceIcon);

          const name = document.createElement('span');
          name.className = 'hierarchy-name';
          name.textContent = unit.customName;
          unitDiv.appendChild(name);
        } else if (unit.symbolKey && symbolImages[unit.symbolKey]) {
          // For symbol units
          const icon = document.createElement('img');
          icon.className = 'hierarchy-icon';
          icon.src = `symbols/${symbolImages[unit.symbolKey].filename}`;
          icon.alt = unit.customName || symbolImages[unit.symbolKey].symbolName;
          unitDiv.appendChild(icon);

          const name = document.createElement('span');
          name.className = 'hierarchy-name';
          name.textContent = unit.customName || symbolImages[unit.symbolKey].symbolName;
          unitDiv.appendChild(name);
        } else {
          // For point markers
          const pointIcon = document.createElement('div');
          pointIcon.className = 'hierarchy-icon';
          pointIcon.style.width = '20px';
          pointIcon.style.height = '20px';
          pointIcon.style.backgroundColor = 'black';
          pointIcon.style.display = 'inline-block';
          unitDiv.appendChild(pointIcon);

          const name = document.createElement('span');
          name.className = 'hierarchy-name';
          name.textContent = unit.customName || `Point ${index + 1}`;
          unitDiv.appendChild(name);
        }

        const actions = document.createElement('div');
        actions.className = 'hierarchy-actions';

        // Only add rename and lock buttons for non-distance items
        if (unit.type !== 'distance') {
          const renameBtn = document.createElement('button');
          renameBtn.className = 'hierarchy-rename-btn';
          renameBtn.innerHTML = '✎';
          renameBtn.onclick = function(e) {
            e.stopPropagation();
            const currentName = unit.customName || (unit.symbolKey ? symbolImages[unit.symbolKey].symbolName : `Point ${index + 1}`);
            const newName = prompt('Enter new name:', currentName);
            if (newName !== null && newName.trim() !== '') {
              unit.customName = newName.trim();
              const markerElement = unit.marker.getElement();
              markerElement.querySelector('.unit-label').textContent = unit.customName;
              updateUnitHierarchy();
            }
          };

          const lockBtn = document.createElement('button');
          lockBtn.className = 'hierarchy-lock-btn';
          lockBtn.innerHTML = unit.isLocked ? '🔒' : '🔓';
          lockBtn.onclick = function(e) {
            e.stopPropagation();
            unit.isLocked = !unit.isLocked;
            const markerElement = unit.marker.getElement();
            const container = markerElement.querySelector('.unit-container');
            const lockBtn = markerElement.querySelector('.unit-lock-btn');
            lockBtn.style.color = unit.isLocked ? '#e74c3c' : '#666';
            container.style.opacity = unit.isLocked ? '0.7' : '1';
            if (unit.isLocked) {
              unit.marker.dragging.disable();
            } else {
              unit.marker.dragging.enable();
            }
            updateUnitHierarchy();
          };

          actions.appendChild(renameBtn);
          actions.appendChild(lockBtn);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'hierarchy-delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = function(e) {
          e.stopPropagation();
          removeUnit(index);
        };

        actions.appendChild(deleteBtn);
        unitDiv.appendChild(actions);
        listItem.appendChild(unitDiv);

        // Add click handler for selection (only for non-distance items)
        if (unit.type !== 'distance') {
          listItem.onclick = function(e) {
            e = e || window.event; // For IE compatibility
            
            if (e.ctrlKey) {
              // Ctrl + click for multiple selection
              if (selectedUnit === unit.marker) {
                // Deselect if clicking the same unit
                selectedUnit.getElement().classList.remove('selected');
                selectedUnit = null;
                selectedUnits = selectedUnits.filter(u => u !== unit.marker);
              } else {
                // Add to selection
                if (!selectedUnits.includes(unit.marker)) {
                  selectedUnits.push(unit.marker);
                  unit.marker.getElement().classList.add('selected');
                }
              }
            } else {
              // Regular click for single selection
              if (selectedUnit === unit.marker) {
                selectedUnit.getElement().classList.remove('selected');
                selectedUnit = null;
                selectedUnits = [];
              } else {
                if (selectedUnit) {
                  selectedUnit.getElement().classList.remove('selected');
                }
                unit.marker.getElement().classList.add('selected');
                selectedUnit = unit.marker;
                selectedUnits = [unit.marker];
              }
            }

            // Show/hide measure distance button
            measureDistanceBtn.style.display = selectedUnits.length === 2 ? 'block' : 'none';

            updateUnitHierarchy();
          };
        }

        unitList.appendChild(listItem);
      });

      hierarchyContainer.appendChild(unitList);
    }

    // Function to remove a unit
    function removeUnit(index) {
      if (index >= 0 && index < placedUnits.length) {
        const unit = placedUnits[index];
        
        // Remove from Firebase first
        if (unit.id) {
          removeUnitFromFirebase(unit.id);
        }
        
        if (unit.type === 'distance') {
          map.removeLayer(unit.marker);
          map.removeLayer(unit.textMarker);
        } else {
          map.removeLayer(unit.marker);
          if (unit.boundingBox) {
            map.removeLayer(unit.boundingBox);
          }
        }
        placedUnits.splice(index, 1);
        if (selectedUnit === unit.marker) {
          selectedUnit = null;
        }
        updateUnitHierarchy();
        saveState(); // Save state after removing unit
      }
    }

    // Add keyboard event listener for delete key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Delete' && selectedUnit) {
        const index = placedUnits.findIndex(unit => unit.marker === selectedUnit);
        if (index !== -1) {
          removeUnit(index);
        }
      }
    });

    // Initialize measurement tools
    function initMeasurementTools() {
      const measureBtn = document.getElementById('measure-distance');
      if (!measureBtn) return;
      
      measureBtn.addEventListener('click', function() {
        if (isMeasuring) {
          // Turn off measuring mode
          isMeasuring = false;
          measureBtn.classList.remove('active');
          measureBtn.textContent = 'Measure Distance';
          
          // Clean up measurement objects
          if (measureLine) {
            map.removeLayer(measureLine);
            measureLine = null;
          }
          if (measureText) {
            map.removeLayer(measureText);
            measureText = null;
          }
          
          // Reset measuring variables
          measureStartPoint = null;
          map.getContainer().style.cursor = 'default';
        } else {
          // Turn on measuring mode
          isMeasuring = true;
          measureBtn.classList.add('active');
          measureBtn.textContent = 'Cancel Measuring';
          
          map.getContainer().style.cursor = 'crosshair';
        }
      });
      
      // Handle clicks for measurements
      map.on('click', function(e) {
        if (ignoreNextMapClick) {
          ignoreNextMapClick = false;
          return;
        }
        if (!isMeasuring) return;
        
        if (!measureStartPoint) {
          // First click - set start point
          measureStartPoint = e.latlng;
          
          // Add a marker for the start point
          L.circleMarker(e.latlng, {
            radius: 5,
            fillColor: '#3498db',
            color: 'white',
            weight: 1,
            fillOpacity: 1
          }).addTo(map);
        } else {
          // Second click - complete the measurement
          const endPos = e.latlng;
          
          // Add end marker
          L.circleMarker(endPos, {
            radius: 5,
            fillColor: '#3498db',
            color: 'white',
            weight: 1,
            fillOpacity: 1
          }).addTo(map);
          
          // Calculate the distance
          const distance = measureStartPoint.distanceTo(endPos);
          
          // Draw the measurement line
          measureLine = L.polyline([
            measureStartPoint,
            endPos
          ], {
            color: '#3498db',
            weight: 2,
            dashArray: '5, 5'
          }).addTo(map);
          
          // Add distance label
          const midPoint = L.latLng(
            (measureStartPoint.lat + endPos.lat) / 2,
            (measureStartPoint.lng + endPos.lng) / 2
          );
          
          measureText = L.marker(midPoint, {
            icon: L.divIcon({
              className: 'measurement-label',
              html: `<div style="background: white; padding: 3px; border-radius: 3px;">${Math.round(distance)} m</div>`,
              iconSize: [100, 20],
              iconAnchor: [50, 10]
            })
          }).addTo(map);
          
          // Reset for the next measurement
          measureStartPoint = null;
        }
      });
    }

    // Initialize text tool
    function initTextTool() {
      const textToolButton = document.getElementById('add-text');
      if (!textToolButton) return;
      
      let isAddingText = false;
      
      textToolButton.addEventListener('click', function() {
        if (isAddingText) {
          // Turn off text adding mode
          isAddingText = false;
          textToolButton.classList.remove('active');
          textToolButton.textContent = 'Add Text';
          map.getContainer().style.cursor = 'default';
        } else {
          // Turn on text adding mode
          isAddingText = true;
          textToolButton.classList.add('active');
          textToolButton.textContent = 'Cancel Text';
          map.getContainer().style.cursor = 'crosshair';
        }
      });
      
      // Handle click for text placement
      map.on('click', function(e) {
        if (ignoreNextMapClick) {
          ignoreNextMapClick = false;
          return;
        }
        if (!isAddingText) return;
        
        // Create a text marker
        const textMarker = L.marker(e.latlng, {
          icon: L.divIcon({
            className: 'text-marker',
            html: '<div contenteditable="true" style="background: white; padding: 5px; border-radius: 3px;">Edit this text</div>',
            iconSize: [200, 30],
            iconAnchor: [100, 15]
          })
        }).addTo(map);
        
        // Turn off text adding mode
        isAddingText = false;
        textToolButton.classList.remove('active');
        textToolButton.textContent = 'Add Text';
        map.getContainer().style.cursor = 'default';
      });
    }

    // Initialize text formatting
    function initTextFormatting() {
      const textColorPicker = document.getElementById('text-color');
      const bgColorPicker = document.getElementById('text-bg-color');
      const textSizeSlider = document.getElementById('text-size');
      
      if (!textColorPicker || !bgColorPicker || !textSizeSlider) return;
      
      // Handle text color change
      textColorPicker.addEventListener('input', function() {
        const activeMarker = document.querySelector('.text-marker.selected');
        if (activeMarker) {
          activeMarker.querySelector('div').style.color = this.value;
        }
      });
      
      // Handle background color change
      bgColorPicker.addEventListener('input', function() {
        const activeMarker = document.querySelector('.text-marker.selected');
        if (activeMarker) {
          activeMarker.querySelector('div').style.backgroundColor = this.value;
        }
      });
      
      // Handle text size change
      textSizeSlider.addEventListener('input', function() {
        const activeMarker = document.querySelector('.text-marker.selected');
        if (activeMarker) {
          activeMarker.querySelector('div').style.fontSize = this.value + 'px';
        }
      });
    }

    // Prevent scroll on selection
    function preventScrollOnSelection() {
      const unitHierarchy = document.getElementById('unit-hierarchy');
      if (unitHierarchy) {
        unitHierarchy.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
        }, { passive: false });
      }
      // Ensure sidebar scroll doesn't pan the map on touch
      const sidebar = document.getElementById('sidebar');
      if (sidebar && window.L && L.DomEvent) {
        try {
          L.DomEvent.disableScrollPropagation(sidebar);
          L.DomEvent.disableClickPropagation(sidebar);
        } catch(_){}
        sidebar.addEventListener('touchmove', function(e){ e.stopPropagation(); }, {passive:false});
      }
    }

    // Create measure distance button
    function createMeasureDistanceButton() {
        measureDistanceBtn = document.createElement('button');
        measureDistanceBtn.className = 'measure-distance-btn';
        measureDistanceBtn.textContent = 'Get Distance';
        measureDistanceBtn.onclick = measureDistance;
        measureDistanceBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            display: none;
        `;
        measureDistanceBtn.onmouseover = function() {
            this.style.background = '#2980b9';
        };
        measureDistanceBtn.onmouseout = function() {
            this.style.background = '#3498db';
        };
        
        // Add to map container instead of body for proper positioning
        map.getContainer().appendChild(measureDistanceBtn);
    }

    // Function to calculate distance and azimuth between two points
    function calculateDistanceAndAzimuth(point1, point2) {
        const distance = point1.distanceTo(point2);
        const lat1 = point1.lat * Math.PI / 180;
        const lat2 = point2.lat * Math.PI / 180;
        const dLon = (point2.lng - point1.lng) * Math.PI / 180;

        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        let azimuth = Math.atan2(y, x) * 180 / Math.PI;
        azimuth = (azimuth + 360) % 360; // Normalize to 0-360

        return { distance, azimuth };
    }

    // Function to measure distance between selected units
    function measureDistance() {
        if (selectedUnits.length !== 2) return;

        const point1 = selectedUnits[0].getLatLng();
        const point2 = selectedUnits[1].getLatLng();
        const { distance, azimuth } = calculateDistanceAndAzimuth(point1, point2);

        // Create a polyline for the dotted line
        const line = L.polyline([point1, point2], {
            color: '#000',
            weight: 2,
            dashArray: '5, 5',
            opacity: 0.8
        }).addTo(map);

        // Create a marker for the distance and azimuth text
        const midPoint = L.latLng(
            (point1.lat + point2.lat) / 2,
            (point1.lng + point2.lng) / 2
        );

        const textMarker = L.marker(midPoint, {
            icon: L.divIcon({
                className: 'distance-text',
                html: `<div style="background: white; padding: 2px 4px; border-radius: 2px; font-weight: bold; text-shadow: 1px 1px 2px rgba(255,255,255,0.8);">
                    ${Math.round(distance)}m<br>
                    ${Math.round(azimuth)}°
                </div>`,
                iconSize: [100, 40],
                iconAnchor: [50, 20]
            })
        }).addTo(map);

        // Add to placed units for hierarchy
        placedUnits.push({
            marker: line,
            textMarker: textMarker,
            type: 'distance',
            distance: distance,
            azimuth: azimuth,
            customName: `Distance: ${Math.round(distance)}m, Azimuth: ${Math.round(azimuth)}°`
        });

        // Update hierarchy
        updateUnitHierarchy();

        // Clear selection
        selectedUnits.forEach(unit => {
            unit.getElement().classList.remove('selected');
        });
        selectedUnits = [];
        measureDistanceBtn.style.display = 'none';
    }

    // Initialize everything when DOM is loaded
    initializeTabs();
    
    // Load all symbols and initialize the app
    loadAllSymbols().then(() => {
        // Initialize the app once images are loaded
        initUnitPalette();
        initMeasurementTools();
        initTextTool();
        preventScrollOnSelection();
        createMeasureDistanceButton();
        

        
        // Initial grid update
        updateGrid();
        
        // Initialize hierarchy display
        updateUnitHierarchy();
        
        // Load saved state after symbols are loaded
        loadState();
        
        // Initialize route plan functionality
        initRoutePlan();
        
        // Initialize save/load functionality
        initSaveLoadControls();
    }).catch(error => {
        console.error('Error initializing app:', error);
        alert('Failed to initialize the application. Please refresh the page and try again.');
    });

    // Handle clear units button
    document.getElementById('clear-units').addEventListener('click', function() {
      if (confirm('Are you sure you want to clear all units?')) {
        // Remove all unit markers
        placedUnits.forEach(unit => {
          map.removeLayer(unit.marker);
          if (unit.boundingBox) {
            map.removeLayer(unit.boundingBox);
          }
        });
        
        // Clear placed units array
        placedUnits = [];
        
        // Clear selection
        selectedUnit = null;
        
        // Update hierarchy
        updateUnitHierarchy();
      }
    });

    // Handle export image button
    document.getElementById('export-image').addEventListener('click', function() {
      // Use html2canvas to capture the map
      html2canvas(map.getContainer()).then(canvas => {
        const link = document.createElement('a');
        link.download = 'tactical-plan.png';
        link.href = canvas.toDataURL();
        link.click();
      });
    });

    // Set map to 1:25,000 scale on initialization
    map.setZoom(15); // Zoom level 15 corresponds to approximately 1:25,000 scale
    
    // Function to create a point at current mouse position
    function createPointAtMousePosition() {
      // Get the coordinates the same way F1 does - from the current mouse position display
      const coordDisplay = document.getElementById('cursor-position');
      const mgrsText = coordDisplay.getAttribute('data-mgrs');
      
      if (mgrsText) {
        try {
          // Convert MGRS to lat/lng using the same method as "Go To"
          const point = window.mgrs.toPoint(mgrsText);
          createPointMarker(point[1], point[0]); // point[1] is lat, point[0] is lng
        } catch (error) {
          console.error('Error converting MGRS to coordinates:', error);
          alert('Error getting coordinates. Please move your mouse over the map first.');
        }
      } else {
        // Fallback to map center if no mouse position is available
        const center = map.getCenter();
        createPointMarker(center.lat, center.lng);
      }
    }
    
    // Function to create a point marker (same as Go To functionality)
    function createPointMarker(lat, lng) {
      try {
        // Convert lat/lng to MGRS coordinates
        const mgrsRef = window.mgrs.forward([lng, lat]);
        const formattedMgrs = formatMgrs(mgrsRef);
        
        // Use the MGRS coordinates as the default name (same as Go To)
        const defaultName = formattedMgrs;
        
        // Create a new unit marker for the point (same structure as Go To)
        const pointMarker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'unit-marker',
            html: `
              <div class="unit-container">
                <div style="width: 20px; height: 20px; background-color: black; margin: 10px;"></div>
                <div class="unit-label">${defaultName}</div>
                <div class="unit-controls">
                  <button class="unit-rotate-btn">⟳</button>
                  <button class="unit-lock-btn">🔒</button>
                  <button class="unit-resize-btn">⤡</button>
                </div>
              </div>
            `,
            iconSize: [60, 80],
            iconAnchor: [30, 40]
          })
        }).addTo(map);

        // Make marker draggable
        pointMarker.dragging.enable();
        
        // Add drag event handler to update coordinates in real-time
        pointMarker.on('drag', function(e) {
          const latlng = e.target.getLatLng();
          try {
            // Convert new position to MGRS
            const mgrsRef = window.mgrs.forward([latlng.lng, latlng.lat]);
            const formattedMgrs = formatMgrs(mgrsRef);
            
            // Update the point's label with new coordinates
            const labelElement = markerElement.querySelector('.unit-label');
            labelElement.textContent = formattedMgrs;
            
            // Update the unit's custom name
            const point = placedUnits.find(p => p.marker === pointMarker);
            if (point) {
              point.customName = formattedMgrs;
              point.position = [latlng.lat, latlng.lng];
            }
          } catch (error) {
            console.error('Error updating coordinates during drag:', error);
          }
        });

        // Add rotation and lock functionality (same as Go To)
        const markerElement = pointMarker.getElement();
        const container = markerElement.querySelector('.unit-container');
        const rotateBtn = markerElement.querySelector('.unit-rotate-btn');
        const lockBtn = markerElement.querySelector('.unit-lock-btn');
        const resizeBtn = markerElement.querySelector('.unit-resize-btn');
        const pointDiv = markerElement.querySelector('div[style*="background-color: black"]');
        let rotation = 0;
        let isLocked = false;
        let customName = defaultName; // Set the MGRS coordinates as the initial custom name

        // Rotation functionality (same as Go To)
        let isRotating = false;
        let startAngle = 0;
        let currentRotation = 0;
        let wasRotating = false;

        rotateBtn.addEventListener('mousedown', function(e) {
          e.stopPropagation();
          if (!isLocked) {
            isRotating = true;
            wasRotating = false;
            const rect = map.getContainer().getBoundingClientRect();
            const markerRect = markerElement.getBoundingClientRect();
            const centerX = markerRect.left + markerRect.width/2 - rect.left;
            const centerY = markerRect.top + markerRect.height/2 - rect.top;
            startAngle = Math.atan2(e.clientY - rect.top - centerY, e.clientX - rect.left - centerX);
            
            document.addEventListener('mousemove', handleRotation);
            document.addEventListener('mouseup', stopRotation);
            document.body.style.cursor = 'grab';
          }
        });

        function handleRotation(e) {
          if (!isRotating) return;
          wasRotating = true;
          
          const rect = map.getContainer().getBoundingClientRect();
          const markerRect = markerElement.getBoundingClientRect();
          const centerX = markerRect.left + markerRect.width/2 - rect.left;
          const centerY = markerRect.top + markerRect.height/2 - rect.top;
          
          const currentAngle = Math.atan2(e.clientY - rect.top - centerY, e.clientX - rect.left - centerX);
          let angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
          
          currentRotation = (rotation + angleDiff) % 360;
          container.style.transform = `rotate(${currentRotation}deg)`;
        }

        function stopRotation() {
          if (isRotating) {
            isRotating = false;
            rotation = currentRotation;
            
            const point = placedUnits.find(p => p.marker === pointMarker);
            if (point) {
              point.rotation = rotation;
              updateUnitHierarchy();
            }
            
            document.removeEventListener('mousemove', handleRotation);
            document.removeEventListener('mouseup', stopRotation);
            document.body.style.cursor = 'default';
          }
        }

        rotateBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (!isLocked && !isRotating && !wasRotating) {
            rotation = (rotation + 45) % 360;
            container.style.transform = `rotate(${rotation}deg)`;
            const point = placedUnits.find(p => p.marker === pointMarker);
            if (point) {
              point.rotation = rotation;
              updateUnitHierarchy();
            }
          }
          wasRotating = false;
        });

        // Resize functionality (same as Go To)
        let isResizing = false;
        let startSize = 20;
        resizeBtn.addEventListener('mousedown', function(e) {
          e.stopPropagation();
          if (!isLocked) {
            isResizing = true;
            startSize = parseInt(pointDiv.style.width);
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
          }
        });

        function handleResize(e) {
          if (!isResizing) return;
          const rect = map.getContainer().getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const markerRect = markerElement.getBoundingClientRect();
          const markerX = markerRect.left - rect.left;
          const markerY = markerRect.top - rect.top;
          
          const dx = x - markerX;
          const dy = y - markerY;
          const newSize = Math.max(10, Math.min(100, Math.max(Math.abs(dx), Math.abs(dy))));
          
          pointDiv.style.width = `${newSize}px`;
          pointDiv.style.height = `${newSize}px`;
          
          container.style.width = `${newSize + 20}px`;
          container.style.height = `${newSize + 40}px`;
        }

        function stopResize() {
          isResizing = false;
          document.removeEventListener('mousemove', handleResize);
          document.removeEventListener('mouseup', stopResize);
        }

        // Lock functionality (same as Go To)
        lockBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          isLocked = !isLocked;
          lockBtn.style.color = isLocked ? '#e74c3c' : '#666';
          container.style.opacity = isLocked ? '0.7' : '1';
          if (isLocked) {
            pointMarker.dragging.disable();
          } else {
            pointMarker.dragging.enable();
          }
          const point = placedUnits.find(p => p.marker === pointMarker);
          if (point) {
            point.isLocked = isLocked;
            updateUnitHierarchy();
          }
        });

        // Click handler for selection (same as Go To)
        container.addEventListener('click', function(e) {
          e.stopPropagation();
          
          if (e.ctrlKey) {
            // Ctrl + click for multiple selection
            if (selectedUnit === pointMarker) {
              // Deselect if clicking the same unit
              selectedUnit.getElement().classList.remove('selected');
              selectedUnit = null;
              selectedUnits = selectedUnits.filter(u => u !== pointMarker);
            } else {
              // Add to selection
              if (!selectedUnits.includes(pointMarker)) {
                selectedUnits.push(pointMarker);
                pointMarker.getElement().classList.add('selected');
              }
            }
          } else {
            // Regular click for single selection
            if (selectedUnit === pointMarker) {
              selectedUnit.getElement().classList.remove('selected');
              selectedUnit = null;
              selectedUnits = [];
            } else {
              if (selectedUnit) {
                selectedUnit.getElement().classList.remove('selected');
              }
              pointMarker.getElement().classList.add('selected');
              selectedUnit = pointMarker;
              selectedUnits = [pointMarker];
            }
          }

          // Show/hide measure distance button
          measureDistanceBtn.style.display = selectedUnits.length === 2 ? 'block' : 'none';

          updateUnitHierarchy();
        });

        // Double-click to rename (same as Go To)
        container.addEventListener('dblclick', function(e) {
          e.stopPropagation();
          if (!isLocked) {
            const currentName = customName || defaultName;
            const newName = prompt('Enter new name:', currentName);
            if (newName !== null && newName.trim() !== '') {
              customName = newName.trim();
              markerElement.querySelector('.unit-label').textContent = customName;
              const point = placedUnits.find(p => p.marker === pointMarker);
              if (point) {
                point.customName = customName;
                updateUnitHierarchy();
              }
            }
          }
                });
        
        // Add dragend event handler to finalize position and update hierarchy
        pointMarker.on('dragend', function(e) {
          const latlng = e.target.getLatLng();
          const point = placedUnits.find(p => p.marker === pointMarker);
          if (point) {
            point.position = [latlng.lat, latlng.lng];
            updateUnitHierarchy();
            saveState();
          }
        });
        
        // Add the point to the placed points array (same structure as Go To)
        placedUnits.push({
          marker: pointMarker,
          position: [lat, lng],
          rotation: 0,
          isLocked: false,
          customName: defaultName, // Use MGRS coordinates as the default name
          type: 'point'
        });

        // Update the point hierarchy
        updateUnitHierarchy();
        
        // Save state
        saveState();
        
        console.log(`Created point at MGRS: ${formattedMgrs}`);
      } catch (error) {
        console.error('Error creating point:', error);
        alert('Error creating point. Please try again.');
      }
    }
    
    // Function to create a TRP at current mouse position
    function createTRPAtMousePosition() {
      // Get the coordinates the same way F1 does - from the current mouse position display
      const coordDisplay = document.getElementById('cursor-position');
      const mgrsText = coordDisplay.getAttribute('data-mgrs');
      
      if (mgrsText) {
        try {
          // Convert MGRS to lat/lng using the same method as "Go To"
          const point = window.mgrs.toPoint(mgrsText);
          createTRPMarker(point[1], point[0]); // point[1] is lat, point[0] is lng
        } catch (error) {
          console.error('Error converting MGRS to coordinates:', error);
          alert('Error getting coordinates. Please move your mouse over the map first.');
        }
      } else {
        // Fallback to map center if no mouse position is available
        const center = map.getCenter();
        createTRPMarker(center.lat, center.lng);
      }
    }
    
    // Function to create a TRP marker
    function createTRPMarker(lat, lng) {
      try {
        // Convert lat/lng to MGRS coordinates
        const mgrsRef = window.mgrs.forward([lng, lat]);
        const formattedMgrs = formatMgrs(mgrsRef);
        
        // Use the MGRS coordinates as the default name
        const defaultName = formattedMgrs;
        
        // Create a new unit marker for the TRP
        const trpMarker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'unit-marker trp-marker',
            html: `
              <div class="unit-container">
                <img src="symbols/TRP.png" style="width: 40px; height: 40px; object-fit: contain;">
                <div class="unit-label">${defaultName}</div>
                <div class="unit-controls">
                  <button class="unit-rotate-btn">⟳</button>
                  <button class="unit-lock-btn">🔒</button>
                  <button class="unit-resize-btn">⤡</button>
                </div>
                <div class="trp-info-table" style="display: none;">
                  <table>
                    <tr><td><strong>Target:</strong></td><td>AB1000</td></tr>
                    <tr><td><strong>Trigger:</strong></td><td>PL Victory</td></tr>
                    <tr><td><strong>Location:</strong></td><td>${formattedMgrs}</td></tr>
                    <tr><td><strong>Observer:</strong></td><td>(P) 1st PLT FO (A) WPNS SL</td></tr>
                    <tr><td><strong>Delivery:</strong></td><td>60mm MTR</td></tr>
                    <tr><td><strong>ATG:</strong></td><td>6x RDS HE</td></tr>
                    <tr><td><strong>Comms:</strong></td><td>(P) CO Fires (A) BN Fires</td></tr>
                  </table>
                </div>
              </div>
            `,
            iconSize: [60, 120], // Increased height to accommodate the info table
            iconAnchor: [30, 60]
          })
        }).addTo(map);

        // Make marker draggable
        trpMarker.dragging.enable();
        
        // Add drag event handler to update coordinates in real-time
        trpMarker.on('drag', function(e) {
          const latlng = e.target.getLatLng();
          try {
            // Convert new position to MGRS
            const mgrsRef = window.mgrs.forward([latlng.lng, latlng.lat]);
            const formattedMgrs = formatMgrs(mgrsRef);
            
            // Update the point's label with new coordinates
            const labelElement = markerElement.querySelector('.unit-label');
            labelElement.textContent = formattedMgrs;
            
            // Update the location in the info table
            const locationCell = markerElement.querySelector('.trp-info-table td:nth-child(2)');
            if (locationCell) {
              locationCell.textContent = formattedMgrs;
            }
            
            // Update the unit's custom name
            const point = placedUnits.find(p => p.marker === trpMarker);
            if (point) {
              point.customName = formattedMgrs;
              point.position = [latlng.lat, latlng.lng];
            }
          } catch (error) {
            console.error('Error updating coordinates during drag:', error);
          }
        });
        
        // Add dragend event handler to finalize position and update hierarchy
        trpMarker.on('dragend', function(e) {
          const latlng = e.target.getLatLng();
          const point = placedUnits.find(p => p.marker === trpMarker);
          if (point) {
            point.position = [latlng.lat, latlng.lng];
            updateUnitHierarchy();
            saveState();
          }
        });

        // Add rotation and lock functionality (same as other points)
        const markerElement = trpMarker.getElement();
        const container = markerElement.querySelector('.unit-container');
        const rotateBtn = markerElement.querySelector('.unit-rotate-btn');
        const lockBtn = markerElement.querySelector('.unit-lock-btn');
        const resizeBtn = markerElement.querySelector('.unit-resize-btn');
        const trpImage = markerElement.querySelector('img');
        let rotation = 0;
        let isLocked = false;
        let customName = defaultName;

        // Rotation functionality
        let isRotating = false;
        let startAngle = 0;
        let currentRotation = 0;
        let wasRotating = false;

        rotateBtn.addEventListener('mousedown', function(e) {
          e.stopPropagation();
          if (!isLocked) {
            isRotating = true;
            wasRotating = false;
            const rect = map.getContainer().getBoundingClientRect();
            const markerRect = markerElement.getBoundingClientRect();
            const centerX = markerRect.left + markerRect.width/2 - rect.left;
            const centerY = markerRect.top + markerRect.height/2 - rect.top;
            startAngle = Math.atan2(e.clientY - rect.top - centerY, e.clientX - rect.left - centerX);
            
            document.addEventListener('mousemove', handleRotation);
            document.addEventListener('mouseup', stopRotation);
            document.body.style.cursor = 'grab';
          }
        });

        function handleRotation(e) {
          if (!isRotating) return;
          wasRotating = true;
          
          const rect = map.getContainer().getBoundingClientRect();
          const markerRect = markerElement.getBoundingClientRect();
          const centerX = markerRect.left + markerRect.width/2 - rect.left;
          const centerY = markerRect.top + markerRect.height/2 - rect.top;
          
          const currentAngle = Math.atan2(e.clientY - rect.top - centerY, e.clientX - rect.left - centerX);
          let angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
          
          currentRotation = (rotation + angleDiff) % 360;
          container.style.transform = `rotate(${currentRotation}deg)`;
        }

        function stopRotation() {
          if (isRotating) {
            isRotating = false;
            rotation = currentRotation;
            
            const point = placedUnits.find(p => p.marker === trpMarker);
            if (point) {
              point.rotation = rotation;
              updateUnitHierarchy();
            }
            
            document.removeEventListener('mousemove', handleRotation);
            document.removeEventListener('mouseup', stopRotation);
            document.body.style.cursor = 'default';
          }
        }

        rotateBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (!isLocked && !isRotating && !wasRotating) {
            rotation = (rotation + 45) % 360;
            container.style.transform = `rotate(${rotation}deg)`;
            const point = placedUnits.find(p => p.marker === trpMarker);
            if (point) {
              point.rotation = rotation;
              updateUnitHierarchy();
            }
          }
          wasRotating = false;
        });

        // Resize functionality
        let isResizing = false;
        let startSize = 40;
        resizeBtn.addEventListener('mousedown', function(e) {
          e.stopPropagation();
          if (!isLocked) {
            isResizing = true;
            startSize = parseInt(trpImage.style.width);
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
          }
        });

        function handleResize(e) {
          if (!isResizing) return;
          const rect = map.getContainer().getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const markerRect = markerElement.getBoundingClientRect();
          const markerX = markerRect.left - rect.left;
          const markerY = markerRect.top - rect.top;
          
          const dx = x - markerX;
          const dy = y - markerY;
          const newSize = Math.max(20, Math.min(100, Math.max(Math.abs(dx), Math.abs(dy))));
          
          trpImage.style.width = `${newSize}px`;
          trpImage.style.height = `${newSize}px`;
          
          container.style.width = `${newSize + 20}px`;
          container.style.height = `${newSize + 80}px`;
        }

        function stopResize() {
          isResizing = false;
          document.removeEventListener('mousemove', handleResize);
          document.removeEventListener('mouseup', stopResize);
        }

        // Lock functionality
        lockBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          isLocked = !isLocked;
          lockBtn.style.color = isLocked ? '#e74c3c' : '#666';
          container.style.opacity = isLocked ? '0.7' : '1';
          if (isLocked) {
            trpMarker.dragging.disable();
          } else {
            trpMarker.dragging.enable();
          }
          const point = placedUnits.find(p => p.marker === trpMarker);
          if (point) {
            point.isLocked = isLocked;
            updateUnitHierarchy();
          }
        });

        // Click handler for selection
        container.addEventListener('click', function(e) {
          e.stopPropagation();
          
          if (e.ctrlKey) {
            // Ctrl + click for multiple selection
            if (selectedUnit === trpMarker) {
              selectedUnit.getElement().classList.remove('selected');
              selectedUnit = null;
              selectedUnits = selectedUnits.filter(u => u !== trpMarker);
            } else {
              if (!selectedUnits.includes(trpMarker)) {
                selectedUnits.push(trpMarker);
                trpMarker.getElement().classList.add('selected');
              }
            }
          } else {
            // Regular click for single selection
            if (selectedUnit === trpMarker) {
              selectedUnit.getElement().classList.remove('selected');
              selectedUnit = null;
              selectedUnits = [];
            } else {
              if (selectedUnit) {
                selectedUnit.getElement().classList.remove('selected');
              }
              trpMarker.getElement().classList.add('selected');
              selectedUnit = trpMarker;
              selectedUnits = [trpMarker];
            }
          }

          // Show/hide measure distance button
          measureDistanceBtn.style.display = selectedUnits.length === 2 ? 'block' : 'none';

          updateUnitHierarchy();
        });

        // Double-click to rename
        container.addEventListener('dblclick', function(e) {
          e.stopPropagation();
          if (!isLocked) {
            const currentName = customName || defaultName;
            const newName = prompt('Enter new name:', currentName);
            if (newName !== null && newName.trim() !== '') {
              customName = newName.trim();
              markerElement.querySelector('.unit-label').textContent = customName;
              const point = placedUnits.find(p => p.marker === trpMarker);
              if (point) {
                point.customName = customName;
                updateUnitHierarchy();
              }
            }
          }
        });

        // Hover functionality for TRP info table
        container.addEventListener('mouseenter', function(e) {
          const infoTable = markerElement.querySelector('.trp-info-table');
          if (infoTable) {
            infoTable.style.display = 'block';
          }
        });

        container.addEventListener('mouseleave', function(e) {
          const infoTable = markerElement.querySelector('.trp-info-table');
          if (infoTable) {
            infoTable.style.display = 'none';
          }
        });

        // Add the TRP to the placed points array
        placedUnits.push({
          marker: trpMarker,
          position: [lat, lng],
          rotation: 0,
          isLocked: false,
          customName: defaultName,
          type: 'trp'
        });

        // Update the point hierarchy
        updateUnitHierarchy();
        
        // Save state
        saveState();
        
        console.log(`Created TRP at MGRS: ${formattedMgrs}`);
      } catch (error) {
        console.error('Error creating TRP:', error);
        alert('Error creating TRP. Please try again.');
      }
    }
    
    // Initialize route plan functionality
    function initRoutePlan() {
      const addRouteLegBtn = document.getElementById('add-route-leg');
      const routePlanList = document.getElementById('route-plan-list');
      
      // Add route leg button functionality
      addRouteLegBtn.addEventListener('click', function() {
        addRouteLeg();
      });
      
      // Initialize remove buttons for existing route legs
      document.querySelectorAll('.route-remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          removeRouteLeg(this);
        });
      });
      
      // Initialize notes buttons for existing route legs
      document.querySelectorAll('.route-notes-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const routeLeg = this.closest('.route-leg');
          const notesSection = routeLeg.nextElementSibling;
          if (notesSection && notesSection.classList.contains('route-notes')) {
            toggleRouteNotes(this, notesSection);
          }
        });
      });
    }
    
    // Function to add a new route leg
    function addRouteLeg() {
      const routePlanList = document.getElementById('route-plan-list');
      const legCount = routePlanList.children.length + 1;
      
      const routeLeg = document.createElement('div');
      routeLeg.className = 'route-leg';
      routeLeg.setAttribute('data-leg', legCount);
      
      routeLeg.innerHTML = `
        <input type="text" class="route-from" placeholder="From" style="width: 45px;">
        <span>→</span>
        <input type="text" class="route-to" placeholder="To" style="width: 45px;">
        <span>(</span>
        <input type="number" class="route-distance" placeholder="m" style="width: 50px;">
        <span>m,</span>
        <input type="number" class="route-azimuth" placeholder="°" style="width: 50px;">
        <span>°,</span>
        <input type="text" class="route-direction" placeholder="dir" style="width: 30px;">
        <span>)</span>
        <button class="route-notes-btn" style="margin-left: 3px; padding: 1px 4px; background: #27ae60; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">+</button>
        <button class="route-remove-btn" style="margin-left: 3px; padding: 1px 4px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">-</button>
      `;
      
      // Add notes section
      const notesSection = document.createElement('div');
      notesSection.className = 'route-notes';
      notesSection.style.display = 'none';
      notesSection.style.marginTop = '5px';
      notesSection.style.marginBottom = '8px';
      notesSection.innerHTML = `
        <textarea class="route-notes-text" placeholder="Enter notes for this route leg..." style="width: 100%; height: 60px; padding: 5px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px; font-family: Arial, sans-serif; resize: vertical;"></textarea>
      `;
      
      routePlanList.appendChild(routeLeg);
      routePlanList.appendChild(notesSection);
      
      // Add click handler for the remove button
      const removeBtn = routeLeg.querySelector('.route-remove-btn');
      removeBtn.addEventListener('click', function() {
        removeRouteLeg(this);
      });
      
      // Add click handler for the notes button
      const notesBtn = routeLeg.querySelector('.route-notes-btn');
      notesBtn.addEventListener('click', function() {
        toggleRouteNotes(this, notesSection);
      });
      
      // Update leg numbers
      updateRouteLegNumbers();
    }
    
    // Function to remove a route leg
    function removeRouteLeg(button) {
      const routeLeg = button.closest('.route-leg');
      const routePlanList = document.getElementById('route-plan-list');
      
      // Don't remove if it's the last leg
      if (routePlanList.children.length > 2) { // Account for notes sections
        // Remove the route leg and its associated notes section
        const notesSection = routeLeg.nextElementSibling;
        if (notesSection && notesSection.classList.contains('route-notes')) {
          notesSection.remove();
        }
        routeLeg.remove();
        updateRouteLegNumbers();
      } else {
        // Clear the inputs instead of removing
        routeLeg.querySelectorAll('input').forEach(input => {
          input.value = '';
        });
        // Clear notes if they exist
        const notesSection = routeLeg.nextElementSibling;
        if (notesSection && notesSection.classList.contains('route-notes')) {
          const textarea = notesSection.querySelector('.route-notes-text');
          if (textarea) {
            textarea.value = '';
          }
          notesSection.style.display = 'none';
        }
      }
    }
    
    // Function to update route leg numbers
    function updateRouteLegNumbers() {
      const routeLegs = document.querySelectorAll('.route-leg');
      routeLegs.forEach((leg, index) => {
        leg.setAttribute('data-leg', index + 1);
      });
    }
    
    // Function to toggle route notes
    function toggleRouteNotes(button, notesSection) {
      const isVisible = notesSection.style.display !== 'none';
      
      if (isVisible) {
        notesSection.style.display = 'none';
        button.textContent = '+';
        button.style.backgroundColor = '#27ae60';
      } else {
        notesSection.style.display = 'block';
        button.textContent = '−';
        button.style.backgroundColor = '#f39c12';
      }
    }
    
    // Initialize save/load controls
    function initSaveLoadControls() {
      const saveBtn = document.getElementById('save-route-plan');
      const loadBtn = document.getElementById('load-route-plan');
      const clearBtn = document.getElementById('clear-route-plan');
      
      saveBtn.addEventListener('click', saveMission);
      loadBtn.addEventListener('click', loadMission);
      clearBtn.addEventListener('click', clearMission);
    }
    
    // Function to save mission data
    function saveMission() {
      const filename = prompt('Enter a name for this save:');
      if (!filename) return;
      
      // Collect route plan data
      const routePlanData = [];
      const routeLegs = document.querySelectorAll('.route-leg');
      
      routeLegs.forEach((leg, index) => {
        const from = leg.querySelector('.route-from').value;
        const to = leg.querySelector('.route-to').value;
        const distance = leg.querySelector('.route-distance').value;
        const azimuth = leg.querySelector('.route-azimuth').value;
        const direction = leg.querySelector('.route-direction').value;
        
        // Get notes for this leg
        const notesSection = leg.nextElementSibling;
        let notes = '';
        if (notesSection && notesSection.classList.contains('route-notes')) {
          const textarea = notesSection.querySelector('.route-notes-text');
          if (textarea) {
            notes = textarea.value;
          }
        }
        
        routePlanData.push({
          from,
          to,
          distance,
          azimuth,
          direction,
          notes
        });
      });
      
      // Collect all mission data
      const missionData = {
        timestamp: new Date().toISOString(),
        mapView: {
          center: map.getCenter(),
          zoom: map.getZoom()
        },
        placedUnits: placedUnits.map(unit => ({
          position: unit.position,
          symbolKey: unit.symbolKey,
          rotation: unit.rotation,
          size: unit.size,
          customName: unit.customName,
          isLocked: unit.isLocked,
          type: unit.type,
          distance: unit.distance,
          azimuth: unit.azimuth
        })),
        routePlan: routePlanData
      };
      
      // Send save request to server
      fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: filename,
          data: missionData
        })
      })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          alert('Mission saved successfully!');
        } else {
          alert('Error saving mission: ' + result.error);
        }
      })
      .catch(error => {
        console.error('Error saving mission:', error);
        alert('Error saving mission. Please try again.');
      });
    }
    
    // Function to load mission data
    function loadMission() {
      // First get list of available saves
      fetch('/api/saves')
        .then(response => response.json())
        .then(result => {
          if (result.saves && result.saves.length > 0) {
            const saveList = result.saves.map(save => save.replace('.json', '')).join('\n');
            const filename = prompt('Enter the name of the save to load:\n\nAvailable saves:\n' + saveList);
            
            if (filename) {
              loadMissionFile(filename);
            }
          } else {
            alert('No saved missions found.');
          }
        })
        .catch(error => {
          console.error('Error getting saves list:', error);
          alert('Error loading saves list. Please try again.');
        });
    }
    
    // Function to load a specific mission file
    function loadMissionFile(filename) {
      fetch(`/api/load/${filename}`)
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            loadMissionData(result.data);
          } else {
            alert('Error loading mission: ' + result.error);
          }
        })
        .catch(error => {
          console.error('Error loading mission:', error);
          alert('Error loading mission. Please try again.');
        });
    }
    
    // Function to load mission data into the application
    function loadMissionData(data) {
      // Clear current state
      clearMission();
      
      // Load map view
      if (data.mapView) {
        map.setView(data.mapView.center, data.mapView.zoom);
      }
      
      // Load placed units
      if (data.placedUnits) {
        data.placedUnits.forEach(unitData => {
          // Recreate units based on type
          if (unitData.type === 'point') {
            createPointMarker(unitData.position[0], unitData.position[1]);
          } else if (unitData.type === 'trp') {
            createTRPMarker(unitData.position[0], unitData.position[1]);
          } else if (unitData.symbolKey && symbolImages[unitData.symbolKey]) {
            // Recreate symbol units
            const marker = L.marker(unitData.position, {
              icon: L.divIcon({
                className: 'unit-marker',
                html: `
                  <div class="unit-container">
                    <img src="symbols/${symbolImages[unitData.symbolKey].filename}" style="transform: rotate(${unitData.rotation}deg); width: ${unitData.size}px; height: ${unitData.size}px; object-fit: contain;">
                    <div class="unit-label">${unitData.customName || symbolImages[unitData.symbolKey].symbolName}</div>
                    <div class="unit-controls">
                      <button class="unit-rotate-btn">⟳</button>
                      <button class="unit-lock-btn">🔒</button>
                      <button class="unit-resize-btn">⤡</button>
                      <button class="unit-copy-position-btn">📋</button>
                    </div>
                  </div>
                `,
                iconSize: [unitData.size + 20, unitData.size + 40],
                iconAnchor: [(unitData.size + 20) / 2, unitData.size + 40]
              })
            }).addTo(map);
            
            const unit = {
              marker: marker,
              position: unitData.position,
              symbolKey: unitData.symbolKey,
              rotation: unitData.rotation || 0,
              size: unitData.size || 40,
              customName: unitData.customName,
              isLocked: unitData.isLocked || false,
              type: unitData.type || 'symbol'
            };
            
            placedUnits.push(unit);
            addMarkerInteractivity(marker, unit);
          }
        });
        
        updateUnitHierarchy();
      }
      
      // Load route plan
      if (data.routePlan) {
        // Clear existing route plan
        const routePlanList = document.getElementById('route-plan-list');
        routePlanList.innerHTML = '';
        
        data.routePlan.forEach((legData, index) => {
          addRouteLeg();
          
          // Get the newly created leg
          const newLeg = routePlanList.children[routePlanList.children.length - 2]; // -2 because notes section is added after
          const notesSection = routePlanList.children[routePlanList.children.length - 1];
          
          // Fill in the data
          newLeg.querySelector('.route-from').value = legData.from || '';
          newLeg.querySelector('.route-to').value = legData.to || '';
          newLeg.querySelector('.route-distance').value = legData.distance || '';
          newLeg.querySelector('.route-azimuth').value = legData.azimuth || '';
          newLeg.querySelector('.route-direction').value = legData.direction || '';
          
          // Fill in notes if they exist
          if (legData.notes && notesSection) {
            const textarea = notesSection.querySelector('.route-notes-text');
            if (textarea) {
              textarea.value = legData.notes;
              notesSection.style.display = 'block';
              const notesBtn = newLeg.querySelector('.route-notes-btn');
              if (notesBtn) {
                notesBtn.textContent = '−';
                notesBtn.style.backgroundColor = '#f39c12';
              }
            }
          }
        });
      }
      
      alert('Mission loaded successfully!');
    }
    
    // Function to clear mission data
    function clearMission() {
      if (confirm('Are you sure you want to clear all mission data? This will remove all placed units and route plan data.')) {
        // Clear placed units
        placedUnits.forEach(unit => {
          map.removeLayer(unit.marker);
          if (unit.boundingBox) {
            map.removeLayer(unit.boundingBox);
          }
        });
        placedUnits = [];
        selectedUnit = null;
        selectedUnits = [];
        updateUnitHierarchy();
        
        // Clear route plan
        const routePlanList = document.getElementById('route-plan-list');
        routePlanList.innerHTML = `
          <div class="route-leg" data-leg="1">
            <input type="text" class="route-from" placeholder="From" style="width: 45px;">
            <span>→</span>
            <input type="text" class="route-to" placeholder="To" style="width: 45px;">
            <span>(</span>
            <input type="number" class="route-distance" placeholder="m" style="width: 50px;">
            <span>m,</span>
            <input type="number" class="route-azimuth" placeholder="°" style="width: 50px;">
            <span>°,</span>
            <input type="text" class="route-direction" placeholder="dir" style="width: 30px;">
            <span>)</span>
            <button class="route-notes-btn" style="margin-left: 3px; padding: 1px 4px; background: #27ae60; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">+</button>
            <button class="route-remove-btn" style="margin-left: 3px; padding: 1px 4px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">-</button>
          </div>
          <div class="route-notes" style="display: none; margin-top: 5px; margin-bottom: 8px;">
            <textarea class="route-notes-text" placeholder="Enter notes for this route leg..." style="width: 100%; height: 60px; padding: 5px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px; font-family: Arial, sans-serif; resize: vertical;"></textarea>
          </div>
        `;
        
        // Reinitialize the route plan functionality
        initRoutePlan();
        
        alert('Mission cleared successfully!');
      }
    }

    // Expose app object for browser console debugging
    window.TacticalApp = {
      map,
      gridConfig,
      symbolImages,
      placedUnits,
      loadAllSymbols,
      initUnitPalette,
      updateGrid
    };

    // Add dynamic center-based MGRS display (works on touch and mouse)
    const coordDisplay = document.getElementById('cursor-position');
    if (coordDisplay) {
        // Make the display clickable
        coordDisplay.style.cursor = 'pointer';

        function updateCenterMgrs() {
            try {
                const center = map.getCenter();
                if (window.mgrs) {
                    const mgrsRef = window.mgrs.forward([center.lng, center.lat]);
                    coordDisplay.textContent = `MGRS: ${formatMgrs(mgrsRef)}`;
                    coordDisplay.setAttribute('data-mgrs', mgrsRef);
                }
            } catch (error) {
                console.error('Error converting to MGRS:', error);
                coordDisplay.textContent = 'Invalid coordinates';
            }
        }

        // Update when the map moves/zooms (better for touch)
        map.on('move', updateCenterMgrs);
        map.on('zoomend', updateCenterMgrs);
        // Still update on mouse move for desktop precision
        map.on('mousemove', function(e) {
            try {
                if (window.mgrs) {
                    const mgrsRef = window.mgrs.forward([e.latlng.lng, e.latlng.lat]);
                    coordDisplay.textContent = `MGRS: ${formatMgrs(mgrsRef)}`;
                    coordDisplay.setAttribute('data-mgrs', mgrsRef);
                }
            } catch (error) {
                console.error('Error converting to MGRS:', error);
                coordDisplay.textContent = 'Invalid coordinates';
            }
        });
        // Initialize display
        updateCenterMgrs();

        // Function to copy MGRS coordinates
        function copyMgrsCoordinates() {
            const mgrsText = coordDisplay.getAttribute('data-mgrs');
            if (mgrsText) {
                navigator.clipboard.writeText(mgrsText).then(() => {
                    // Store the original text
                    const originalText = coordDisplay.textContent;
                    
                    // Show feedback
                    coordDisplay.textContent = 'Copied!';
                    coordDisplay.style.backgroundColor = 'rgba(40, 167, 69, 0.7)';
                    
                    // Reset after 1 second
                    setTimeout(() => {
                        coordDisplay.textContent = originalText;
                        coordDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                    }, 1000);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    alert('Failed to copy coordinates');
                });
            }
        }

        // Add click handler for copying
        coordDisplay.addEventListener('click', copyMgrsCoordinates);

        // Add F1 key handler for copying
        document.addEventListener('keydown', function(e) {
            if (e.key === 'F1') {
                e.preventDefault(); // Prevent default F1 help behavior
                copyMgrsCoordinates();
            }
            
            // Add F2 key handler for creating a point at current position
            if (e.key === 'F2') {
                e.preventDefault();
                createPointAtMousePosition();
            }
            
            // Add Z key handler for creating a TRP
            if (e.key === 'Z' || e.key === 'z') {
                e.preventDefault();
                createTRPAtMousePosition();
            }
        });
    }

    // Update grid info display style
    const gridInfo = document.querySelector('.grid-info');
    if (gridInfo) {
        gridInfo.style.display = 'flex';
        gridInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        gridInfo.style.color = 'white';
        gridInfo.style.padding = '8px 15px';
        gridInfo.style.fontFamily = 'Courier New, monospace';
        gridInfo.style.fontSize = '14px';
        gridInfo.style.fontWeight = 'bold';
        gridInfo.style.position = 'absolute';
        gridInfo.style.top = '10px';
        gridInfo.style.left = '10px';
        gridInfo.style.zIndex = '1000';
        gridInfo.style.borderRadius = '4px';
        gridInfo.style.gap = '20px';
        gridInfo.style.transition = 'background-color 0.3s ease'; // Smooth transition for color changes
    }

    // Add Go To location functionality
    document.getElementById('goto-location').addEventListener('click', function() {
        const mgrsInput = document.getElementById('mgrs-input').value.trim();
        if (mgrsInput) {
            try {
                // Remove any spaces from the MGRS input
                const cleanMgrs = mgrsInput.replace(/\s+/g, '');
                
                // Convert MGRS to lat/lng using the correct method
                const point = window.mgrs.toPoint(cleanMgrs);
                
                // Move map to the position
                map.setView([point[1], point[0]], 15);
                
                // Use the original MGRS input as the default name
                const defaultName = mgrsInput.toUpperCase();
                
                // Create a new unit marker for the point
                const pointMarker = L.marker([point[1], point[0]], {
                    icon: L.divIcon({
                        className: 'unit-marker',
                        html: `
                            <div class="unit-container">
                                <div style="width: 20px; height: 20px; background-color: black; margin: 10px;"></div>
                                <div class="unit-label">${defaultName}</div>
                                <div class="unit-controls">
                                    <button class="unit-rotate-btn">⟳</button>
                                    <button class="unit-lock-btn">🔒</button>
                                    <button class="unit-resize-btn">⤡</button>
                                </div>
                            </div>
                        `,
                        iconSize: [60, 80],
                        iconAnchor: [30, 40]
                    })
                }).addTo(map);

                // Make marker draggable
                pointMarker.dragging.enable();
                
                // Add drag event handler to update coordinates in real-time
                pointMarker.on('drag', function(e) {
                  const latlng = e.target.getLatLng();
                  try {
                    // Convert new position to MGRS
                    const mgrsRef = window.mgrs.forward([latlng.lng, latlng.lat]);
                    const formattedMgrs = formatMgrs(mgrsRef);
                    
                    // Update the point's label with new coordinates
                    const labelElement = markerElement.querySelector('.unit-label');
                    labelElement.textContent = formattedMgrs;
                    
                    // Update the unit's custom name
                    const point = placedUnits.find(p => p.marker === pointMarker);
                    if (point) {
                      point.customName = formattedMgrs;
                      point.position = [latlng.lat, latlng.lng];
                    }
                  } catch (error) {
                    console.error('Error updating coordinates during drag:', error);
                  }
                });

                // Add rotation and lock functionality
                const markerElement = pointMarker.getElement();
                const container = markerElement.querySelector('.unit-container');
                const rotateBtn = markerElement.querySelector('.unit-rotate-btn');
                const lockBtn = markerElement.querySelector('.unit-lock-btn');
                const resizeBtn = markerElement.querySelector('.unit-resize-btn');
                const pointDiv = markerElement.querySelector('div[style*="background-color: black"]');
                let rotation = 0;
                let isLocked = false;
                let customName = defaultName; // Set the MGRS coordinates as the initial custom name

                // Rotation functionality
                let isRotating = false;
                let startAngle = 0;
                let currentRotation = 0;
                let wasRotating = false;

                rotateBtn.addEventListener('mousedown', function(e) {
                    e.stopPropagation();
                    if (!isLocked) {
                        isRotating = true;
                        wasRotating = false;
                        const rect = map.getContainer().getBoundingClientRect();
                        const markerRect = markerElement.getBoundingClientRect();
                        const centerX = markerRect.left + markerRect.width/2 - rect.left;
                        const centerY = markerRect.top + markerRect.height/2 - rect.top;
                        startAngle = Math.atan2(e.clientY - rect.top - centerY, e.clientX - rect.left - centerX);
                        
                        document.addEventListener('mousemove', handleRotation);
                        document.addEventListener('mouseup', stopRotation);
                        document.body.style.cursor = 'grab';
                    }
                });

                function handleRotation(e) {
                    if (!isRotating) return;
                    wasRotating = true;
                    
                    const rect = map.getContainer().getBoundingClientRect();
                    const markerRect = markerElement.getBoundingClientRect();
                    const centerX = markerRect.left + markerRect.width/2 - rect.left;
                    const centerY = markerRect.top + markerRect.height/2 - rect.top;
                    
                    const currentAngle = Math.atan2(e.clientY - rect.top - centerY, e.clientX - rect.left - centerX);
                    let angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
                    
                    currentRotation = (rotation + angleDiff) % 360;
                    container.style.transform = `rotate(${currentRotation}deg)`;
                }

                function stopRotation() {
                    if (isRotating) {
                        isRotating = false;
                        rotation = currentRotation;
                        
                        const point = placedUnits.find(p => p.marker === pointMarker);
                        if (point) {
                            point.rotation = rotation;
                            updateUnitHierarchy();
                        }
                        
                        document.removeEventListener('mousemove', handleRotation);
                        document.removeEventListener('mouseup', stopRotation);
                        document.body.style.cursor = 'default';
                    }
                }

                rotateBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (!isLocked && !isRotating && !wasRotating) {
                        rotation = (rotation + 45) % 360;
                        container.style.transform = `rotate(${rotation}deg)`;
                        const point = placedUnits.find(p => p.marker === pointMarker);
                        if (point) {
                            point.rotation = rotation;
                            updateUnitHierarchy();
                        }
                    }
                    wasRotating = false;
                });

                // Resize functionality
                let isResizing = false;
                let startSize = 20;
                resizeBtn.addEventListener('mousedown', function(e) {
                    e.stopPropagation();
                    if (!isLocked) {
                        isResizing = true;
                        startSize = parseInt(pointDiv.style.width);
                        document.addEventListener('mousemove', handleResize);
                        document.addEventListener('mouseup', stopResize);
                    }
                });

                function handleResize(e) {
                    if (!isResizing) return;
                    const rect = map.getContainer().getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const markerRect = markerElement.getBoundingClientRect();
                    const markerX = markerRect.left - rect.left;
                    const markerY = markerRect.top - rect.top;
                    
                    const dx = x - markerX;
                    const dy = y - markerY;
                    const newSize = Math.max(10, Math.min(100, Math.max(Math.abs(dx), Math.abs(dy))));
                    
                    pointDiv.style.width = `${newSize}px`;
                    pointDiv.style.height = `${newSize}px`;
                    
                    container.style.width = `${newSize + 20}px`;
                    container.style.height = `${newSize + 40}px`;
                }

                function stopResize() {
                    isResizing = false;
                    document.removeEventListener('mousemove', handleResize);
                    document.removeEventListener('mouseup', stopResize);
                }

                // Lock functionality
                lockBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    isLocked = !isLocked;
                    lockBtn.style.color = isLocked ? '#e74c3c' : '#666';
                    container.style.opacity = isLocked ? '0.7' : '1';
                    if (isLocked) {
                        pointMarker.dragging.disable();
                    } else {
                        pointMarker.dragging.enable();
                    }
                    const point = placedUnits.find(p => p.marker === pointMarker);
                    if (point) {
                        point.isLocked = isLocked;
                        updateUnitHierarchy();
                    }
                });

                // Click handler for selection
                container.addEventListener('click', function(e) {
                    e.stopPropagation();
                    
                    if (e.ctrlKey) {
                        // Ctrl + click for multiple selection
                        if (selectedUnit === pointMarker) {
                            // Deselect if clicking the same unit
                            selectedUnit.getElement().classList.remove('selected');
                            selectedUnit = null;
                            selectedUnits = selectedUnits.filter(u => u !== pointMarker);
                        } else {
                            // Add to selection
                            if (!selectedUnits.includes(pointMarker)) {
                                selectedUnits.push(pointMarker);
                                pointMarker.getElement().classList.add('selected');
                            }
                        }
                    } else {
                        // Regular click for single selection
                        if (selectedUnit === pointMarker) {
                            selectedUnit.getElement().classList.remove('selected');
                            selectedUnit = null;
                            selectedUnits = [];
                        } else {
                            if (selectedUnit) {
                                selectedUnit.getElement().classList.remove('selected');
                            }
                            pointMarker.getElement().classList.add('selected');
                            selectedUnit = pointMarker;
                            selectedUnits = [pointMarker];
                        }
                    }

                    // Show/hide measure distance button
                    measureDistanceBtn.style.display = selectedUnits.length === 2 ? 'block' : 'none';

                    updateUnitHierarchy();
                });

                // Double-click to rename
                container.addEventListener('dblclick', function(e) {
                    e.stopPropagation();
                    if (!isLocked) {
                        const currentName = customName || defaultName;
                        const newName = prompt('Enter new name:', currentName);
                        if (newName !== null && newName.trim() !== '') {
                            customName = newName.trim();
                            markerElement.querySelector('.unit-label').textContent = customName;
                            const point = placedUnits.find(p => p.marker === pointMarker);
                            if (point) {
                                point.customName = customName;
                                updateUnitHierarchy();
                            }
                        }
                    }
                });
                
                // Add dragend event handler to finalize position and update hierarchy
                pointMarker.on('dragend', function(e) {
                  const latlng = e.target.getLatLng();
                  const point = placedUnits.find(p => p.marker === pointMarker);
                  if (point) {
                    point.position = [latlng.lat, latlng.lng];
                    updateUnitHierarchy();
                    saveState();
                  }
                });

                // Add the point to the placed points array
                placedUnits.push({
                    marker: pointMarker,
                    position: [point[1], point[0]],
                    rotation: 0,
                    isLocked: false,
                    customName: defaultName, // Use MGRS coordinates as the default name
                    type: 'point'
                });

                // Update the point hierarchy
                updateUnitHierarchy();
                
                console.log(`Found location! Moving to MGRS: ${mgrsInput}`);
            } catch (error) {
                console.error('Error parsing MGRS:', error);
                alert('Try entering coordinates like this: "17S KT 85128 53610"');
            }
        }
    });

    // Also handle Enter key press in the input field
    document.getElementById('mgrs-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('goto-location').click();
        }
    });

    // Create context menu
    function createContextMenu() {
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.style.display = 'none';
        contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="copy-position">Copy Position</div>
            <div class="context-menu-item" data-action="delete">Delete</div>
        `;
        document.body.appendChild(contextMenu);

        // Handle context menu clicks
        contextMenu.addEventListener('click', function(e) {
            const action = e.target.getAttribute('data-action');
            if (action === 'copy-position') {
                const unit = contextMenu.dataset.unit;
                if (unit) {
                    const latlng = unit.getLatLng();
                    try {
                        if (window.mgrs) {
                            const mgrsRef = window.mgrs.forward([latlng.lng, latlng.lat]);
                            const formattedMgrs = formatMgrs(mgrsRef);
                            
                            // Create text marker below the unit
                            const textMarker = L.marker([latlng.lat, latlng.lng], {
                                icon: L.divIcon({
                                    className: 'text-marker',
                                    html: `<div style="background: white; padding: 5px; border-radius: 3px; font-family: monospace;">${formattedMgrs}</div>`,
                                    iconSize: [200, 30],
                                    iconAnchor: [100, 15]
                                })
                            }).addTo(map);

                            // Add to placed units for hierarchy
                            placedUnits.push({
                                marker: textMarker,
                                type: 'text',
                                customName: `Position: ${formattedMgrs}`
                            });

                            // Update hierarchy
                            updateUnitHierarchy();
                        }
                    } catch (error) {
                        console.error('Error converting to MGRS:', error);
                    }
                }
            } else if (action === 'delete') {
                const unit = contextMenu.dataset.unit;
                if (unit) {
                    const index = placedUnits.findIndex(u => u.marker === unit);
                    if (index !== -1) {
                        removeUnit(index);
                    }
                }
            }
            contextMenu.style.display = 'none';
        });

        return contextMenu;
    }

    // Initialize context menu
    const contextMenu = createContextMenu();

    // Add context menu event listeners to all unit containers
    function addContextMenuListeners(container) {
        container.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const unit = this.closest('.unit-marker')._leaflet_map._leaflet_map;
            contextMenu.dataset.unit = unit;
            
            contextMenu.style.display = 'block';
            contextMenu.style.left = e.pageX + 'px';
            contextMenu.style.top = e.pageY + 'px';
        });
    }

    // Add context menu listener to document to close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
        }
    });

    // Add context menu listeners to existing unit containers
    document.querySelectorAll('.unit-container').forEach(addContextMenuListeners);

    // State persistence functions with Firebase sync
    let lastSyncTime = Date.now();
    
    // Helper to remove undefined values (Firebase accepts null but not undefined)
    function cleanObjectForFirebase(obj) {
        const cleaned = {};
        for (const key in obj) {
            if (obj[key] !== undefined) {
                cleaned[key] = obj[key];
            }
        }
        return cleaned;
    }
    
    function saveState() {
        const state = {
            mapView: {
                center: map.getCenter(),
                zoom: map.getZoom()
            },
            placedUnits: placedUnits.map(unit => ({
                id: unit.id || ('unit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
                position: unit.position || (unit.marker ? [unit.marker.getLatLng().lat, unit.marker.getLatLng().lng] : null),
                symbolKey: unit.symbolKey,
                rotation: unit.rotation || 0,
                size: unit.size || 40,
                customName: unit.customName,
                isLocked: unit.isLocked || false,
                type: unit.type || 'symbol', // 'symbol', 'point', 'text', 'distance'
                // For distance measurements
                distance: unit.distance,
                azimuth: unit.azimuth,
                parentUnit: unit.parentUnit ? placedUnits.findIndex(u => u.marker === unit.parentUnit) : null
            })),
            selectedUnits: selectedUnits.map((unit, index) => index) // Save indices instead of IDs
        };
        localStorage.setItem('tacticalMapState', JSON.stringify(state));
        
        // NOTE: Firebase sync is now handled per-unit, not in saveState
        // See syncUnitToFirebase() function below
    }
    
    // Flag to prevent sync loops when creating units from Firebase
    let isCreatingFromFirebase = false;

    // Sync a single unit to Firebase (just like location tracking)
    function syncUnitToFirebase(unit, skipIfFromFirebase = false) {
        // Skip sync if this unit is being created from Firebase to prevent loops
        if (skipIfFromFirebase && isCreatingFromFirebase) {
            return;
        }
        
        if (typeof firebase !== 'undefined' && window.database && unit.id) {
            try {
                const cleanedUnit = cleanObjectForFirebase({
                    id: unit.id,
                    position: unit.position || (unit.marker ? [unit.marker.getLatLng().lat, unit.marker.getLatLng().lng] : null),
                    symbolKey: unit.symbolKey,
                    rotation: unit.rotation || 0,
                    size: unit.size || 40,
                    customName: unit.customName,
                    isLocked: unit.isLocked || false,
                    type: unit.type || 'symbol',
                    lastUpdate: Date.now(),
                    userId: window.userId || 'unknown'
                });
                
                // Only sync if we have a valid position
                if (cleanedUnit.position && Array.isArray(cleanedUnit.position)) {
                    window.database.ref('mission/units/' + unit.id).set(cleanedUnit)
                        .catch((error) => {
                            console.error('❌ Unit sync error:', error.code, error.message);
                        });
                }
            } catch (e) {
                console.error('❌ Unit sync failed:', e);
            }
        }
    }
    
    // Remove a unit from Firebase
    function removeUnitFromFirebase(unitId) {
        if (typeof firebase !== 'undefined' && window.database && unitId) {
            try {
                window.database.ref('mission/units/' + unitId).remove()
                    .catch((error) => {
                        console.error('❌ Unit removal error:', error.code, error.message);
                    });
            } catch (e) {
                console.error('❌ Unit removal failed:', e);
            }
        }
    }

    function loadState() {
        const savedState = localStorage.getItem('tacticalMapState');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            // Restore map view
            if (state.mapView) {
                map.setView(state.mapView.center, state.mapView.zoom);
            }

            // Restore placed units
            if (state.placedUnits) {
                state.placedUnits.forEach(unitData => {
                    if (!unitData.position) return;
                    
                    let marker;
                    const position = Array.isArray(unitData.position) ? unitData.position : [unitData.position.lat, unitData.position.lng];
                    
                    if (unitData.type === 'point') {
                        // Recreate point marker (black square)
                        marker = L.marker(position, {
                            icon: L.divIcon({
                                className: 'unit-marker',
                                html: `
                                    <div class="unit-container">
                                        <div style="width: 20px; height: 20px; background-color: black; margin: 10px;"></div>
                                        <div class="unit-label">${unitData.customName || 'Point'}</div>
                                        <div class="unit-controls">
                                            <button class="unit-rotate-btn">⟳</button>
                                            <button class="unit-lock-btn">🔒</button>
                                            <button class="unit-resize-btn">⤡</button>
                                        </div>
                                    </div>
                                `,
                                iconSize: [60, 80],
                                iconAnchor: [30, 40]
                            })
                        }).addTo(map);
                    } else if (unitData.type === 'text') {
                        // Recreate text marker
                        marker = L.marker(position, {
                            icon: L.divIcon({
                                className: 'text-marker',
                                html: `<div style="background: white; padding: 5px; border-radius: 3px; font-family: monospace;">${unitData.customName || 'Text'}</div>`,
                                iconSize: [200, 30],
                                iconAnchor: [100, 15]
                            })
                        }).addTo(map);
                    } else if (unitData.type === 'distance') {
                        // Skip distance markers for now - they need special handling
                        return;
                    } else if (unitData.symbolKey && symbolImages[unitData.symbolKey]) {
                        // Recreate symbol unit
                        marker = L.marker(position, {
                            icon: L.divIcon({
                                className: 'unit-marker',
                                html: `
                                    <div class="unit-container">
                                        <img src="symbols/${symbolImages[unitData.symbolKey].filename}" style="transform: rotate(${unitData.rotation}deg); width: ${unitData.size}px; height: ${unitData.size}px; object-fit: contain;">
                                        <div class="unit-label">${unitData.customName || symbolImages[unitData.symbolKey].symbolName}</div>
                                        <div class="unit-controls">
                                            <button class="unit-rotate-btn">⟳</button>
                                            <button class="unit-lock-btn">🔒</button>
                                            <button class="unit-resize-btn">⤡</button>
                                            <button class="unit-copy-position-btn">📋</button>
                                        </div>
                                    </div>
                                `,
                                iconSize: [unitData.size + 20, unitData.size + 40],
                                iconAnchor: [(unitData.size + 20) / 2, unitData.size + 40]
                            })
                        }).addTo(map);
                    }
                    
                    if (marker) {
                        const unit = {
                            id: unitData.id || ('unit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
                            marker: marker,
                            position: position,
                            symbolKey: unitData.symbolKey,
                            rotation: unitData.rotation || 0,
                            size: unitData.size || 40,
                            customName: unitData.customName,
                            isLocked: unitData.isLocked || false,
                            type: unitData.type || 'symbol'
                        };
                        placedUnits.push(unit);
                        
                        // Make marker draggable if not locked
                        if (!unit.isLocked) {
                            marker.dragging.enable();
                        }
                        
                        // Add interactivity to restored markers
                        addMarkerInteractivity(marker, unit);
                    }
                });
            }

            // Update hierarchy after restoring all units
            updateUnitHierarchy();
        }
    }

    // Save state periodically and on important changes
    setInterval(saveState, 5000); // Save every 5 seconds
    map.on('moveend', saveState);
    map.on('zoomend', saveState);
    
    // Listen for unit updates from Firebase (EXACTLY like location tracking)
    if (typeof firebase !== 'undefined' && window.database) {
        try {
            // Listen for NEW units added by other users
            window.database.ref('mission/units').on('child_added', (snapshot) => {
                const remoteUnit = snapshot.val();
                if (!remoteUnit || !remoteUnit.id) return;
                
                // Skip if this unit is from us (we already have it locally)
                if (remoteUnit.userId === window.userId) return;
                
                // Check if we already have this unit
                const existingUnit = placedUnits.find(u => u.id === remoteUnit.id);
                if (existingUnit) return; // Already have it
                
                console.log('➕ Adding unit from another user:', remoteUnit.id);
                
                // Set flag to prevent sync loop
                isCreatingFromFirebase = true;
                
                try {
                    // Create the unit on the map based on type
                    if (remoteUnit.type === 'symbol' && remoteUnit.symbolKey && symbolImages[remoteUnit.symbolKey]) {
                        if (window.TacticalApp && window.TacticalApp.createUnitFromSymbol) {
                            window.TacticalApp.createUnitFromSymbol(remoteUnit.symbolKey, remoteUnit.position[0], remoteUnit.position[1]);
                            
                            // Update the newly created unit with remote properties
                            const newUnit = placedUnits[placedUnits.length - 1];
                            if (newUnit) {
                                newUnit.id = remoteUnit.id;
                                newUnit.rotation = remoteUnit.rotation || 0;
                                newUnit.size = remoteUnit.size || 40;
                                newUnit.customName = remoteUnit.customName;
                                newUnit.isLocked = remoteUnit.isLocked || false;
                                
                                // Update visual representation
                                const marker = newUnit.marker;
                                const markerElement = marker.getElement();
                                if (markerElement) {
                                    const container = markerElement.querySelector('.unit-container');
                                    const img = markerElement.querySelector('img');
                                    const label = markerElement.querySelector('.unit-label');
                                    
                                    if (container) container.style.transform = `rotate(${newUnit.rotation}deg)`;
                                    if (img) {
                                        img.style.width = `${newUnit.size}px`;
                                        img.style.height = `${newUnit.size}px`;
                                    }
                                    if (label && newUnit.customName) {
                                        label.textContent = newUnit.customName;
                                    }
                                }
                                
                                // Update bounding box if it exists
                                if (newUnit.boundingBox && remoteUnit.position) {
                                    newUnit.boundingBox.setBounds(
                                        L.latLng(remoteUnit.position[0], remoteUnit.position[1]).toBounds(newUnit.boundingBox._boxSize || 0.0012)
                                    );
                                }
                                
                                updateUnitHierarchy();
                            }
                        }
                    } else if (remoteUnit.type === 'point' && remoteUnit.position) {
                        // Handle point markers
                        const pointMarker = L.marker([remoteUnit.position[0], remoteUnit.position[1]], {
                            icon: L.divIcon({
                                className: 'unit-marker',
                                html: `
                                    <div class="unit-container">
                                        <div style="width: 20px; height: 20px; background-color: black; margin: 10px;"></div>
                                        <div class="unit-label">${remoteUnit.customName || 'Point'}</div>
                                    </div>
                                `,
                                iconSize: [60, 80],
                                iconAnchor: [30, 40]
                            })
                        }).addTo(map);
                        
                        const newUnit = {
                            id: remoteUnit.id,
                            marker: pointMarker,
                            position: remoteUnit.position,
                            type: 'point',
                            customName: remoteUnit.customName,
                            isLocked: remoteUnit.isLocked || false
                        };
                        placedUnits.push(newUnit);
                        updateUnitHierarchy();
                    } else if (remoteUnit.type === 'text' && remoteUnit.position) {
                        // Handle text markers
                        const textMarker = L.marker([remoteUnit.position[0], remoteUnit.position[1]], {
                            icon: L.divIcon({
                                className: 'text-marker',
                                html: `<div style="background: white; padding: 5px; border-radius: 3px; font-family: monospace;">${remoteUnit.customName || 'Text'}</div>`,
                                iconSize: [200, 30],
                                iconAnchor: [100, 15]
                            })
                        }).addTo(map);
                        
                        const newUnit = {
                            id: remoteUnit.id,
                            marker: textMarker,
                            position: remoteUnit.position,
                            type: 'text',
                            customName: remoteUnit.customName
                        };
                        placedUnits.push(newUnit);
                        updateUnitHierarchy();
                    }
                } finally {
                    // Reset flag after creating unit
                    isCreatingFromFirebase = false;
                }
            });
            
            // Listen for CHANGES to existing units
            window.database.ref('mission/units').on('child_changed', (snapshot) => {
                const remoteUnit = snapshot.val();
                if (!remoteUnit || !remoteUnit.id) return;
                
                // Skip if this change is from us
                if (remoteUnit.userId === window.userId) return;
                
                const localUnit = placedUnits.find(u => u.id === remoteUnit.id);
                if (!localUnit) return;
                
                console.log('🔄 Updating unit from another user:', remoteUnit.id);
                
                // Update position
                if (remoteUnit.position && localUnit.marker) {
                    localUnit.marker.setLatLng([remoteUnit.position[0], remoteUnit.position[1]]);
                    localUnit.position = remoteUnit.position;
                    if (localUnit.boundingBox) {
                        localUnit.boundingBox.setBounds(
                            L.latLng(remoteUnit.position[0], remoteUnit.position[1]).toBounds(localUnit.boundingBox._boxSize || 0.0012)
                        );
                    }
                }
                
                // Update lock state
                if (remoteUnit.isLocked !== undefined) {
                    localUnit.isLocked = remoteUnit.isLocked;
                    if (localUnit.marker) {
                        if (remoteUnit.isLocked) {
                            localUnit.marker.dragging.disable();
                        } else {
                            localUnit.marker.dragging.enable();
                        }
                    }
                }
                
                // Update visual properties
                const markerElement = localUnit.marker ? localUnit.marker.getElement() : null;
                if (markerElement) {
                    const container = markerElement.querySelector('.unit-container');
                    const img = markerElement.querySelector('img');
                    const label = markerElement.querySelector('.unit-label');
                    const lockBtn = markerElement.querySelector('.unit-lock-btn');
                    
                    // Update rotation
                    if (container && remoteUnit.rotation !== undefined) {
                        localUnit.rotation = remoteUnit.rotation;
                        container.style.transform = `rotate(${remoteUnit.rotation}deg)`;
                    }
                    
                    // Update size
                    if (img && remoteUnit.size !== undefined) {
                        localUnit.size = remoteUnit.size;
                        img.style.width = `${remoteUnit.size}px`;
                        img.style.height = `${remoteUnit.size}px`;
                    }
                    
                    // Update name
                    if (label && remoteUnit.customName !== undefined) {
                        localUnit.customName = remoteUnit.customName;
                        label.textContent = remoteUnit.customName || (localUnit.symbolKey ? symbolImages[localUnit.symbolKey]?.symbolName : 'Unit');
                    }
                    
                    // Update lock button visual state
                    if (lockBtn && remoteUnit.isLocked !== undefined) {
                        lockBtn.style.color = remoteUnit.isLocked ? '#e74c3c' : '#666';
                        if (container) {
                            container.style.opacity = remoteUnit.isLocked ? '0.7' : '1';
                        }
                    }
                }
                
                updateUnitHierarchy();
            });
            
            // Listen for DELETIONS
            window.database.ref('mission/units').on('child_removed', (snapshot) => {
                const remoteUnit = snapshot.val();
                if (!remoteUnit || !remoteUnit.id) return;
                
                console.log('➖ Removing deleted unit from another user:', remoteUnit.id);
                
                const index = placedUnits.findIndex(u => u.id === remoteUnit.id);
                if (index !== -1) {
                    const unit = placedUnits[index];
                    // Remove from map
                    if (unit.marker) map.removeLayer(unit.marker);
                    if (unit.boundingBox) map.removeLayer(unit.boundingBox);
                    // Remove from array
                    placedUnits.splice(index, 1);
                    updateUnitHierarchy();
                }
            });
            
            console.log('✅ Firebase unit sync listeners initialized');
        } catch (e) {
            console.error('❌ Firebase listener setup failed:', e);
        }
    }

    // Function to add selection and interaction handlers to markers
    function addMarkerInteractivity(marker, unit) {
        const markerElement = marker.getElement();
        if (!markerElement) return;
        
        const container = markerElement.querySelector('.unit-container');
        if (!container) return;
        
        // Click handler for selection
        container.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (e.ctrlKey) {
                // Ctrl + click for multiple selection
                if (selectedUnit === marker) {
                    // Deselect if clicking the same unit
                    selectedUnit.getElement().classList.remove('selected');
                    selectedUnit = null;
                    selectedUnits = selectedUnits.filter(u => u !== marker);
                } else {
                    // Add to selection
                    if (!selectedUnits.includes(marker)) {
                        selectedUnits.push(marker);
                        marker.getElement().classList.add('selected');
                    }
                }
            } else {
                // Regular click for single selection
                if (selectedUnit === marker) {
                    selectedUnit.getElement().classList.remove('selected');
                    selectedUnit = null;
                    selectedUnits = [];
                } else {
                    if (selectedUnit) {
                        selectedUnit.getElement().classList.remove('selected');
                    }
                    marker.getElement().classList.add('selected');
                    selectedUnit = marker;
                    selectedUnits = [marker];
                }
            }

            // Show/hide measure distance button
            measureDistanceBtn.style.display = selectedUnits.length === 2 ? 'block' : 'none';

            updateUnitHierarchy();

            // Auto-close sidebar on selection (mobile convenience)
            try {
                const sidebar = document.getElementById('sidebar');
                const overlay = document.getElementById('sidebar-overlay');
                if (sidebar && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                    if (overlay) overlay.style.display = 'none';
                }
            } catch(_){}
        });
        
        // Add context menu listeners
        addContextMenuListeners(container);
    }

    // Initialize geolocation functionality with Firebase sync
    function initGeolocation() {
        const yourLocationDisplay = document.getElementById('your-location-mgrs');
        const refreshLocationBtn = document.getElementById('refresh-location');
        let watchId = null;
        let myLocationMarker = null;
        let otherUsersMarkers = {}; // Track other users' markers
        
        // Get user info from firebase-config.js
        const myUserId = window.userId || 'user_' + Math.random().toString(36).substr(2, 9);
        const myDeviceName = window.deviceName || 'Anonymous';
        const myUserColor = window.userColor || '#4285F4';
        
        let followEnabled = ('ontouchstart' in window || navigator.maxTouchPoints > 0); // follow by default on touch devices
        // Disable follow if user manually drags the map
        map.on('dragstart', function(){ followEnabled = false; });

        function updateLocationDisplay(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            try {
                if (window.mgrs) {
                    const mgrsRef = window.mgrs.forward([lng, lat]);
                    const formattedMgrs = formatMgrs(mgrsRef);
                    yourLocationDisplay.textContent = formattedMgrs;
                    yourLocationDisplay.style.backgroundColor = '#d4edda'; // Light green for success
                    yourLocationDisplay.style.color = '#155724';
                }
                
                // Create or update location marker on map
                if (!myLocationMarker) {
                    // Create new marker with pulsing dot
                    myLocationMarker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'live-location-marker',
                            html: `
                                <div style="position: relative; width: 40px; height: 40px;">
                                    <div class="pulse-ring" style="border-color: ${myUserColor};"></div>
                                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; background: ${myUserColor}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4); z-index: 2;"></div>
                                </div>
                                <div style="position: absolute; top: 45px; left: 50%; transform: translateX(-50%); background: ${myUserColor}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${myDeviceName}</div>
                            `,
                            iconSize: [40, 70],
                            iconAnchor: [20, 20]
                        }),
                        zIndexOffset: 2000 // Keep it above other markers
                    }).addTo(map);
                } else {
                    // Update existing marker position
                    myLocationMarker.setLatLng([lat, lng]);
                }
                
                // Sync location to Firebase if available
                if (typeof firebase !== 'undefined' && window.database) {
                    try {
                        window.database.ref('users/' + myUserId).set({
                            lat: lat,
                            lng: lng,
                            name: myDeviceName,
                            color: myUserColor,
                            lastUpdate: Date.now()
                        }).catch((error) => {
                            console.error('❌ Location sync error:', error.code, error.message);
                        });
                    } catch (e) {
                        console.error('❌ Firebase location sync failed:', e);
                    }
                }
                
                // Auto-follow device location on map if enabled
                if (followEnabled) {
                    const currentZoom = map.getZoom();
                    map.setView([lat, lng], currentZoom, { animate: false });
                }
            } catch (error) {
                console.error('Error converting GPS to MGRS:', error);
                yourLocationDisplay.textContent = 'Location conversion error';
                yourLocationDisplay.style.backgroundColor = '#f8d7da'; // Light red for error
                yourLocationDisplay.style.color = '#721c24';
            }
        }
        
        // Listen for other users' locations from Firebase
        if (typeof firebase !== 'undefined' && window.database) {
            try {
                window.database.ref('users').on('value', (snapshot) => {
                    const users = snapshot.val();
                    if (!users) return;
                    
                    // Remove stale users (>30 seconds old)
                    const now = Date.now();
                    Object.keys(users).forEach(uid => {
                        if (now - users[uid].lastUpdate > 30000) {
                            if (otherUsersMarkers[uid]) {
                                map.removeLayer(otherUsersMarkers[uid]);
                                delete otherUsersMarkers[uid];
                            }
                        }
                    });
                    
                    // Update/create markers for active users
                    Object.keys(users).forEach(uid => {
                        if (uid === myUserId) return; // Skip own marker
                        const user = users[uid];
                        if (now - user.lastUpdate > 30000) return; // Skip stale
                        
                        if (otherUsersMarkers[uid]) {
                            // Update existing marker
                            otherUsersMarkers[uid].setLatLng([user.lat, user.lng]);
                        } else {
                            // Create new marker for this user
                            otherUsersMarkers[uid] = L.marker([user.lat, user.lng], {
                                icon: L.divIcon({
                                    className: 'live-location-marker',
                                    html: `
                                        <div style="position: relative; width: 40px; height: 40px;">
                                            <div class="pulse-ring" style="border-color: ${user.color};"></div>
                                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; background: ${user.color}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4); z-index: 2;"></div>
                                        </div>
                                        <div style="position: absolute; top: 45px; left: 50%; transform: translateX(-50%); background: ${user.color}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${user.name}</div>
                                    `,
                                    iconSize: [40, 70],
                                    iconAnchor: [20, 20]
                                }),
                                zIndexOffset: 1999
                            }).addTo(map);
                        }
                    });
                });
                
                // Clean up on page unload
                window.addEventListener('beforeunload', () => {
                    window.database.ref('users/' + myUserId).remove();
                });
            } catch (e) {
                console.log('Firebase not configured, running in offline mode');
            }
        }
        
        function handleLocationError(error) {
            let message = '';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Location access denied';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'Location unavailable';
                    break;
                case error.TIMEOUT:
                    message = 'Location timeout';
                    break;
                default:
                    message = 'Location error';
                    break;
            }
            yourLocationDisplay.textContent = message;
            yourLocationDisplay.style.backgroundColor = '#f8d7da'; // Light red for error
            yourLocationDisplay.style.color = '#721c24';
        }
        
        function startLocationTracking() {
            if ("geolocation" in navigator) {
                yourLocationDisplay.textContent = 'Getting location...';
                yourLocationDisplay.style.backgroundColor = '#fff3cd'; // Light yellow for loading
                yourLocationDisplay.style.color = '#856404';
                
                // Get current position first for immediate update
                navigator.geolocation.getCurrentPosition(
                    updateLocationDisplay,
                    handleLocationError,
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
                
                // Start watching position for live updates
                watchId = navigator.geolocation.watchPosition(
                    updateLocationDisplay,
                    handleLocationError,
                    {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 0
                    }
                );
            } else {
                yourLocationDisplay.textContent = 'Geolocation not supported';
                yourLocationDisplay.style.backgroundColor = '#f8d7da'; // Light red for error
                yourLocationDisplay.style.color = '#721c24';
            }
        }
        
        function stopLocationTracking() {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
        }
        
        // Refresh button functionality
        refreshLocationBtn.addEventListener('click', function() {
            stopLocationTracking();
            followEnabled = true; // re-enable follow on refresh
            startLocationTracking();
        });
        
        // Start tracking on page load
        startLocationTracking();
        
        // Stop tracking when page is unloaded
        window.addEventListener('beforeunload', stopLocationTracking);
    }
    
    // Initialize geolocation
    initGeolocation();
});