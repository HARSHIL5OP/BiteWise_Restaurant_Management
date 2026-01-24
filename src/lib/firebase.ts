import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB1AeCif_M4vRDDpHvvQIBWX_dO14wIo68",
    authDomain: "odoo-cafe-2.firebaseapp.com",
    projectId: "odoo-cafe-2",
    storageBucket: "odoo-cafe-2.firebasestorage.app",
    messagingSenderId: "1063217105221",
    appId: "1:1063217105221:web:828c4693b8ed784ec8d62c",
    measurementId: "G-MSB6YL302Z"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export { auth, db, googleProvider, githubProvider };
