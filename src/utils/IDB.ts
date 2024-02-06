import { encode } from 'base64-arraybuffer-es6'
import localforage from 'localforage'

export const getImageKeyList = (url: string) => {
  const regex = /studyUID=([\d.]+)&seriesUID=([\d.]+)&objectUID=([\d.]+)/
  const match = `${url}`.match(regex)
  return match ? {
    study_id: match[1],
    series_id: match[2],
    object_id: match[3],
  } : {
    study_id: null,
    series_id: null,
    object_id: null,
  }
}

export const saveBase64ToDB = async (imageUrl: string, byteArray: Uint8Array) => {
  const byteBase64 = encode(byteArray)
  try {
    await localforage.setItem(imageUrl, byteBase64)
  } catch (error) {
    console.error('setDB error', error)
  }
}

export const saveImageToIDB = async (imageUrl: string, byteArray: Uint8Array) => {
  try {
    await localforage.setItem(imageUrl, byteArray)
  } catch (error) {
    console.error('saveImageToIDB--- error', error)
  }
}
