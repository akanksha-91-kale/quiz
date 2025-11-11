// script.js - THE STANDALONE QUIZ ENGINE (Data is now loaded directly in the browser!)

// 1. Data Source URL
// Since the backend is down, we load data from the JSON file in the same GitHub Pages folder.
const DATA_URL = 'quiz_data.json';

// --- Global State Variables ---
let ALL_QUESTIONS_DATA = {};  // Stores all questions grouped by category (Loaded from JSON)
let currentQuiz = [];         // Questions for the current quiz
let currentQuestionIndex = 0; // Tracks quiz progress
let userAnswers = {};         // Stores user's selections {q_id: answer_key}
let questionIDs = [];         // List of IDs for submission

// --- DOM Elements ---
const categorySelection = document.getElementById('category-selection');
const categoryList = document.getElementById('category-list');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const nextButton = document.getElementById('next-button');

// --- Initialization & Event Listeners ---

document.addEventListener('DOMContentLoaded', loadCategories);
nextButton.addEventListener('click', handleNext);

// =========================================================
// == 2. NEW DATA HANDLING & QUIZ LOGIC (Replaces Backend API)
// =========================================================

/**
 * Loads the quiz data from the local JSON file and populates the category list.
 */
async function loadCategories() {
    try {
        const response = await fetch(DATA_URL);
        // Error check: Did we even find the JSON file?
        if (!response.ok) throw new Error('Failed to load local data file.');

        const rawData = await response.json();

        // Group all questions by their category for easy selection
        const categories = {};
        rawData.forEach(q => {
            // FIX: Changed 'q.category' to 'q.Category' to match your JSON file's case.
            const categoryName = q.Category;
            if (!categories[categoryName]) {
                categories[categoryName] = [];
            }
            categories[categoryName].push(q);
        });
        ALL_QUESTIONS_DATA = categories; // Cache the data globally

        // Dynamically create the category cards
        categoryList.innerHTML = '';
        Object.keys(ALL_QUESTIONS_DATA).forEach(catName => {
            const catDisplay = catName || "Uncategorized";
            const count = ALL_QUESTIONS_DATA[catName].length;

            const card = document.createElement('div');
            card.className = 'category-card';
            card.innerHTML = `
                <h3>${catDisplay}</h3>
                <p>${count} Questions</p>
            `;
            // When clicked, start the quiz using the category name
            card.onclick = () => startQuiz(catName);
            categoryList.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading categories:', error);
        // User-friendly message to check for the JSON file
        categoryList.innerHTML = `<p style="color: red;">Failed to load quiz data. Ensure quiz_data.json is present!</p>`;
    }
}

/**
 * Selects 10 random questions for the given category and starts the UI flow.
 */
function startQuiz(categoryName, count = 10) {
    const categoryQuestions = ALL_QUESTIONS_DATA[categoryName];

    if (!categoryQuestions || categoryQuestions.length === 0) {
        alert('Category not found or no questions available.');
        return;
    }

    // 1. Pick random questions (This logic used to be in server.py)
    const shuffled = categoryQuestions.sort(() => 0.5 - Math.random());
    currentQuiz = shuffled.slice(0, count);

    questionIDs = currentQuiz.map(q => q.Q_ID); // Assuming Q_ID is the key

    // 2. Prepare UI
    currentQuestionIndex = 0;
    userAnswers = {};

    document.getElementById('quiz-category-title').textContent = categoryName;
    categorySelection.classList.add('hidden');
    quizContainer.classList.remove('hidden');

    showQuestion(currentQuestionIndex);
}

/**
 * Calculates the final score and displays the results. (This logic used to be in server.py)
 */
function submitQuiz() {
    let score = 0;
    const details = [];

    currentQuiz.forEach(question => {
        // Use the q_id as a string for safety when looking up answers
        const q_id = question.Q_ID.toString(); // Using Q_ID to match JSON structure
        const userAnswer = userAnswers[q_id] || '';
        // CRITICAL: Checks user answer against the correct_key stored in the JSON data
        const isCorrect = userAnswer === question.Correct_Key; // Using Correct_Key to match JSON structure

        if (isCorrect) {
            score += 1;
        }

        details.push({
            q_id: q_id,
            question_text: question.Question_Text, // Using Question_Text to match JSON structure
            user_answer: userAnswer,
            correct_answer: question.Correct_Key,
            is_correct: isCorrect ? 'True' : 'False' // Match original API output format
        });
    });

    const result = { score: score, total: currentQuiz.length, details: details };
    displayResults(result);
}


// =========================================================
// == 3. EXISTING UTILITY FUNCTIONS (Your Original UI Logic)
// =========================================================

// --- Navigation ---

function returnHome() {
    // 1. Hide the quiz and result screens
    quizContainer.classList.add('hidden');
    resultContainer.classList.add('hidden');

    // 2. Show the category selection screen
    categorySelection.classList.remove('hidden');

    // 3. Reset all state variables
    currentQuiz = [];
    currentQuestionIndex = 0;
    userAnswers = {};
    questionIDs = [];
    nextButton.disabled = true;
    nextButton.textContent = "Next Question"; // Reset button text
}


// --- Quiz Flow Functions ---

function showQuestion(index) {
    if (index >= currentQuiz.length) return;

    const question = currentQuiz[index];
    const optionsContainer = document.getElementById('options-container');

    // Using Question_Text to match JSON structure
    document.getElementById('question-text').textContent = `${index + 1}. ${question.Question_Text}`;
    document.getElementById('quiz-status').textContent = `Question ${index + 1} of ${currentQuiz.length}`;

    optionsContainer.innerHTML = '';

    // Update Next/Submit button text
    nextButton.textContent = (index === currentQuiz.length - 1) ? "Submit Quiz" : "Next Question";
    nextButton.disabled = !userAnswers[question.Q_ID]; // Using Q_ID

    const options = [
        // Using correct key cases for options based on JSON structure
        { key: 'A', text: question.Option_A },
        { key: 'B', text: question.Option_B },
        { key: 'C', text: question.Option_C },
        { key: 'D', text: question.Option_D },
    ];

    options.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = `${option.key}: ${option.text}`;
        btn.setAttribute('data-key', option.key);

        // Restore selection visual
        if (userAnswers[question.Q_ID] === option.key) {
            btn.classList.add('selected');
        }

        btn.onclick = () => selectOption(question.Q_ID, option.key, optionsContainer);
        optionsContainer.appendChild(btn);
    });
}

