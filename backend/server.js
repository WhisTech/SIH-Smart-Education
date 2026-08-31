const express = require('express')
const cors = require('cors')
require('dotenv').config()

const supabase = require('./db');
const skillGapRouter = require('./routes/skillGap');
const aiAssessmentRouter = require('./routes/aiAssessment');
const recommendationsRouter = require('./routes/recommendations');
const quizRouter = require('./routes/quiz');

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/skill-gap', skillGapRouter);
app.use('/api/ai-assessment', aiAssessmentRouter);
app.use(
  '/api/recommendations',
  recommendationsRouter
);
app.use('/api/quiz', quizRouter);

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