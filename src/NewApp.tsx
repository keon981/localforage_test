/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react'
// import WorkerIDBApp from './pages/WorkerIDBApp'
import CustomToolsApp from './pages/CustomToolsApp'

function NewApp() {
  const [changeDom, setChangeDom] = useState(false)
  // const [isWorkerIDBApp, setIsWorkerIDBApp] = useState(false)

  const app = <CustomToolsApp />

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
          ? app
          : <div>無頁面</div>
      }
    </>
  )
}

export default NewApp