function selectOption(q_id, selectedKey, optionsContainer) {
    // Save the answer
    userAnswers[q_id] = selectedKey;

    // Update button visuals
    Array.from(optionsContainer.children).forEach(btn => {
        btn.classList.remove('selected');
        if (btn.getAttribute('data-key') === selectedKey) {
            btn.classList.add('selected');
        }
    });

    // Enable the Next/Submit button
    nextButton.disabled = false;
}

function handleNext() {
    if (currentQuestionIndex < currentQuiz.length - 1) {
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
    } else {
        // We are on the last question: submit the quiz
        submitQuiz();
    }
}

function displayResults(result) {
    // Hide quiz and show results
    quizContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');

    document.getElementById('score-summary').innerHTML = `
        You scored <strong>${result.score} out of ${result.total}</strong>!
    `;

    const detailsContainer = document.getElementById('result-details');
    detailsContainer.innerHTML = '';

    result.details.forEach(detail => {
        const item = document.createElement('div');
        const isCorrect = detail.is_correct === 'True';
        item.className = `result-item ${isCorrect ? 'correct' : 'incorrect'}`;
        item.innerHTML = `
            <p><strong>Question ${detail.q_id}:</strong> ${detail.question_text}</p>
            <p><strong>Your Answer:</strong> ${detail.user_answer || 'No answer'}</p>
            <p><strong>Correct Answer:</strong> ${detail.correct_answer}</p>
        `;
        detailsContainer.appendChild(item);
    });
}