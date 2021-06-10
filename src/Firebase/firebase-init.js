import firebase from "firebase/app"
import config from "./firebase-config.json"
import 'firebase/analytics'
import 'firebase/performance'

firebase.initializeApp(config)

if (location.hostname != 'localhost') {
  firebase.analytics()
  firebase.performance()
}