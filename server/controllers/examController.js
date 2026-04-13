const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');
const pdfParse = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');

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

    // Custom Line-based Parser (Tailored to your specific format)
    const parsedQuestions = [];
    
    // Split by question numbers like "1. ", "2. "
    const questionBlocks = rawText.split(/(?:^|\n)\s*\d+\.\s+/g);
    
    for (let block of questionBlocks) {
      block = block.trim();
      if (!block) continue;
      
      // Split block into individual non-empty lines
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      
      // A valid question needs at least 1 question line + 4 option lines
      if (lines.length >= 5) {
        const qText = lines[0]; // Line 1 is the question
        const options = [
          lines[1].replace(/^[a-d][\.\)]\s*/i, ''), // Clean leading 'A)' if it exists
          lines[2].replace(/^[a-d][\.\)]\s*/i, ''), 
          lines[3].replace(/^[a-d][\.\)]\s*/i, ''), 
          lines[4].replace(/^[a-d][\.\)]\s*/i, '')
        ];
        
        let marks = 1;
        let correctAnswer = options[0]; // Default to Option A if no Answer is provided
        
        // Scan the rest of the lines for Marks or Answer
        for (let i = 5; i < lines.length; i++) {
          const lLower = lines[i].toLowerCase();
          
          if (lLower.includes('marks')) {
            const matchMarks = lLower.match(/(\d+)/);
            if (matchMarks) marks = parseInt(matchMarks[1]);
          } 
          else if (lLower.startsWith('answer:') || lLower.startsWith('ans:')) {
            const ansRaw = lines[i].split(':')[1].trim();
            // Try to find matching option
            const foundOpt = options.find(o => 
              o.toLowerCase() === ansRaw.toLowerCase() || 
              o.toLowerCase().startsWith(ansRaw.toLowerCase())
            );
            if (foundOpt) correctAnswer = foundOpt;
          }
        }

        parsedQuestions.push({
          text: qText,
          options,
          correctAnswer,
          marks
        });
      }
    }

    if (parsedQuestions.length === 0) {
      return res.status(400).json({ message: 'Could not extract questions. We need 1 line for the question and the next 4 lines for options.' });
    }

    // Save to database
    const examId = req.params.id;
    const savedQuestions = [];
    for (const q of parsedQuestions) {
      const question = new Question({
        examId, text: q.text, options: q.options, correctAnswer: q.correctAnswer, marks: q.marks || 1
      });
      await question.save();
      savedQuestions.push(question);
    }

    res.status(201).json(savedQuestions);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Error processing PDF file.' });
  }
};
