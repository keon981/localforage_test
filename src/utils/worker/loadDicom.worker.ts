import cornerstone from 'cornerstone-core'
import cornerstoneWebImageLoader from 'cornerstone-web-image-loader'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import * as cornerstoneMath from 'cornerstone-math'
import dicomParser from 'dicom-parser'
import localforage from 'localforage'
import { expose } from 'comlink'
import type { Dicom } from '../API'
import { getImageKeyList } from '../IDB'

// // Cornerstonejs
cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWebImageLoader.external.cornerstoneMath = cornerstoneMath
cornerstoneWADOImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.external.cornerstoneMath = cornerstoneMath
cornerstoneWADOImageLoader.external.dicomParser = dicomParser

const saveImageToIDB = async (imageUrl: string, byteArray: Uint8Array) => {
  const imageKeyList = getImageKeyList(imageUrl)
  if (!imageKeyList.study_id) return

  const db = localforage.createInstance({
    name: imageKeyList.study_id,
    storeName: imageKeyList.series_id,
  })

  try {
    await db.setItem(imageKeyList.object_id, byteArray)
    console.log('saveImageToIDB--- success')
  } catch (error) {
    console.error('saveImageToIDB--- error', error)
  }
}

export const preloadWorker = async (dicom: Dicom) => {
  try {
    const image = await cornerstone.loadImage(`wadouri:${dicom.image_url}`)
    // const msg = await saveImage(`${stack.imageIds[0]}`, image.data.byteArray)
    const { byteArray } = image.data

    await saveImageToIDB(dicom.image_url, byteArray)
  } catch (error) {
    console.error('localforage.setItem error ----------', error)
  }
}

export type PreloadWorkerType = typeof preloadWorker

expose(preloadWorker)
