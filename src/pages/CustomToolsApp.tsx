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
import { getAllDicomList } from 'src/utils'
import { loadByteArrayImage } from 'src/utils/getImageFrame'
import { saveImageToIDB } from 'src/utils/IDB'
import MyStackScrollTool from 'src/utils/tools/customStackScrollTool'

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
    // const { StackScrollMouseWheelTool } = cornerstoneTools
    cornerstoneTools.addTool(MyStackScrollTool, { name: 'MyStackScrollTool' })
    cornerstoneTools.setToolActive('MyStackScrollTool', {})
  }

  const addStack = (stack: Stack, element: HTMLElement) => {
    // const element = elementRef.current as HTMLElement
    cornerstoneTools.addStackStateManager(element, ['stack'])
    cornerstoneTools.addToolState(element, 'stack', stack)
  }

  const setImage = async (imageUrl: string, index: number): Promise<Image | string> => {
    try {
      const image = await cornerstone.loadImage(`wadouri:${imageUrl}`) as Image
      const { byteArray } = image.data
      if (index === 0) {
        displayImage(image)
      }
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

      const imageList: (string | Image)[] = []

      dicomList.forEach(({ image_url }, index) => {
        setTimeout(() => {
          setImage(image_url, index)
            .then((res) => imageList.push(res))
        }, index * loadingTime)
      })
      console.log(imageList)
    } catch (error) {
      console.log(error)

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

  const renderDicom = (dicomList: Dicom[]) => {
    const element = elementRef.current as HTMLElement
    cornerstone.enable(element)
    console.log('dicomList---', dicomList)
    preloadAllImage(dicomList, element)
    addTool()
  }

  useEffect(() => {
    console.clear()
    cornerstoneTools.init([
      {
        moduleName: 'segmentation',
        configuration: {
          minRadius: 8,
          maxRadius: 150,
        },
      },
    ])
    getAllDicomList(workerList)
      .then((dicomList) => {
        /*
          1. 取得全部dicomList
          2. 如果 IDB 沒有儲存的話，就一邊 preload 一邊儲存
          3. 如果 IDB
        */
        renderDicom(dicomList)
      })
      .catch((err) => {
        console.error('getAllImage---', err)
      })
  }, [])

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
            const num = Number(ev.target.value)
          }}
        // disabled
        />
      </form>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
      >
        <button
          type="button"
          onClick={() => {
            const cacheInfo = cornerstone.imageCache.getCacheInfo()
            localforage.key(2)
              .then((res) => {
                console.log('key---', res)
              })
              .catch((res) => {
                console.error('key error---', res)
              })
          }}
        >
          log cacheInfo
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
