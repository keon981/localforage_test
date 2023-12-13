let request: IDBOpenDBRequest
let db: IDBDatabase
let version = 1

export interface ThisIsUser {
  id: string,
  name: string
  email: string
}

export enum Stores {
  Users = 'users',
}

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve) => {
    request = indexedDB.open('newDB')

    request.onupgradeneeded = () => {
      db = request.result
      if (!db.objectStoreNames.contains(Stores.Users)) {
        console.log('create users store')
        db.createObjectStore(Stores.Users, { keyPath: 'id' })
      }

      request.onsuccess = () => {
        db = request.result
        version = db.version
        alert('request.onsuccess - initDB ')
        resolve(true)
      }

      request.onerror = () => {
        alert('error')
        resolve(false)
      }
    }
  })
}

export const addData = <T>(stroeName: string, data: T): Promise<T | string> => new Promise(
  (resolve) => {
    request = indexedDB.open('newDB', version)

    request.onsuccess = () => {
      console.log('onsuccess - addData:', db)
      db = request.result
      const tx = db.transaction(stroeName, 'readwrite')
      const store = tx.objectStore(stroeName)
      store.add(data)
      resolve(data)
    }

    request.onerror = () => {
      const error = request.error?.message
      if (error) {
        resolve(error)
      } else {
        resolve('unknown error')
      }
    }
  },
)
