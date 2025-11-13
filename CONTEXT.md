# Tactical Mission Planner - Development Context

## 📋 Project Overview
A collaborative tactical mission planning web application with real-time multi-user synchronization. Deployed on GitHub Pages with Firebase Realtime Database backend.

- **Live URL**: https://matteo101man.github.io/DAWGOPS-Mission-Planner/
- **Repository**: https://github.com/matteo101man/DAWGOPS-Mission-Planner
- **Tech Stack**: Leaflet.js, Firebase Realtime Database, HTML/CSS/JavaScript
- **Target Device**: Optimized for iPhone 13 vertical view (mobile-first)

---

## 🔥 Firebase Configuration

### Database Structure
```
firebase-realtime-database/
├── users/
│   └── {userId}/               # Live location tracking
│       ├── lat: number
│       ├── lng: number
│       ├── name: string
│       ├── color: string
│       └── lastUpdate: timestamp
│
└── mission/
    └── units/
        └── {unitId}/           # Per-unit real-time sync
            ├── id: string
            ├── position: [lat, lng]
            ├── symbolKey: string
            ├── rotation: number
            ├── size: number
            ├── customName: string
            ├── isLocked: boolean
            ├── type: 'symbol' | 'point' | 'text' | 'distance'
            ├── lastUpdate: timestamp
            └── userId: string
```

### Firebase Rules (CURRENT)
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Firebase Config Location
- **File**: `public/js/firebase-config.js`
- **Credentials**: Already configured with project credentials
- **User ID Generation**: Automatic on page load (`window.userId`)
- **Device Name**: Prompts user on first load

---

## 🗂️ Key Files

### Core Application
- **`app.html`** - Main HTML structure, sidebar, controls, CSS
- **`public/js/app-core.js`** (3709 lines) - All application logic
- **`public/js/firebase-config.js`** - Firebase initialization
- **`symbols/index.json`** - List of available military symbols
- **`manifest.webmanifest`** - PWA configuration
- **`service-worker.js`** - Aggressive cache-busting for development

### Symbol Assets
- **`symbols/`** - Directory containing all military symbol PNGs
- Loaded dynamically from `symbols/index.json`

---

## ✨ Recent Features Implemented

### Multi-User Real-Time Sync (LATEST - Just Completed)
**Implementation**: Per-unit Firebase sync using child listeners (like location tracking)

**How It Works**:
```javascript
// When user adds/updates/deletes a unit:
syncUnitToFirebase(unit);  // Writes to mission/units/{unitId}

// Other devices automatically receive via Firebase listeners:
child_added    → Creates new unit on other devices
child_changed  → Updates existing unit in real-time
child_removed  → Removes deleted units
```

**Key Functions**:
- `syncUnitToFirebase(unit)` - Push unit to Firebase
- `removeUnitFromFirebase(unitId)` - Delete unit from Firebase
- Firebase listeners at line ~3300-3427

### Live Location Tracking
- Shows user's current GPS location with pulsing dot
- Syncs to Firebase (`users/{userId}`)
- Shows other users' locations in different colors
- Auto-updates every location change

### Touch-Optimized Unit Interaction
- **Large bounding box** (3x unit size) for easy touch targeting
- **Two-finger gestures**: Rotate and pinch-to-resize
- **Single-finger drag**: Move units (bounding box as drag target)
- **Double-tap**: Rename unit
- **Long-press**: Add unit from palette (prevents accidental placement)
- **Tap unit controls**: Lock, copy position, delete

### iOS Optimizations
- Transparent sidebar with backdrop-filter blur
- Prevents text selection (`-webkit-user-select: none`)
- Dynamic viewport height (`--app-vh`) for proper 100vh on iOS
- Touch-action CSS to prevent default behaviors
- Sidebar auto-closes on unit selection

---

## 🎯 Current State

### What's Working ✅
- ✅ Real-time location tracking across devices
- ✅ Per-unit Firebase sync (add/update/delete)
- ✅ Touch-optimized unit manipulation
- ✅ Two-finger rotation and pinch-to-resize
- ✅ Bounding box for easy selection
- ✅ Unit hierarchy in sidebar
- ✅ MGRS coordinate display and conversion
- ✅ Map layers (Standard, Satellite, Terrain)
- ✅ iOS-friendly UI (transparent sidebar, touch scrolling)

### Recently Fixed 🔧
- Fixed Firebase undefined values error (had to strip `undefined` properties)
- Redesigned Firebase sync from array-based to per-unit paths
- Improved bounding box size and touch detection
- Added proper error logging for Firebase operations

### Known Limitations ⚠️
- Cache can be aggressive (service worker uses timestamp-based versioning)
- First load skips Firebase sync to avoid duplicate units
- Text markers and distance measurements not yet synced to Firebase
- No conflict resolution (last write wins)

---

## 🔍 Troubleshooting Guide

### Firebase Not Syncing?
1. Check console for: `✅ Firebase unit sync listeners initialized`
2. Look for: `➕ Adding unit from another user:` when someone adds a unit
3. Verify Firebase rules allow read/write
4. Check Network tab for Firebase requests

### Units Not Appearing on Other Device?
- Console should show: `➕ Adding unit from another user: unit_xxxxx`
- Check `window.userId` in console (should be different on each device)
- Verify both devices have `window.TacticalApp.createUnitFromSymbol` function
- Check Firebase Database in console to see if data is being written

### Location Tracking Not Working?
- Check console for: `✅ Firebase initialized successfully!`
- Verify device permissions for geolocation
- Look for: `❌ Location sync error:` in console

