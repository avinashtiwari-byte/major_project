const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');
const pdfParse = require('pdf-parse');

// ─── Robust local PDF question parser (no API needed) ───

/**
 * Parses MCQ questions from raw PDF text using multiple regex strategies.
 * Handles many common PDF question formats including:
 *   - Numbered questions: "1.", "1)", "Q1.", "Q1)", "Q.1", "Question 1"
 *   - Options: "A)", "A.", "(A)", "a)", "a.", "(a)", "A-", "A:"
 *   - Inline options on one line or each on separate lines
 *   - Answer lines: "Answer: C", "Ans: C", "Correct Answer: C", "Answer: Paris" (full text)
 *   - Answer key section at the end of the PDF
 */
function parseQuestionsFromText(rawText) {
  // Normalize text
  let text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ');

  // Log the entire raw text for debugging
  console.log(`[PDF Parser] ===== RAW PDF TEXT START =====`);
  console.log(text);
  console.log(`[PDF Parser] ===== RAW PDF TEXT END =====`);

  // ── Step 1: Extract answer key if present ──
  const answerKey = {};
  const answerKeyMatch = text.match(/answer\s*key[:\s]*\n?([\s\S]*?)$/i);
  if (answerKeyMatch) {
    const keyText = answerKeyMatch[1];
    const keyEntries = keyText.matchAll(/(\d+)\s*[.):\-–]\s*\(?([A-Da-d])\)?/g);
    for (const m of keyEntries) {
      answerKey[parseInt(m[1])] = m[2].toUpperCase();
    }
    // Remove answer key section from the main text to avoid confusion
    text = text.substring(0, text.indexOf(answerKeyMatch[0]));
    console.log(`[PDF Parser] Found answer key with ${Object.keys(answerKey).length} entries`);
  }

  // ── Step 2: Split text into question blocks ──
  // A question block starts with a number at the beginning of a line
  // We use a split regex that captures the question number
  // This splits on: newline + number + . or ) 
  // OR: start of text + number + . or )
  
  const questions = [];
  
  // Find all question start positions using global regex
  // Match: start-of-line, optional whitespace, digits, then . or ) or :
  const questionStartRegex = /(?:^|\n)\s*(\d+)\s*[.):](?:\s)/g;
  const matches = [];
  let match;
  
  while ((match = questionStartRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      num: parseInt(match[1]),
      fullMatch: match[0]
    });
  }
  
  // Also try Q1. or Question 1 format
  const qPrefixRegex = /(?:^|\n)\s*(?:Q\.?\s*(\d+)|Question\s+(\d+))\s*[.):]?\s/gi;
  while ((match = qPrefixRegex.exec(text)) !== null) {
    const num = parseInt(match[1] || match[2]);
    // Only add if not already found at this position
    if (!matches.some(m => Math.abs(m.index - match.index) < 5)) {
      matches.push({
        index: match.index,
        num: num,
        fullMatch: match[0]
      });
    }
  }
  
  // Sort by position in text
  matches.sort((a, b) => a.index - b.index);
  
  console.log(`[PDF Parser] Found ${matches.length} potential question starts`);
  
  if (matches.length === 0) {
    console.log(`[PDF Parser] No questions found in PDF text.`);
    return [];
  }
  
  // Extract each question block (text between two consecutive question starts)
  for (let i = 0; i < matches.length; i++) {
    const blockStart = matches[i].index;
    const blockEnd = (i + 1 < matches.length) ? matches[i + 1].index : text.length;
    let block = text.substring(blockStart, blockEnd).trim();
    const qNum = matches[i].num;
    
    console.log(`[PDF Parser] Processing block for Q${qNum}: "${block.substring(0, 60).replace(/\n/g, '\\n')}..."`);
    
    // Remove the question number prefix from the block to get the question text + options
    // e.g., "1. What is the capital?" -> "What is the capital?"
    block = block.replace(/^\s*\d+\s*[.):]?\s*/, '');
    block = block.replace(/^\s*(?:Q\.?\s*\d+|Question\s+\d+)\s*[.):]?\s*/i, '');
    
    // ── Find options within this block ──
    // Strategy: look for A/B/C/D option markers
    const optionData = {};
    let questionText = '';
    let inlineAnswer = null;
    
    // Try multi-line options first: each option on its own line
    // Pattern: line starting with A) or A. or (A) etc.
    const optLineRegex = /(?:^|\n)\s*\(?([A-Da-d])\)?\s*[.):\-–]\s*(.+)/g;
    const optMatches = [...block.matchAll(optLineRegex)];
    
    if (optMatches.length >= 2) {
      // Question text = everything before the first option
      const firstOptIdx = block.indexOf(optMatches[0][0]);
      questionText = block.substring(0, firstOptIdx).trim();
      
      for (const om of optMatches) {
        optionData[om[1].toUpperCase()] = om[2].trim()
          // clean trailing options or answer text from the value
          .replace(/\s*\(?[A-Da-d]\)?\s*[.):\-–].*$/, '')
          .trim();
      }
      
      // Look for inline answer after options
      const afterOptions = block.substring(block.lastIndexOf(optMatches[optMatches.length - 1][0]) + optMatches[optMatches.length - 1][0].length);
      const ansMatch = afterOptions.match(/(?:answer|ans|correct\s*answer?)\s*[.:)\-–]\s*\(?([A-Da-d])\)?/i);
      if (ansMatch) {
        inlineAnswer = ansMatch[1].toUpperCase();
      }
    }
    
    // If no multi-line options found, try inline options on a single line
    if (Object.keys(optionData).length < 2) {
      // Try to find a line with multiple options inline
      const lines = block.split('\n');
      for (const line of lines) {
        const inlineOpts = [...line.matchAll(/\(?([A-Da-d])\)?\s*[.):\-–]\s*([^A-Da-d\n(]+?)(?=\s*\(?[A-Da-d]\)?\s*[.):\-–]|$)/g)];
        if (inlineOpts.length >= 2) {
          // Everything before this line in the block is the question text
          const lineIdx = block.indexOf(line);
          questionText = block.substring(0, lineIdx).trim();
          
          for (const om of inlineOpts) {
            optionData[om[1].toUpperCase()] = om[2].trim();
          }
          break;
        }
      }
    }
    
    // Clean up question text (remove trailing newlines, extra spaces)
    questionText = questionText.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
    
    if (!questionText || Object.keys(optionData).length < 2) {
      console.log(`[PDF Parser] Skipping Q${qNum}: questionText="${questionText}", options=${Object.keys(optionData).length}`);
      continue;
    }
    
    // Build the question object
    const optKeys = Object.keys(optionData).sort();
    const optionsArray = optKeys.map(k => optionData[k]);
    
    // Determine correct answer
    let correctAnswer = null;
    const ansLetter = inlineAnswer || answerKey[qNum];
    if (ansLetter && optionData[ansLetter]) {
      correctAnswer = optionData[ansLetter];
    }
    
    questions.push({
      text: questionText,
      options: optionsArray,
      correctAnswer: correctAnswer || optionsArray[0],
      marks: 1
    });
    
    console.log(`[PDF Parser] ✅ Saved Q${qNum}: "${questionText.substring(0, 50)}..." with ${optionsArray.length} options`);
  }
  
  console.log(`[PDF Parser] Total extracted: ${questions.length} questions`);
  return questions;
}


