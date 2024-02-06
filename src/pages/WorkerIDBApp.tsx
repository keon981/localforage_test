/* eslint-disable no-bitwise */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import { useEffect, useLayoutEffect, useRef } from 'react'

import * as cornerstone from 'cornerstone-core'
import * as cornerstoneMath from 'cornerstone-math'
import * as cornerstoneWebImageLoader from 'cornerstone-web-image-loader'
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import * as cornerstoneTools from 'cornerstone-tools'
import Hammer from 'hammerjs'
import dicomParser from 'dicom-parser'
import {
  composeSeriesData, fetchDicomInstances, fetchProjectInfo, composeDicomList, getUserToken,
} from 'src/utils/API'
import type { Dicom } from 'src/utils/API'
import localforage from 'localforage'
import { createImageObject } from 'src/utils/getImageFrame'
import { saveImageToIDB } from 'src/utils/IDB'

cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWebImageLoader.external.cornerstoneMath = cornerstoneMath
cornerstoneWADOImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.external.cornerstoneMath = cornerstoneMath
cornerstoneWADOImageLoader.external.dicomParser = dicomParser
cornerstoneTools.external.Hammer = Hammer
cornerstoneTools.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath

const workerList = 87760
const loadingTime = 50

// save image worker

function WorkerIDBApp() {
  const elementRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderer = new cornerstoneTools.stackRenderers.FusionRenderer()
  renderer.findImageFn = (imageIds: string[]) => imageIds[0]

  const getDicomList = async (id: string | number): Promise<Dicom[]> => {
    try {
      const { token } = await getUserToken()
      const info = await fetchProjectInfo(token, id)
      const studyList = await fetchDicomInstances(info.studyid)
      const seriesList = await composeSeriesData(studyList)
      const dicomList = composeDicomList(seriesList)
      return dicomList
    } catch (error) {
      const err = error instanceof Error ? error.message : 'new Error'
      throw new Error(err)
    }
  }

  const loadByteArrayImage = (byteArray: Uint8Array) => {
    const promise = new Promise<cornerstone.Image>((resolve, reject) => {
      const dataSet = dicomParser.parseDicom(byteArray)
      const image = createImageObject(dataSet)
      if (image) {
        resolve(image)
      } else {
        reject(new Error('create Image error'))
      }
    })

    return {
      promise,
    }
  }

  const displayImage = async (image: cornerstone.Image) => {
    const element = elementRef.current as HTMLElement
    cornerstone.enable(element)
    cornerstone.displayImage(element, image)
    cornerstone.updateImage(element)
  }

  const preloadImage = async (dicom: Dicom) => {
    try {
      const image = await cornerstone.loadImage(`wadouri:${dicom.image_url}`)
      const { byteArray } = image.data
      // console.log(byteArray)

      await saveImageToIDB(dicom.image_url, byteArray)
      console.log('localforage.setItem success')
    } catch (error) {
      console.error('localforage.setItem error ----------', error)
    }
  }

  // const setImage = async (imageUrl: string, index: number): Promise<cornerstone.Image> => {
  //   try {
  //     const byteArray = await localforage.getItem(imageUrl) as Uint8Array
  //     const image = await loadByteArrayImage(byteArray).promise
  //     if (index === 0) displayImage(image)
  //     return image
  //   } catch (error) {
  //     const image = await cornerstone.loadImage(`wadouri:${imageUrl}`)
  //     const { byteArray } = image.data
  //     await saveImageWorker(imageUrl, byteArray)
  //     return image
  //   }
  // }

  const setImage = async (imageUrl: string, index: number): Promise<cornerstone.Image | string> => {
    try {
      const image = await cornerstone.loadImage(`wadouri:${imageUrl}`)
      const { byteArray } = image.data
      if (index === 0) displayImage(image)
      await saveImageToIDB(imageUrl, byteArray)
      return image
    } catch (error) {
      return imageUrl
    }
  }

  const getAllImage = async (dicomList: Dicom[]): Promise<void> => {
    if (!dicomList.length) throw new Error('undefine DICOM')

    try {
      const loadPromises: (Promise<cornerstone.Image | string>)[] = []
      // eslint-disable-next-line array-callback-return
      dicomList.forEach(({ image_url }, index) => {
        setTimeout(async () => {
          loadPromises.push(setImage(image_url, index))
        }, index * loadingTime)
      })
      const imageList = await Promise.all(loadPromises)
      if (imageList.some((image) => typeof image === 'string')) {
        const err = new Error("getAllImage Error, can't get Image")
        console.error(err)

        throw err
      }
    } catch (error) {
      const err = error instanceof Error ? error.message : 'new Error'
      throw error
    }
  }
  const clearIDB = () => {
    localforage.clear()
      .then(() => {
        console.log('Database is now empty.')
      }).catch((err) => {
        console.log(err)
      })
  }

  useLayoutEffect(() => {
    clearIDB()
  }, [])

  useEffect(() => {
    console.clear()
    console.log('-----------------------')
    getDicomList(workerList)
      .then((dicomList) => getAllImage(dicomList))
      .catch((err) => {
        console.error('getAllImage---', err)
      })

    return clearIDB()
  }, [])

  return (
    <div>
      <h2>cornerStone:</h2>
      <div
        className="viewportElement"
        ref={elementRef}
        style={{
          width: '514px',
          height: '514px',
        }}
      >
        <canvas ref={canvasRef} className="cornerstone-canvas" />
      </div>
    </div>
  )
}

export default WorkerIDBApp
