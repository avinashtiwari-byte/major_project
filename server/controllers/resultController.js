const Result = require('../models/Result');

exports.getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user.id }).populate('examId', 'title durationMinutes');
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching results' });
  }
};

exports.getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('examId', 'title')
      .populate('answers.questionId', 'text correctAnswer options marks');
    
    // Only allow admin or the user who took the exam to view
    if (result.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this result' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching result' });
  }
};

// Admin only: Get all results for a specific exam to check for cheating based on snapshots
exports.getExamResults = async (req, res) => {
  try {
    const results = await Result.find({ examId: req.params.examId })
      .populate('userId', 'name email');
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exam results' });
  }
};

// Public/Student: Get global stats for comparison
exports.getExamStats = async (req, res) => {
  try {
    const { examId } = req.params;
    const results = await Result.find({ examId });
    
    if (results.length === 0) {
      return res.json({ averageScore: 0, topScore: 0, totalAttempts: 0 });
    }

    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    const averageScore = Math.round((totalScore / results.length) * 10) / 10;
    const topScore = Math.max(...results.map(r => r.score));
    
    // Total marks usually come from the exam, but we can take from first result
    const totalMarks = results[0].totalMarks;

    res.json({
      averageScore,
      topScore,
      totalAttempts: results.length,
      totalMarks
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comparison stats' });
  }
};
