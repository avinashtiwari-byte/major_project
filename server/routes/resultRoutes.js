const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/my-results', protect, resultController.getMyResults);
router.get('/:id', protect, resultController.getResultById);

// Admin Analytics
router.get('/exam/:examId', protect, adminOnly, resultController.getExamResults);

// Private/Student Comparison
router.get('/exam/:examId/stats', protect, resultController.getExamStats);

module.exports = router;
