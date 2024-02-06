import React, { useState } from 'react'
import WorkerIDBApp from './pages/WorkerIDBApp'

function NewApp() {
  const [changeDom, setChangeDom] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setChangeDom(!changeDom)
        }}
      > change
      </button>
      {
        changeDom
          ? <WorkerIDBApp />
          : <div>WorkerIDBApp</div>
      }
    </>
  )
}

export default NewApp
