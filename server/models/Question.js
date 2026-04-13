const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true }, // Should match one of the options exactly
  marks: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
