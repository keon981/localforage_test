/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-underscore-dangle */
import * as cornerstone from 'cornerstone-core'
import * as cornerstoneMath from 'cornerstone-math'
import * as cornerstoneTools from 'cornerstone-tools'
import Hammer from 'hammerjs'
import localforage from 'localforage'
import { loadByteArrayImage } from '../getImageFrame'

cornerstoneTools.external.Hammer = Hammer
cornerstoneTools.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath
const { loadHandlerManager, EVENTS, requestPoolManager } = cornerstoneTools
const BaseTool = cornerstoneTools.import('base/BaseTool')

// const scrollToIndex = cornerstoneTools.import('util/scrollToIndex')
const clip = cornerstoneTools.import('util/clip')
const triggerEvent = cornerstoneTools.import('util/triggerEvent')
// const requestPoolManager = cornerstoneTools.import('requestPool/requestPoolManager')

const scroll = (element: HTMLElement, images: number, loop = false) => {
  const toolData = cornerstoneTools.getToolState(element, 'stack')
  if (!toolData || !toolData.data || !toolData.data.length) return
  const stackData = toolData.data[0]
  if (!stackData.pending) {
    stackData.pending = []
  }

  let newImageIdIndex = stackData.currentImageIdIndex + images
  if (loop) {
    const nbImages = stackData.imageIds.length
    newImageIdIndex %= nbImages
  } else {
    newImageIdIndex = clip(newImageIdIndex, 0, stackData.imageIds.length - 1)
  }

  // scrollToIndex(element, newImageIdIndex)

  // eslint-disable-next-line func-names
  (function () {
    let stackRenderer: any
    const hasMultipleStacks = toolData.data.length > 1
    const [stackRendererData] = cornerstoneTools.getToolState(element, 'stackRenderer')?.data || []
    if (hasMultipleStacks && stackRendererData) {
      stackRenderer = stackRendererData
    }

    if (newImageIdIndex < 0) {
      newImageIdIndex += stackData.imageIds.length
    }
    if (newImageIdIndex === stackData.currentImageIdIndex) return

    const startLoadingHandler = loadHandlerManager.getStartLoadHandler(element)
    const endLoadingHandler = loadHandlerManager.getEndLoadHandler(element)
    const errorLoadingHandler = loadHandlerManager.getErrorLoadingHandler(element)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const doneCallback = (image: any) => {
      if (stackData.currentImageIdIndex !== newImageIdIndex) return

      try {
        cornerstone.getEnabledElement(element)
      } catch (error) {
        // eslint-disable-next-line no-useless-return
        return
      }

      if (stackRenderer) {
        stackRenderer.currentImageIdIndex = newImageIdIndex
        stackRenderer.render(element, toolData.data)
      } else {
        cornerstone.displayImage(element, image)
      }

      if (endLoadingHandler) {
        endLoadingHandler(element, image)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const failCallback = (error: any) => {
      const imageId = stackData.imageIds[newImageIdIndex]

      if (errorLoadingHandler) errorLoadingHandler(element, imageId, error)
    }

    if (startLoadingHandler) {
      startLoadingHandler(element)
    }

    const envData = {
      newImageIdIndex,
      direction: newImageIdIndex - stackData.currentImageIdIndex,
    }
    stackData.currentImageIdIndex = newImageIdIndex
    const newImageId = stackData.imageIds[newImageIdIndex]
    const preventCache = !!stackData.preventCache
    let imagePromise

    const imageUrl = newImageId.replace(/^wadouri:/i, '')
    localforage
      .getItem(imageUrl)
      .then(async (arrayBuffer) => {
        const byteArray = new Uint8Array(arrayBuffer as ArrayBuffer)
        if (byteArray) {
          const image = await loadByteArrayImage(byteArray, imageUrl).promise
          cornerstone.displayImage(element, image)
        }
      })
      .catch((err) => {
        console.error('loadByteArrayImage', err)
        if (preventCache) {
          imagePromise = cornerstone.loadImage(newImageId)
        } else {
          imagePromise = cornerstone.loadAndCacheImage(newImageId)
        }
        imagePromise.then(doneCallback, failCallback)
      })

    requestPoolManager.startGrabbing()

    triggerEvent(element, EVENTS.STACK_SCROLL, envData)
  }())
}

export default class MyStackScrollTool extends BaseTool {
  constructor(props = {}) {
    const defaultProps = {
      name: 'StackScrollMouseWheel',
      supportedInteractionTypes: ['MouseWheel'],
      configuration: {
        loop: false,
        allowSkipping: true,
        invert: false,
      },
    }

    super(props, defaultProps)
  }

  mouseWheelCallback(evt: any) {
    const { direction: images, element } = evt.detail
    const { loop, invert } = this.configuration
    const direction = invert ? -images : images

    scroll(element, direction, loop)
  }
}
