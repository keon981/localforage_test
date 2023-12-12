import { useState } from 'react'
import './App.css'
import { initDB } from './db'

function App() {
  const [isDBReady, setIsDBReady] = useState(false)

  return (
    <>
      <h1>Index DataBase</h1>
      {isDBReady ? <h2>DB is ready</h2> : (
        <button
          type="button"
          onClick={async () => {
            const status = await initDB()
            setIsDBReady(true)
          }}
        >Init DB
        </button>
      )}
    </>
  )
}

export default App
