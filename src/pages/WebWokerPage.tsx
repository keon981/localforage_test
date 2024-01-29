import React, { useState } from 'react'
import type { workerScript } from 'src/utils/worker/add.worker'
import { wrap } from 'comlink'
// eslint-disable-next-line import/default
import AddWorker from '../utils/worker/add.worker?worker'

function WebWokerPage() {
  const [num, setNum] = useState<number>(0)
  // const [newWorkerScript] = useWorker(workerScript, {
  //   timeout: 50000,
  // })
  const runWorker = async () => {
    const add = wrap<typeof workerScript>(new AddWorker())
    const newNum = await add(num, true)
    setNum(newNum)
  }

  return (
    <div style={{ width: '100vw', textAlign: 'center' }}>
      <button type="button" onClick={runWorker} style={{ background: '#99f' }}>add 1</button>
      <h1>{num}</h1>
    </div>
  )
}

export default WebWokerPage
