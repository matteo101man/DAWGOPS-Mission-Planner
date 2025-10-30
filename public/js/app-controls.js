// public/js/app-controls.js
window.TacticalControls = (function() {
    // Initialize control buttons
    function initControls() {
      const app = window.TacticalApp;
      const stage = app.stage;
      const symbolLayer = app.symbolLayer;
      const measureLayer = app.measureLayer;
      const grid = window.TacticalGrid;
      const symbols = window.TacticalSymbols;
      
      // Clear map button
      document.getElementById('clear-map').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the map?')) {
          symbolLayer.destroyChildren();
          measureLayer.destroyChildren();
          symbolLayer.draw();
          measureLayer.draw();
        }
      });
      
      // Generate template button
      document.getElementById('generate-template').addEventListener('click', function() {
        symbols.generateTemplate();
      });
      
      // Export image button
      document.getElementById('export-image').addEventListener('click', function() {
        const dataURL = stage.toDataURL();
        const link = document.createElement('a');
        link.download = 'tactical-plan.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
      
      // Grid zoom slider
      document.getElementById('grid-zoom').addEventListener('input', function() {
        app.mapScale = parseFloat(this.value) / 5;
        stage.scale({ x: app.mapScale, y: app.mapScale });
        grid.drawGrid();
        symbolLayer.draw();
        measureLayer.draw();
      });
    }
    
    // Initialize the application
    function init() {
      const symbols = window.TacticalSymbols;
      const app = window.TacticalApp;
      
      initControls();
      
      // Set default values
      document.getElementById('mission-type').value = app.missionConfig.missionType;
      document.getElementById('unit-size').value = app.missionConfig.unitSize;
      
      // Generate initial template
      symbols.generateTemplate();
    }
    
    // Public API
    return {
      init
    };
  })();