exports.createExam = async (req, res) => {
  try {
    const { title, description, durationMinutes, availableFrom, availableUntil } = req.body;
    const exam = new Exam({
      title, description, durationMinutes, availableFrom, availableUntil, createdBy: req.user.id
    });
    await exam.save();
    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Error creating exam' });
  }
};

exports.addQuestion = async (req, res) => {
  try {
    const { text, options, correctAnswer, marks } = req.body;
    const examId = req.params.id;
    const question = new Question({
      examId, text, options, correctAnswer, marks
    });
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Error adding question' });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { text, options, correctAnswer, marks } = req.body;
    const question = await Question.findOneAndUpdate(
      { _id: req.params.qId, examId: req.params.id },
      { text, options, correctAnswer, marks },
      { new: true }
    );
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating question' });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findOneAndDelete({ _id: req.params.qId, examId: req.params.id });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question Deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting question' });
  }
};

exports.toggleExamStatus = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    
    exam.isActive = !exam.isActive;
    await exam.save();
    
    res.json({ message: 'Status updated', isActive: exam.isActive });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error toggling exam status' });
  }
};

exports.getAllExams = async (req, res) => {
  try {
    // Admins see all exams, Students see only active exams
    let query = {};
    if (req.user.role === 'student') {
       query.isActive = true;
       // For student listing, we might show upcoming ones, but filter strictly if we want.
       // Here we'll return all active ones, but the frontend will handle disabling entry.
    }

    // Use .lean() to allow injecting custom properties like attemptCount
    const exams = await Exam.find(query).populate('createdBy', 'name').lean();
    
    // Attach student attempt counts
    for (let exam of exams) {
       exam.attemptCount = await Result.countDocuments({ examId: exam._id });
    }

    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exams' });
  }
};

exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    // Time span check for students
    if (req.user.role === 'student') {
      const now = new Date();
      if (exam.availableFrom && now < new Date(exam.availableFrom)) {
        return res.status(403).json({ message: `Access denied. Assessment starts at ${new Date(exam.availableFrom).toLocaleString()}` });
      }
      if (exam.availableUntil && now > new Date(exam.availableUntil)) {
        return res.status(403).json({ message: `Access denied. Assessment concluded at ${new Date(exam.availableUntil).toLocaleString()}` });
      }
    }

    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exam' });
  }
};

exports.getExamQuestions = async (req, res) => {
  try {
    let query = { examId: req.params.id };
    let projection = req.user.role === 'student' ? '-correctAnswer' : '';
    const questions = await Question.find(query).select(projection);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions' });
  }
};

// AUTO-EVALUATION LOGIC
exports.submitExam = async (req, res) => {
  try {
    const { answers, snapshots, tabSwitches } = req.body; // answers: [{ questionId, selectedOption }]
    const examId = req.params.id;
    const userId = req.user.id;

    // Fetch all questions for this exam
    const questions = await Question.find({ examId });
    
    let score = 0;
    let totalMarks = 0;
    const evaluatedAnswers = [];

    for (let q of questions) {
      totalMarks += q.marks || 0;
      
      // Ensure we compare strings properly
      const studentAnswer = (answers || []).find(a => 
        a.questionId && a.questionId.toString() === q._id.toString()
      );
      
      let isCorrect = false;
      if (studentAnswer && studentAnswer.selectedOption && q.correctAnswer) {
        if (studentAnswer.selectedOption.toString().trim() === q.correctAnswer.toString().trim()) {
          isCorrect = true;
          score += q.marks || 0;
        }
      }

      evaluatedAnswers.push({
        questionId: q._id,
        selectedOption: studentAnswer ? studentAnswer.selectedOption : null,
        isCorrect
      });
    }

    const result = new Result({
      userId,
      examId,
      score,
      totalMarks,
      answers: evaluatedAnswers,
      snapshots: snapshots || [],
      tabSwitches: tabSwitches || 0
    });

    await result.save();

    res.status(201).json({ 
      success: true,
      message: 'Exam submitted successfully', 
      score, 
      totalMarks, 
      resultId: result._id 
    });
  } catch (error) {
    console.error('Submission Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error submitting exam: ' + (error.message || 'Internal server error')
    });
  }
};

exports.uploadPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.trim().length < 10) {
      return res.status(400).json({ message: 'The PDF appears to be empty or contains no readable text.' });
    }

    // Parse questions using simple text pattern matching (no API needed)
    const parsedQuestions = parseQuestionsFromText(rawText);

    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return res.status(400).json({ 
        message: 'Could not extract any questions from the PDF. Please ensure it follows a standard MCQ format:\n\n' +
                 '1. Question text?\n' +
                 'A) Option 1  B) Option 2  C) Option 3  D) Option 4\n' +
                 'Answer: A\n\n' +
                 'Or include an Answer Key section at the end.'
      });
    }

    // Save to database
    const examId = req.params.id;
    const savedQuestions = [];
    for (const q of parsedQuestions) {
      if (!q.text || !Array.isArray(q.options) || q.options.length < 2) continue;

      const question = new Question({
        examId, 
        text: q.text, 
        options: q.options, 
        correctAnswer: q.correctAnswer, 
        marks: q.marks || 1
      });
      await question.save();
      savedQuestions.push(question);
    }

    res.status(201).json({ 
      message: `Successfully imported ${savedQuestions.length} questions from PDF!`,
      count: savedQuestions.length 
    });

  } catch (error) {
    console.error("PDF Processing Error:", error);
    res.status(500).json({ message: error.message || 'Error processing PDF file.' });
  }
};
