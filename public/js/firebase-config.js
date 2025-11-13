// Firebase Configuration for Tactical Mission Planner
const firebaseConfig = {
  apiKey: "AIzaSyC9w8gSxC-BXatSUTd0oWDPdIV-nzA1K3Q",
  authDomain: "tactical-mission-planner.firebaseapp.com",
  databaseURL: "https://tactical-mission-planner-default-rtdb.firebaseio.com",
  projectId: "tactical-mission-planner",
  storageBucket: "tactical-mission-planner.firebasestorage.app",
  messagingSenderId: "973679041264",
  appId: "1:973679041264:web:c6ffe8f5bbe3552161c035"
};

// Initialize Firebase (using compat SDK)
try {
  firebase.initializeApp(firebaseConfig);
  window.database = firebase.database();
  console.log('✅ Firebase initialized successfully!');
  
  // Generate a unique user ID for this session
  window.userId = 'user_' + Math.random().toString(36).substr(2, 9);

  // Get a friendly device name
  window.deviceName = prompt('Enter your name:', 
    (navigator.userAgent.includes('iPhone') ? 'iPhone' : 
     navigator.userAgent.includes('iPad') ? 'iPad' :
     navigator.userAgent.includes('Android') ? 'Android' : 'Device') + ' User'
  ) || 'Anonymous';

  // Assign a color based on user ID
  const userColors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#9C27B0', '#FF6D00', '#00BCD4', '#E91E63'];
  window.userColor = userColors[Math.abs(window.userId.split('_')[1].split('').reduce((a,b)=>(a<<5)-a+b.charCodeAt(0),0)) % userColors.length];

  console.log('👤 User ID:', window.userId);
  console.log('📛 Device Name:', window.deviceName);
  console.log('🎨 User Color:', window.userColor);
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  console.log('Running in offline mode');
}

