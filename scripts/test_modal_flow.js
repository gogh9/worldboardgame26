const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// Check that modal-quiz and modal-card elements exist
const quizModalExists = html.includes('id="modal-quiz"');
const cardModalExists = html.includes('id="modal-card"');
const quizInputFormExists = html.includes('id="quiz-input-form"');
const quizInputAnswerExists = html.includes('id="quiz-input-answer"');
const cardInputFormExists = html.includes('id="card-input-form"');
const cardInputAnswerExists = html.includes('id="card-input-answer"');

console.log('modal-quiz exists:', quizModalExists);
console.log('modal-card exists:', cardModalExists);
console.log('quiz-input-form exists:', quizInputFormExists);
console.log('quiz-input-answer exists:', quizInputAnswerExists);
console.log('card-input-form exists:', cardInputFormExists);
console.log('card-input-answer exists:', cardInputAnswerExists);