### Cache Issues?
- Service worker uses timestamp-based cache: `CACHE_NAME = 'tactical-planner-cache-' + Date.now()`
- Hard refresh: `Ctrl+Shift+R` (PC) or `Cmd+Shift+R` (Mac)
- Clear site data in DevTools → Application → Clear storage

---

## 🚀 Deployment Workflow

### Push to GitHub
```powershell
cd "C:\Users\matte\OneDrive\Desktop\Planner Update\tactical-mission-planner"
git add .
git commit -m "Your commit message"
git push origin main
```

### GitHub Pages Auto-Deploy
- Deploys automatically on push to `main` branch
- Live in 1-2 minutes at: https://matteo101man.github.io/DAWGOPS-Mission-Planner/

### Force Cache Bust
- Service worker timestamp changes on every deploy
- Users will get fresh assets on next page load

---

## 📱 Mobile Testing Workflow

### Test on iPhone
1. Open Safari on iPhone
2. Navigate to: https://matteo101man.github.io/DAWGOPS-Mission-Planner/
3. Open DevTools: Settings → Advanced → Web Inspector → Connect to PC
4. Watch console for Firebase sync messages

### Test Multi-User Sync
1. Open app on Device A
2. Open app on Device B (different browser/device)
3. Add "Assault 1" on Device A
4. Device B should show: `➕ Adding unit from another user:`
5. Drag unit on Device A → Device B updates in real-time

---

## 🔧 Key Code Locations

### Firebase Sync Functions
- **Lines 3132-3173**: `syncUnitToFirebase()` and `removeUnitFromFirebase()`
- **Lines 3300-3427**: Firebase child listeners (add, change, remove)

### Unit Creation
- **Lines 494-892**: `createUnitFromSymbolAt()` - Main unit creation logic
- **Lines 530-617**: Bounding box creation and touch drag handling
- **Lines 620-762**: Two-finger gesture detection (rotate/resize)

### Firebase Initialization
- **`public/js/firebase-config.js`**: Firebase setup, user ID generation

### Location Tracking
- **Lines 3455-3650**: `initGeolocation()` - GPS tracking and Firebase sync

---

## 📝 Important Implementation Details

### Unit ID Generation
```javascript
const unitId = 'unit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
```
- Ensures globally unique IDs
- Format: `unit_1234567890_abc123xyz`

### Firebase Data Cleaning
```javascript
function cleanObjectForFirebase(obj) {
    const cleaned = {};
    for (const key in obj) {
        if (obj[key] !== undefined) {
            cleaned[key] = obj[key];
        }
    }
    return cleaned;
}
```
- Firebase rejects `undefined` values
- Must strip undefined properties before `.set()`

### User ID Check Pattern
```javascript
if (remoteUnit.userId === window.userId) return; // Skip own updates
```
- Prevents infinite loops
- Each device ignores its own Firebase writes

---

## 🎨 CSS Notable Classes

### Bounding Box
```css
.unit-bounding-box {
    cursor: move;
    touch-action: none;
    pointer-events: auto !important;
}
```

### Live Location Marker
```css
.live-location-marker .pulse-ring {
    animation: pulse 2s ease-out infinite;
}
```

### Unit Container
```css
.unit-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}
```

---

## 🐛 Debugging Tips

### Enable Verbose Logging
Check console for these messages:
- `✅ Firebase initialized successfully!`
- `✅ Firebase unit sync listeners initialized`
- `➕ Adding unit from another user:`
- `🔄 Updating unit from another user:`
- `➖ Removing deleted unit from another user:`
- `❌` prefix indicates errors

### Firebase Console Inspection
1. Go to https://console.firebase.google.com/
2. Click "Realtime Database"
3. Watch `mission/units/` node in real-time
4. Should see unit objects appear as users add them

### Check Sync Status
```javascript
// In browser console:
console.log(window.userId);           // Your user ID
console.log(window.deviceName);       // Your device name  
console.log(window.userColor);        // Your marker color
console.log(placedUnits.length);      // Number of local units
```

---

## 📊 Current Statistics
- **Total Lines**: ~3700 in app-core.js
- **Symbols**: 100+ military symbols
- **Firebase Listeners**: 4 (child_added, child_changed, child_removed, users)
- **Touch Gestures**: 3 (drag, rotate, pinch-resize)

---

## 🔜 Potential Next Steps

### Not Yet Implemented
- Text marker Firebase sync
- Distance measurement Firebase sync  
- Route planning Firebase sync
- Undo/redo functionality
- Unit grouping/formations
- Permission-based Firebase rules (authentication)
- Conflict resolution for simultaneous edits

### Enhancement Ideas
- Show "User X is editing this unit" indicator
- Unit history/timeline
- Export map as image (already has button, uses html2canvas)
- Offline mode with sync on reconnect
- Voice commands for unit placement

---

## 📞 Common Commands

### Update Symbol List
```cmd
cd symbols
(Get-ChildItem -Filter *.png).Name | ConvertTo-Json -Compress | Set-Content index.json -NoNewline
```

### Git Commands
```powershell
git status                    # Check changes
git add .                     # Stage all changes  
git commit -m "message"       # Commit
git push origin main          # Deploy
git log --oneline -5          # Recent commits
```

### Firebase Database Reset
```javascript
// In browser console (CAUTION - deletes all data):
firebase.database().ref('mission/units').remove();
```

---

## 📖 Documentation References
- **Leaflet**: https://leafletjs.com/reference.html
- **Firebase Realtime Database**: https://firebase.google.com/docs/database/web/start
- **MGRS Library**: https://github.com/proj4js/mgrs
- **iOS Touch Events**: https://developer.apple.com/documentation/webkitjs/touch

---

*Last Updated: [Current Session]*
*Project Status: Multi-user sync fully implemented and tested*
*Ready for deployment and multi-device testing*

