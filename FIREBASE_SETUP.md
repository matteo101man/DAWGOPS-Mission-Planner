# Firebase Setup Guide for Tactical Mission Planner

## Step-by-Step Setup

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add Project" or "Create a project"
3. Name it: `tactical-mission-planner`
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Set Up Realtime Database
1. In Firebase Console, click **"Realtime Database"** in left menu
2. Click **"Create Database"**
3. Choose your region (closest to you)
4. **Start in TEST MODE** ⚠️
5. Click **"Enable"**

### 3. Get Your Firebase Config
1. Click the ⚙️ gear icon → **"Project settings"**
2. Scroll to "Your apps" section
3. Click the web icon `</>`
4. App nickname: `Tactical Planner Web`
5. DON'T check "Also set up Firebase Hosting"
6. Click **"Register app"**
7. **Copy the firebaseConfig object**

### 4. Update firebase-config.js
Open `public/js/firebase-config.js` and replace the placeholder values with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

### 5. Set Database Rules (Important for Security!)
1. In Firebase Console → Realtime Database → **"Rules"** tab
2. Replace with these rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".write": "$uid === auth.uid || data.child('lastUpdate').val() < (now - 60000)",
        ".read": true
      }
    }
  }
}
```

This allows:
- Anyone can READ user locations
- Users can only WRITE their own location
- Stale locations (>60 seconds) can be cleaned up

### 6. Push to GitHub
```bash
git add public/js/firebase-config.js FIREBASE_SETUP.md app.html public/js/app-core.js
git commit -m "Add Firebase real-time location sharing"
git push
```

### 7. Test It!
1. Open your GitHub Pages site on your phone
2. Allow location access
3. Enter your name when prompted
4. Open the same site on another device (or incognito tab)
5. You should see both users' locations with different colored dots!

## How It Works

- **Your location**: Synced to Firebase every time GPS updates
- **Other users**: Firebase notifies you instantly when they move
- **Stale users**: Removed after 30 seconds of inactivity
- **Colors**: 8 different colors assigned automatically
- **Names**: Each user enters their name on first load

## Features

✅ Real-time location tracking
✅ Multiple user support (unlimited on free tier)
✅ Different colored dots per user
✅ Name labels on markers
✅ Pulsing animation
✅ Auto-cleanup of disconnected users
✅ Works offline (falls back to local mode)

## Troubleshooting

**"Firebase not configured"** in console:
- Check that firebase-config.js has your actual credentials
- Make sure the database URL is correct

**Can't see other users:**
- Check database rules are set correctly
- Make sure both users allowed location access
- Check Firebase Console → Realtime Database → Data tab to see if locations are being saved

**Permission denied errors:**
- Update your database rules (see step 5)

## Privacy & Security Notes

⚠️ **Location data is PUBLIC** with test mode rules!

For production use:
1. Enable Firebase Authentication
2. Update rules to require sign-in
3. Add user authentication to the app

## Free Tier Limits

Firebase free tier includes:
- 100,000 simultaneous connections
- 1GB stored data
- 10GB/month data transfer

Perfect for small teams (5-50 users)!

