import { useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  async function login() {
    setMessage('Logging in...')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(`Login failed: ${error.message}`)
      return
    }

    setMessage('Login successful!')
  }

  async function saveEmployee() {
    if (!name.trim()) {
      setMessage('Please enter a name')
      return
    }

    // Get the currently logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Please login first')
      return
    }

    // Save the profile with the logged-in user's ID
    const { error } = await supabase
      .from('employee_profiles')
      .insert({
        user_id: user.id,
        name: name.trim(),
      })

    if (error) {
      setMessage(`Save failed: ${error.message}`)
      return
    }

    setMessage('Employee saved successfully!')
    setName('')
  }

  return (
    <div>
      <h1>SIH Smart Education</h1>

      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={login}>
        Login
      </button>

      <hr />

      <h2>Employee Profile Test</h2>

      <input
        type="text"
        placeholder="Employee name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <button onClick={saveEmployee}>
        Save Employee
      </button>

      <p>{message}</p>
    </div>
  )
}

export default App