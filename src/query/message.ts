import * as firebase from 'firebase'
import { Observable, Subject, Subscription } from 'rxjs'
import { collectionData } from 'rxfire/firestore'
import { filter, map } from 'rxjs/operators'
import { Message } from '../domain/message/message'
import { Id } from '../firebase/type'
import { firestore } from '../firebase'
import { getMessagePath } from '../firebase/collectionSchema'

export type MessageDoc = Message & { createdAt: firebase.firestore.Timestamp }

export function messageMapper(messageDocRef: MessageDoc): Message {
  let createdAt
  if (messageDocRef.createdAt) {
    createdAt = messageDocRef.createdAt.toDate()
  } else {
    createdAt = new Date()
  }

  return {
    ...messageDocRef,
    createdAt,
  }
}

export function getPaginationQuery(query: firebase.firestore.Query, limit: number, startAfter?: Date) {
  let newQuery = query.orderBy('createdAt', 'desc').limit(limit)
  if (startAfter) {
    newQuery = newQuery.startAfter(startAfter)
  }
  return newQuery
}

function connectMessage(roomId: Id, limit: number, startAfter?: Date) {
  const query = firestore.collection(getMessagePath(roomId))
  return collectionData<MessageDoc>(getPaginationQuery(query, limit, startAfter), 'id').pipe(filter((dataList) => dataList.length > 0))
}

export type MessagesData = { roomId: Id; messages: Message[] }

export class MessageObserver {
  private readonly _messages: Subject<MessagesData> = new Subject<MessagesData>()

  private readonly _subscriptions: { [roomId: string]: Subscription[] } = {}

  get messages$(): Observable<MessagesData> {
    return this._messages
  }

  public fetchMessage(roomId: Id, limit: number, startAfter?: Date) {
    const subscription = connectMessage(roomId, limit, startAfter)
      .pipe(map((dataList) => ({ roomId, messages: dataList.map(messageMapper) })))
      .subscribe(this._messages)
    if (!this._subscriptions[roomId]) {
      this._subscriptions[roomId] = []
    }
    this._subscriptions[roomId].push(subscription)
  }

  public depose(roomId: Id) {
    if (this._subscriptions[roomId]) {
      this._subscriptions[roomId].forEach((subscription) => subscription.unsubscribe())
    }
  }

  public deposeAll() {
    Object.keys(this._subscriptions).forEach((roomId) => this.depose(roomId))
  }
}
