import React from 'react'
import { StyleSheet, Text, View, Button, ScrollView } from 'react-native'
import { Subscription } from 'rxjs'
import {
  MessageObserver,
  isTextMessage,
  isNoteMessage,
  sendTextMessage,
  Message,
  UnreadMessageObserver,
  RoomObserver,
  TimelineObserver,
} from 'common-messanger'
import { filter, map } from 'rxjs/operators'
import * as firebase from 'firebase/app'

const roomId = '1'

type Props = {}
type State = {
  messages: Message[]
  subscription: Subscription | null
}
const messageObserver = new MessageObserver()

function renderMessage(message: Message) {
  if (isTextMessage(message)) {
    return (
      <Text style={{
        fontSize: 20,
        color: 'black',
        fontWeight: 'bold',
      }}>{`text: ${message.text}`}</Text>)
  } else if (isNoteMessage(message)) {
    return (
      <Text style={{
        fontSize: 20,
        color: 'black',
        fontWeight: 'bold',
      }}>{`noteId: ${message.noteId}`}</Text>)
  } else {
    return (
      <Text style={{
        fontSize: 20,
        color: 'black',
        fontWeight: 'bold',
      }}>{`imageUrl: ${message.imageUrl}`}</Text>)
  }
}

function onPress() {
  sendTextMessage(roomId, {
    text: `Hello world! ${Math.random() * 100}`
  })
}

export default class OneToOne extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      messages: [],
      subscription: null,
    }
  }

  componentDidMount() {
    const subscription = messageObserver
      .messages$
      .pipe(filter(data => data.roomId === roomId))
      .pipe(map(data => data.messages))
      .subscribe(messages => this.setState({ messages }))
    this.setState({ subscription })
    messageObserver.fetchMessage(roomId, 10)

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        console.log('userId', user.uid)
        const unreadMessageObserver = new UnreadMessageObserver()
        unreadMessageObserver
          .unreadMessages$
          .subscribe((unreadMessages) => console.log('unreadMessages', unreadMessages))

        console.log('fetchUnreadMessages')
        unreadMessageObserver.fetchUnreadMessages(roomId)

        const roomObserver = new RoomObserver()
        roomObserver.rooms$.subscribe(rooms => {
          console.log('rooms', rooms)
        })
        console.log('fetchRooms')
        roomObserver.fetchRooms(10)

        const timelineObserver = new TimelineObserver(new RoomObserver(), new UnreadMessageObserver(), new MessageObserver())
        timelineObserver.rooms$.subscribe(roomActivities => console.log('roomActivities', roomActivities))
        console.log('fetch timelineObserver')
        timelineObserver.fetchRooms(10)
      }
    })
  }

  componentWillUnmount() {
    if (this.state.subscription) {
      this.state.subscription.unsubscribe()
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>Open up App.js to start working on your app!</Text>
        <Button
          title={"add new Article"}
          onPress={() => onPress()}
        />
        <View style={{ height: 300 }} >
          <ScrollView>
            {this.state.messages.map(message => (
              <View key={message.id} style={{
                backgroundColor: 'pink',
                height: 45,
                justifyContent: 'center',
                paddingLeft: 20,
              }}>{renderMessage(message)}</View>
            ))}
          </ScrollView>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#008080',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
