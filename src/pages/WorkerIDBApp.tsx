/* eslint-disable no-bitwise */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import {
  useEffect, useLayoutEffect, useRef, useState,
} from 'react'

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
import { loadByteArrayImage } from 'src/utils/getImageFrame'
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

type Image = cornerstone.Image & {
  data?: any
  imageFrame?: any
}
type PromiseArray<T> = Promise<T>[]
type Stack = {
  currentImageIdIndex: number;
  imageIds: string[];
}
// save image worker
cornerstone.imageCache.setMaximumSizeBytes(2 * 2000 * 1024 * 1024)

function WorkerIDBApp() {
  const rangeRef = useRef<HTMLInputElement>(null)
  const elementRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageIndex, setImageIndex] = useState<number>(0)
  const [imagesUrl, setImagesUrl] = useState<string[]>([])
  cornerstone.imageCache.setMaximumSizeBytes(20 * 1024 * 1024 * 1024)
  const rangeMax = imagesUrl.length - 1

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

  const imageIdList = (dicomList: Dicom[]) => {
    return (isScheme = false) => dicomList
      .map(({ image_url }) => `${isScheme ? 'wadouri:' : ''}${image_url}`)
  }

  const displayImage = async (image: Image | cornerstone.Image) => {
    const element = elementRef.current as HTMLElement
    console.log('displayImage---', element)
    cornerstone.displayImage(element, image)
    cornerstone.updateImage(element)
  }

  const preloadImage = async (dicom: Dicom) => {
    try {
      const image = await cornerstone.loadAndCacheImage(`wadouri:${dicom.image_url}`) as Image
      const { byteArray } = image.data
      // console.log(byteArray)

      await saveImageToIDB(dicom.image_url, byteArray)
      console.log('localforage.setItem success')
    } catch (error) {
      console.error('localforage.setItem error ----------', error)
    }
  }

  // const setImage = async (imageUrl: string, index: number): Promise<Image> => {
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

  const addTool = () => {
    const { StackScrollMouseWheelTool } = cornerstoneTools
    cornerstoneTools.addTool(StackScrollMouseWheelTool)
    cornerstoneTools.setToolActive('StackScrollMouseWheel', {})
  }

  const addStack = (stack: Stack, element: HTMLElement) => {
    // const element = elementRef.current as HTMLElement
    console.log('addStack---', element)
    cornerstoneTools.addStackStateManager(element, ['stack'])
    cornerstoneTools.addToolState(element, 'stack', stack)
  }

  const setImage = async (imageUrl: string, index: number): Promise<Image | string> => {
    try {
      const image = await cornerstone.loadImage(`wadouri:${imageUrl}`) as Image
      const { byteArray } = image.data
      if (index === 0) displayImage(image)
      await saveImageToIDB(imageUrl, byteArray)
      return image
    } catch (error) {
      return imageUrl
    }
  }

  const getAllImage = async (dicomList: Dicom[], element: HTMLElement): Promise<void> => {
    if (!dicomList.length) throw new Error('undefine DICOM')
    const imageIds = imageIdList(dicomList)()
    try {
      const stack: Stack = {
        currentImageIdIndex: 0,
        imageIds: dicomList.map(({ image_url }) => `wadouri:${image_url}`),
      }
      // addStack(stack, element)
      setImagesUrl(imageIds)
      const loadPromises: PromiseArray<Image | string> = dicomList.map(({ image_url }, index) => {
        return new Promise((res) => {
          setTimeout(() => {
            res(setImage(image_url, index))
          }, index * loadingTime)
        })
      })
      const imageList = await Promise.all(loadPromises)
      if (imageList.some((image) => typeof image === 'string')) {
        const err = new Error("getAllImage Error, can't get Image")
        throw err
      }
    } catch (error) {
      const err = error instanceof Error ? error.message : 'new Error'
      throw new Error(err)
    }
  }

  const preloadAllImage = async (dicomList: Dicom[], element: HTMLElement): Promise<void> => {
    if (!dicomList.length) throw new Error('undefine DICOM')
    const imageIds = imageIdList(dicomList)
    const schemeImageIds = imageIds(true)
    console.log(schemeImageIds)

    try {
      const stack: Stack = {
        currentImageIdIndex: 0,
        imageIds: schemeImageIds,
      }
      const image = await cornerstone.loadImage(schemeImageIds[0]) as Image
      displayImage(image)
      addStack(stack, element)
      setImagesUrl(imageIds())
      // setImage(dicomList[0].image_url, 0)
    } catch (error) {
      const err = error instanceof Error ? error.message : 'new Error'
      throw new Error(err)
    }
  }

  const newloadAll = (dicomList: Dicom[], element: HTMLElement): void => {
    if (!dicomList.length) throw new Error('undefine DICOM')
    const imageIds = imageIdList(dicomList)
    const schemeImageIds = imageIds(true)
    const stack: Stack = {
      currentImageIdIndex: 0,
      imageIds: schemeImageIds,
    }
    cornerstone.loadImage(schemeImageIds[0])
      .then((image) => {
        displayImage(image)
        addStack(stack, element)
        setImagesUrl(imageIds())
      })
      .catch((error) => {
        const err = error instanceof Error ? error.message : 'new Error'
        console.log(error)
      })
  }

  const clearIDB = () => {
    localforage.clear()
      .then(() => {
        console.log('Database is now empty.')
      }).catch((err) => {
        console.log(err)
      })
  }

  const handleNext = () => (imagesUrl.length === 0
    ? 0
    : setImageIndex(imageIndex + 1))

  useLayoutEffect(() => {
    clearIDB()
  }, [])

  useEffect(() => {
    console.clear()
    const cacheInfo = cornerstone.imageCache.getCacheInfo()
    console.log(cacheInfo)

    const element = elementRef.current as HTMLElement
    cornerstone.enable(element)
    cornerstoneTools.init()
    getDicomList(workerList)
      .then((dicomList) => {
        getAllImage(dicomList, element)
        addTool()
      })
      .catch((err) => {
        console.error('getAllImage---', err)
      })

    return clearIDB()
  }, [])

  const getIDBImageAndDispaly = async (imageUrl: string) => {
    try {
      const byteArray = await localforage.getItem(imageUrl) as Uint8Array
      if (byteArray) {
        console.log('byteArray---', byteArray)

        const image = await loadByteArrayImage(byteArray, imageUrl).promise
        displayImage(image)
      } else {
        const image = await cornerstone.loadImage(`${imageUrl}`)
        console.warn('imageUrl---', imageUrl)

        displayImage(image)
      }
    } catch (error) {
      console.error('error---', error)

      cornerstone.loadAndCacheImage(`${imageUrl}`)
        .then((image) => {
          displayImage(image)
        })
        .catch((err) => {
          console.error(err)
        })
    }
  }

  useEffect(() => {
    if (imagesUrl.length === 0) return
    // cornerstone.loadImage(images[imageIndex])
    //   .then((image) => displayImage(image))
    //   .catch((err) => console.error('err--', err))
    getIDBImageAndDispaly(imagesUrl[imageIndex])
  }, [imageIndex])

  // const cacheInfo = cornerstone.imageCache.getCacheInfo()
  // useEffect(() => {
  //   console.log(cacheInfo)
  // }, [cacheInfo])

  return (
    <div>
      <h2>cornerStone: {imageIndex + 1}
        <br />
      </h2>
      <form>
        <input
          type="range"
          min={0}
          max={rangeMax}
          ref={rangeRef}
          defaultValue={imageIndex}
          onChange={(ev) => {
            setImageIndex(Number(ev.target.value))
          }}
        />
      </form>
      <button
        type="button"
        onClick={handleNext}
      >
        next
      </button>
      <div
        className="viewportElement"
        ref={elementRef}
        style={{
          width: '514px',
          height: '514px',
        }}
      >
        <canvas
          ref={canvasRef}
          className="cornerstone-canvas"
        />
      </div>
    </div>
  )
}

export default WorkerIDBApp
