// import cornerstone from 'cornerstone-core'
// import cornerstoneWebImageLoader from 'cornerstone-web-image-loader'
// import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
// import * as cornerstoneMath from 'cornerstone-math'
// import dicomParser from 'dicom-parser'
import { expose } from 'comlink'
import localforage from 'localforage'

// // Cornerstonejs
// cornerstoneWebImageLoader.external.cornerstone = cornerstone
// cornerstoneWebImageLoader.external.cornerstoneMath = cornerstoneMath
// cornerstoneWADOImageLoader.external.cornerstone = cornerstone
// cornerstoneWADOImageLoader.external.cornerstoneMath = cornerstoneMath
// cornerstoneWADOImageLoader.external.dicomParser = dicomParser

export const saveinIDB = async (imageId: string, byteArray: Uint8Array) => {
  try {
    localforage.setItem(imageId, byteArray)
    return 'webworker---  success'
  } catch (error) {
    throw new Error('saveinIDB is error')
  }
}

expose(saveinIDB)
