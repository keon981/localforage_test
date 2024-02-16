/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
import type { Dicom } from 'src/utils/API'
import localforage from 'localforage'
import { getDicomList } from 'src/utils'
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

const workerList = import.meta.env.VITE_workerList
const loadingTime = import.meta.env.VITE_loadingTime
// const imageCacheSize = import.meta.env.VITE_imageCacheSize

// Cornerstonejs
const scrollToIndex = cornerstoneTools.import('util/scrollToIndex')
const scroll = cornerstoneTools.importInternal('util/scroll')

// save image worker
// cornerstone.imageCache.setMaximumSizeBytes(imageCacheSize * 1024 * 1024)

function CustomToolsApp() {
  // useRef
  const rangeRef = useRef<HTMLInputElement>(null)
  const elementRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // useState
  const [imageIndex, setImageIndex] = useState<number>(0)
  const [imagesUrl, setImagesUrl] = useState<string[]>([])

  const rangeMax = imagesUrl.length - 1

  const imageIdList = (dicomList: Dicom[]) => {
    return (isScheme = false) => dicomList
      .map(({ image_url }) => `${isScheme ? 'wadouri:' : ''}${image_url}`)
  }

  const displayImage = async (image: Image | cornerstone.Image) => {
    const element = elementRef.current as HTMLElement
    cornerstone.displayImage(element, image)
    cornerstone.updateImage(element)
  }

  const addTool = () => {
    const { StackScrollMouseWheelTool } = cornerstoneTools
    cornerstoneTools.addTool(StackScrollMouseWheelTool)
    cornerstoneTools.setToolActive('StackScrollMouseWheel', {})
  }

  const addStack = (stack: Stack, element: HTMLElement) => {
    // const element = elementRef.current as HTMLElement
    cornerstoneTools.addStackStateManager(element, ['stack'])
    cornerstoneTools.addToolState(element, 'stack', stack)
  }

  const setImage = async (imageUrl: string, index: number): Promise<Image | string> => {
    try {
      const image = await cornerstone.loadImage(`wadouri:${imageUrl}`) as Image
      if (index === 0) displayImage(image)
      const { byteArray } = image.data
      await saveImageToIDB(imageUrl, byteArray)
      return image
    } catch (error) {
      console.error('setImage---', error)
      return imageUrl
    }
  }

  const preloadAllImage = async (dicomList: Dicom[], element: HTMLElement): Promise<void> => {
    // 預下載所有圖片到 indexedDB
    if (!dicomList.length) throw new Error('undefine DICOM')
    const imageIds = imageIdList(dicomList)
    const schemeImageIds = imageIds(true)

    try {
      const stack: Stack = {
        currentImageIdIndex: 0,
        imageIds: schemeImageIds,
      }
      addStack(stack, element)
      setImagesUrl(imageIds())

      const loadPromises: PromiseArray<Image | string> = dicomList
        .map(({ image_url }, index) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(setImage(image_url, index))
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

  const clearIDB = () => {
    localforage.clear()
      .then(() => {
        console.log('Database is now empty.')
      }).catch((err) => {
        console.log(err)
      })
  }

  const handlePrev = () => (imageIndex <= 0
    ? setImageIndex(0)
    : setImageIndex(imageIndex - 1))

  const handleNext = () => (imagesUrl.length === 0
    ? setImageIndex(0)
    : setImageIndex(imageIndex + 1))

  const getIDBImageAndDispaly = async (imageUrl: string) => {
    try {
      const byteArray = await localforage.getItem(imageUrl) as Uint8Array
      if (byteArray) {
        const image = await loadByteArrayImage(byteArray, imageUrl).promise
        displayImage(image)
      } else {
        const image = await cornerstone.loadImage(`${imageUrl}`)
        console.warn('imageUrl---', imageUrl)

        displayImage(image)
      }
    } catch (error) {
      console.error('error---', error)
    }
  }

  useLayoutEffect(() => {
    clearIDB()
  }, [])

  useEffect(() => {
    console.clear()
    const cacheInfo = cornerstone.imageCache.getCacheInfo()
    console.log(cacheInfo)

    const element = elementRef.current as HTMLElement
    cornerstone.enable(element)
    cornerstoneTools.init([
      {
        moduleName: 'segmentation',
        configuration: {
          minRadius: 8,
          maxRadius: 150,
        },
      },
    ])
    getDicomList(workerList)
      .then((dicomList) => {
        preloadAllImage(dicomList, element)
        addTool()
      })
      .catch((err) => {
        console.error('getAllImage---', err)
      })

    return clearIDB()
  }, [])

  useEffect(() => {
    if (imagesUrl.length === 0) return
    getIDBImageAndDispaly(imagesUrl[imageIndex])
  }, [imageIndex])

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
        // disabled
        />
      </form>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button type="button" onClick={handlePrev}>
          prev
        </button>
        <button
          type="button"
          onClick={() => {
            const cacheInfo = cornerstone.imageCache.getCacheInfo()
            console.log(cacheInfo, imagesUrl)
          }}
        >
          log cacheInfo
        </button>
        <button type="button" onClick={handleNext}>
          next
        </button>

      </div>
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

export default CustomToolsApp
