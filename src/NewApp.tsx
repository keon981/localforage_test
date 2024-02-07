import React, { useState } from 'react'
import WorkerIDBApp from './pages/WorkerIDBApp'

function NewApp() {
  const [changeDom, setChangeDom] = useState(false)
  return (
    <>
      <p>
        <button
          type="button"
          onClick={() => {
            setChangeDom(!changeDom)
          }}
        >
          {
            changeDom ? 'End' : 'Start'
          }
        </button>
      </p>
      {
        changeDom
          ? <WorkerIDBApp />
          : <div>WorkerIDBApp</div>
      }
    </>
  )
}

export default NewApp
