import localforage from 'localforage'
import { expose } from 'comlink'

export const saveScript = async (imageUrl: string, byteArray: Uint8Array) => {
  try {
    await localforage.setItem(imageUrl, byteArray)
    console.log('saveImageToIDB--- success')
  } catch (error) {
    console.error('saveImageToIDB--- error', error)
  }
}

export type SaveScriptType = typeof saveScript

expose(saveScript)
