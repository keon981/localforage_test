import React, { useState } from 'react'
import type { remoteFunction } from 'src/utils/worker/add.worker'
import { proxy, wrap } from 'comlink'
// eslint-disable-next-line import/default
import AddWorker from '../utils/worker/add.worker?worker'

function WebWokerPage() {
  const [num, setNum] = useState<number>(0)
  // const [newWorkerScript] = useWorker(workerScript, {
  //   timeout: 50000,
  // })

  const callback = async (value: string | number) => {
    alert(`Result: ${value}`)
  }

  const init = async () => {
    const alertFn = wrap<typeof remoteFunction>(new AddWorker())
    await alertFn(proxy(callback))
  }

  const runWorker = async () => {
    init()
    // const add = wrap<typeof workerScript>(new AddWorker())
    // const newNum = await add(num, true)
    // setNum(newNum)
  }

  return (
    <div style={{ width: '100vw', textAlign: 'center' }}>
      <button type="button" onClick={runWorker} style={{ background: '#99f' }}>add 1</button>
      <h1>{num}</h1>
    </div>
  )
}

export default WebWokerPage
