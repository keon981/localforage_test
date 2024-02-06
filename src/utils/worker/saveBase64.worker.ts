import localforage from 'localforage'
import { expose } from 'comlink'
import { encode } from 'base64-arraybuffer-es6'

const saveBase64ToDB = async (imageUrl: string, byteArray: Uint8Array): Promise<void> => {
  const byteBase64 = encode(byteArray)
  try {
    await localforage.setItem(imageUrl, byteBase64)
  } catch (error) {
    console.error('setDB error', error)
  }
}

export type SaveBase64ToDBType = typeof saveBase64ToDB

expose(saveBase64ToDB)
