import 'firebase/auth'
import 'firebase/firestore'
import firebase from 'firebase/app'
import config from './config.json'
import { installApp } from './src'
import { startDebug } from './src/debug';
import Group from './components/group';

const app = firebase.initializeApp(config)
const firestore = firebase.firestore(app)
installApp(firestore)

startDebug()

export default Group
