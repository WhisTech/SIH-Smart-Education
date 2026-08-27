const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running'
  })
})

app.get('/api/supabase-test', async (req, res) => {
  const { error } = await supabase
    .from('employee_profiles')
    .select('id')
    .limit(1)

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }

  res.json({
    success: true,
    message: 'Backend connected to Supabase'
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})