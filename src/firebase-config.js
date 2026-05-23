// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDs9QyajLEGD1wHHjLKcKKyG_RjbIDY8XY",
  authDomain: "smartspend-6754f.firebaseapp.com",
  projectId: "smartspend-6754f",
  storageBucket: "smartspend-6754f.firebasestorage.app",
  messagingSenderId: "169545505823",
  appId: "1:169545505823:web:227e16e7561c47f083892a",
  measurementId: "G-KV9115P0Q7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, collection, addDoc, query, where, getDocs, deleteDoc, doc };
