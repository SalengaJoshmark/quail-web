// Firebase core
import { initializeApp } from "firebase/app";

// Firebase services
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyATeu_ZLnQRFpbh71uWPC-KN5OY6ougvmo",
  authDomain: "exp1-cff54.firebaseapp.com",
  databaseURL: "https://exp1-cff54-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "exp1-cff54",
  storageBucket: "exp1-cff54.firebasestorage.app",
  messagingSenderId: "441160922275",
  appId: "1:441160922275:web:3be95c1efc6090eac8fb16",
  measurementId: "G-8QHS6048KT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const db = getFirestore(app);
export const auth = getAuth(app);