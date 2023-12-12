let request: IDBOpenDBRequest
let db: IDBDatabase
let version = 1

export interface ThisIsUser {
  id: string,
  name: string
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
        alert(`request.onsuccess - initDB : ${version}`)
        console.log('request.onsuccess - initDB', version)
        resolve(true)
      }

      request.onerror = () => {
        alert('error')
        resolve(false)
      }
    }
  })
}
