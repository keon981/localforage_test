import { useState } from 'react'
import './App.css'
import { Stores, addData, initDB } from './db'

function App() {
  const [isDBReady, setIsDBReady] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleAdd = async (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const target = e.target as typeof e.target & {
      name:{ value:string }
      email:{ value:string }
    }
    const name = target.name.value
    const email = target.email.value
    const id = Date.now()

    if (name.trim() === '' || email.trim() === '') {
      alert('please enter the value')
      return
    }

    try {
      await addData(Stores.Users, { name, email, id })
    } catch (err:unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg('Unknown Error')
      }
    }
  }

  return (
    <>
      <h1>Index DataBase</h1>
      {!isDBReady ? (
        <button
          type="button"
          onClick={async () => {
            await initDB()
            setIsDBReady(true)
          }}
        >Init DB
        </button>
      ) : (
        <>
          <h2>DB is ready</h2>
          <form onSubmit={handleAdd}>
            <input type="text" name="name" id="Name" placeholder="Enter Name" />
            <input type="email" name="email" id="Email" placeholder="Enter Email" />
            <button type="submit">Submit</button>
          </form>
          {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody />
          </table>
        </>
      )}
    </>
  )
}

export default App
