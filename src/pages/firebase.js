// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
