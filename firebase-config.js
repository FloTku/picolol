// ================================================
//  FIREBASE CONFIG — Picolol
// ================================================

const firebaseConfig = {
  apiKey:            "AIzaSyD6JtqXHDk4TglDyNZ4iRPA8gYWi0uSjjM",
  authDomain:        "picolol-d75f9.firebaseapp.com",
  databaseURL:       "https://picolol-d75f9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "picolol-d75f9",
  storageBucket:     "picolol-d75f9.firebasestorage.app",
  messagingSenderId: "1046593597094",
  appId:             "1:1046593597094:web:6237edbf11813a3824ce67",
};

firebase.initializeApp(firebaseConfig);

// Realtime Database
const db   = firebase.database();
const auth = firebase.auth();

// Connexion anonyme automatique au chargement
firebase.auth().signInAnonymously().catch(err => {
  console.warn('Auth anonyme échouée :', err.message);
});
