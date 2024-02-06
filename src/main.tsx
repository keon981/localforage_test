import React from 'react'
import ReactDOM from 'react-dom/client'

import NewApp from './NewApp'
// import LocalForageApp from './LocalForageApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* <LocalForageApp /> */}
    <NewApp />
  </React.StrictMode>,
)
