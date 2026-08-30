const express = require('express');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const { generateQuizFromText } = require('../services/aiService');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});

router.post('/generate', upload.single('file'), async (req, res) => {
  let parser;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required'
      });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Only PDF files are supported'
      });
    }

    // pdf-parse v2.x
    parser = new PDFParse({
      data: req.file.buffer
    });

    const pdfData = await parser.getText();

    const text = pdfData.text?.trim();

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from the PDF'
      });
    }

    const quiz = await generateQuizFromText({
      text,
      fileName: req.file.originalname
    });

    res.json({
      success: true,
      fileName: req.file.originalname,
      pageCount: pdfData.total,
      quiz
    });

  } catch (error) {
    console.error('Quiz generation error:', error);

    res.status(500).json({
      success: false,
      message: 'Quiz generation failed',
      error: error.message
    });
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
});

module.exports = router;