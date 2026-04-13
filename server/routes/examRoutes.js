const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { protect, adminOnly } = require('../middleware/auth');

// Public or Student routes
router.get('/', protect, examController.getAllExams);
router.get('/:id', protect, examController.getExamById);
router.get('/:id/questions', protect, examController.getExamQuestions);

// Admin routes
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', protect, adminOnly, examController.createExam);
router.put('/:id/toggle', protect, adminOnly, examController.toggleExamStatus);

router.post('/:id/questions', protect, adminOnly, examController.addQuestion);
router.put('/:id/questions/:qId', protect, adminOnly, examController.updateQuestion);
router.delete('/:id/questions/:qId', protect, adminOnly, examController.deleteQuestion);

router.post('/:id/upload-pdf', protect, adminOnly, upload.single('examPdf'), examController.uploadPdf);

// Exam attempting/submission
router.post('/:id/submit', protect, examController.submitExam);

module.exports = router;
