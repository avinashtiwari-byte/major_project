const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');
const pdfParse = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: { responseMimeType: "application/json" }
});

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
      totalMarks += q.marks;
      const studentAnswer = answers.find(a => a.questionId === q._id.toString());
      
      let isCorrect = false;
      if (studentAnswer && studentAnswer.selectedOption === q.correctAnswer) {
        isCorrect = true;
        score += q.marks;
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

    res.status(201).json({ message: 'Exam submitted successfully', score, totalMarks, resultId: result._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting exam' });
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

    const prompt = `
      Analyze the following text extracted from an MCQ exam PDF. 
      Extract all questions and return them as a valid JSON array of objects.
      Each object MUST have exactly these fields:
      - "text": The question string.
      - "options": An array of exactly 4 strings.
      - "correctAnswer": The string representing the correct option (must be one of the strings in the "options" array).
      - "marks": A number representing the marks/points for this question (default to 1 if not specified).

      If you find questions with fewer or more than 4 options, adapt them to 4 options if possible, or ignore them if they are not multiple choice.
      
      Text Content:
      ${rawText}

      Return ONLY a pure JSON array. No markdown, no triple backticks.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up response if it contains markdown code blocks
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(text);
    } catch (e) {
      console.error("AI Response was not valid JSON:", text);
      return res.status(500).json({ message: 'AI failed to generate a valid question format. Please try again or check your PDF layout.' });
    }

    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return res.status(400).json({ message: 'Could not extract any valid questions from the PDF. Please ensure it follows a standard MCQ format.' });
    }

    // Save to database
    const examId = req.params.id;
    const savedQuestions = [];
    for (const q of parsedQuestions) {
      // Basic validation of AI output
      if (!q.text || !Array.isArray(q.options) || q.options.length < 2 || !q.correctAnswer) continue;

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
      message: `Successfully imported ${savedQuestions.length} questions via AI!`,
      count: savedQuestions.length 
    });

  } catch (error) {
    console.error("PDF AI Processing Error:", error);
    res.status(500).json({ message: error.message || 'Error processing PDF file with AI.' });
  }
};
