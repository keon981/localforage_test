/* eslint-disable no-console */
import { useEffect, useRef, useState } from 'react'

import * as cornerstone from 'cornerstone-core'
import * as cornerstoneMath from 'cornerstone-math'
import * as cornerstoneTools from 'cornerstone-tools'
import * as cornerstoneWebImageLoader from 'cornerstone-web-image-loader'
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import dicomParser from 'dicom-parser'
// eslint-disable-next-line max-len
// import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader/dist/dynamic-import/cornerstoneDICOMImageLoader.min.js'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import localforage from 'localforage'

cornerstoneTools.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath
cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWebImageLoader.external.cornerstoneMath = cornerstoneMath
cornerstoneWADOImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.external.cornerstoneMath = cornerstoneMath
cornerstoneWADOImageLoader.external.dicomParser = dicomParser
// cornerstoneDICOMImageLoader.webWorkerManager.initialize(config)
// cornerstoneDICOMImageLoader.external.cornerstone = cornerstone

type Stack = {
  imageIds: string[]
  currentImageIdIndex: number,
}

type Props = {
  stack:Stack
}

const baseUrl = 'wadouri:'
const imageUrl = 'https://segmentfault.com/img/remote/1460000041800574'

function CornerstoneElement({ stack }:Props) {
  const elementRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [state, setState] = useState({
    stack,
    viewport: cornerstone.getDefaultViewport(null, undefined),
    imageId: stack.imageIds[0],
  })

  const init = (id:string) => {
    if (!elementRef.current) return
    const renderRef = elementRef.current
    cornerstone.enable(renderRef, {
      renderer: 'webgl',
    })

    cornerstone
      .loadAndCacheImage(`${baseUrl}${id}`)
      .then(async (image) => {
        console.log('updateImage---', image)
        cornerstone.displayImage(renderRef, image)
      })
      .catch((err) => console.warn('image--- err', err))

    // cornerstone.getca
  }

  const initCornerstone = (url:string) => {
    if (!elementRef.current) return
    const renderRef = elementRef.current

    cornerstone.enable(renderRef, {
      renderer: 'webgl',
    })

    cornerstone
      .loadAndCacheImage(`${baseUrl}${url}`)
      .then(async (image) => {
        const newImage = {
          ...image,
          data: {
            ...image.data,
            byteArrayParser: {},
            elements: {},
          },
          getPixelData: image.getPixelData.toString(),
        }

        cornerstone.displayImage(renderRef, image)

        localforage.setItem('all', newImage)
          .then((res) => console.log('localforage res---', image, res))
          .catch((err) => console.error('localforage err---', err))
      })
      .catch((err) => console.warn('image--- err', err))
  }

  const getDBImage = async (cimage:cornerstone.Image) => {
    if (!elementRef.current) return
    const renderRef = elementRef.current

    cornerstone.enable(renderRef, {
      renderer: 'webgl',
    })
    try {
      const image = await localforage.getItem('all')

      const newImage = {
        ...image,
        getPixelData() {
          return newImage.imageFrame.pixelData
        },
      }

      cornerstone.displayImage(renderRef, newImage)
    } catch (error) {
      console.error('imageToParse--- error', error)
    }
  }

  useEffect(() => {
    // test blob

    // 初始化 Cornerstone
    // initCornerstone(stack.imageIds[0])
    cornerstone
      .loadImage(`${baseUrl}${stack.imageIds[0]}`)
      .then((image) => {
        console.log('image---', image)
        getDBImage(image)
      }).catch((err) => {
        console.error('err----------', err)
      })

    // 清理
    // return () => {
    //   // cornerstone.disable(elementRef.current as HTMLDivElement)
    //   console.log('updateImage clear---')

    //   if (elementRef.current) {
    //     const renderRef = elementRef.current
    //     cornerstone.updateImage(renderRef)
    //   }
    // }
  }, [stack.imageIds])

  return (
    <div>
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

export default CornerstoneElement
