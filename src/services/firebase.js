import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDodw-1V7qjgu1LCVMOKhR78pHjbKlGdhw',
  authDomain: 'calorie-wise-7659f.firebaseapp.com',
  projectId: 'calorie-wise-7659f',
  storageBucket: 'calorie-wise-7659f.firebasestorage.app',
  messagingSenderId: '777976677846',
  appId: '1:777976677846:web:e924f829b05f5badfc9077',
  measurementId: 'G-8T6751RTD8'
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app
