import { useState, useEffect } from "react";
import "@/App.css";
import axios from "axios";
import { ChevronRight, ChevronLeft, BookOpen, Trophy, RotateCcw } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
    const [view, setView] = useState('home'); // home, quiz, results
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await axios.get(`${API}/categories`);
            setCategories(response.data);
        } catch (e) {
            console.error("Error loading categories:", e);
        }
    };

    const startQuiz = async (category) => {
        setLoading(true);
        try {
            const response = await axios.post(`${API}/quiz/start`, { category: category.name });
            setQuestions(response.data);
            setSelectedCategory(category);
            setCurrentQuestionIndex(0);
            setAnswers({});
            setView('quiz');
            setLoading(false);
        } catch (e) {
            console.error("Error starting quiz:", e);
            alert("Error starting quiz. Please try again.");
            setLoading(false);
        }
    };

    const handleAnswerSelect = (answer) => {
        const currentQuestion = questions[currentQuestionIndex];
        setAnswers({
            ...answers,
            [currentQuestion.q_id]: answer
        });
    };

    const goToNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const goToPrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const submitQuiz = async () => {
        if (Object.keys(answers).length < questions.length) {
            alert(`Please answer all questions. You've answered ${Object.keys(answers).length} out of ${questions.length}.`);
            return;
        }

        setLoading(true);
        try {
            const submission = {
                answers: Object.fromEntries(
                    Object.entries(answers).map(([key, value]) => [key.toString(), value])
                ),
                question_ids: questions.map(q => q.q_id)
            };

            const response = await axios.post(`${API}/quiz/submit`, submission);
            setResult(response.data);
            setView('results');
            setLoading(false);
        } catch (e) {
            console.error("Error submitting quiz:", e);
            alert("Error submitting quiz. Please try again.");
            setLoading(false);
        }
    };

    const resetQuiz = () => {
        setView('home');
        setQuestions([]);
        setAnswers({});
        setResult(null);
        setCurrentQuestionIndex(0);
        setSelectedCategory(null);
    };

    // Home View - Category Selection
    if (view === 'home') {
        return (
            <div className="app-container">
                <div className="hero-section">
                    <BookOpen className="hero-icon" size={64} />
                    <h1 className="hero-title">Programming Quiz Platform</h1>
                    <p className="hero-subtitle">Test your knowledge across multiple programming languages and concepts</p>
                </div>

                <div className="categories-grid">
                    {categories.map((category, index) => (
                        <div
                            key={category.name}
                            className="category-card"
                            onClick={() => startQuiz(category)}
                            data-testid={`category-${category.name.toLowerCase()}`}
                        >
                            <h3 className="category-title">{category.display_name}</h3>
                            <p className="category-info">{category.question_count} questions available</p>
                            <div className="category-arrow">
                                <ChevronRight size={24} />
                            </div>
                        </div>
                    ))}
                </div>

                {loading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <p>Loading quiz...</p>
                    </div>
                )}
            </div>
        );
    }

    // Quiz View - One Question Per Page
    if (view === 'quiz' && questions.length > 0) {
        const currentQuestion = questions[currentQuestionIndex];
        const isAnswered = answers[currentQuestion.q_id] !== undefined;
        const isLastQuestion = currentQuestionIndex === questions.length - 1;
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

        return (
            <div className="app-container">
                <div className="quiz-header">
                    <div className="quiz-header-top">
                        <h2 className="quiz-category-title">{selectedCategory.display_name} Quiz</h2>
                        <button className="exit-button" onClick={resetQuiz} data-testid="exit-quiz-button">Exit Quiz</button>
                    </div>
                    <div className="progress-container">
                        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="question-counter">Question {currentQuestionIndex + 1} of {questions.length}</p>
                </div>

                <div className="question-container" data-testid={`question-${currentQuestion.q_id}`}>
                    <h3 className="question-text">{currentQuestion.question_text}</h3>

                    <div className="options-container">
                        {['A', 'B', 'C', 'D'].map((option) => (
                            <div
                                key={option}
                                className={`option-card ${answers[currentQuestion.q_id] === option ? 'selected' : ''
                                    }`}
                                onClick={() => handleAnswerSelect(option)}
                                data-testid={`question-${currentQuestion.q_id}-option-${option.toLowerCase()}`}
                            >
                                <div className="option-radio">
                                    {answers[currentQuestion.q_id] === option && <div className="option-radio-inner"></div>}
                                </div>
                                <div className="option-content">
                                    <span className="option-label">{option}</span>
                                    <span className="option-text">{currentQuestion[`option_${option.toLowerCase()}`]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="navigation-buttons">
                    <button
                        className="nav-button prev-button"
                        onClick={goToPrevious}
                        disabled={currentQuestionIndex === 0}
                        data-testid="previous-button"
                    >
                        <ChevronLeft size={20} />
                        Previous
                    </button>

                    {isLastQuestion ? (
                        <button
                            className="nav-button submit-button-quiz"
                            onClick={submitQuiz}
                            disabled={!isAnswered}
                            data-testid="submit-quiz-button"
                        >
                            Submit Quiz
                            <Trophy size={20} />
                        </button>
                    ) : (
                        <button
                            className="nav-button next-button"
                            onClick={goToNext}
                            disabled={!isAnswered}
                            data-testid="next-button"
                        >
                            Next
                            <ChevronRight size={20} />
                        </button>
                    )}
                </div>

                {loading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <p>Submitting your answers...</p>
                    </div>
                )}
            </div>
        );
    }

    // Results View
    if (view === 'results' && result) {
        const percentage = Math.round((result.score / result.total) * 100);
        const isPassed = percentage >= 70;

        return (
            <div className="app-container">
                <div className="results-container">
                    <Trophy className={`trophy-icon ${isPassed ? 'passed' : 'failed'}`} size={80} />
                    <h1 className="results-title">Quiz Complete!</h1>

                    <div className="score-card">
                        <h2 className="score-text" data-testid="final-score">
                            {result.score} / {result.total}
                        </h2>
                        <p className="percentage-text">{percentage}% Correct</p>
                        <p className={`result-status ${isPassed ? 'passed' : 'failed'}`}>
                            {isPassed ? 'Excellent Work! 🎉' : 'Keep Learning! 📚'}
                        </p>
                    </div>

                    <div className="detailed-results">
                        <h3 className="detailed-title">Detailed Results</h3>
                        {result.details.map((detail, index) => (
                            <div
                                key={index}
                                className={`result-item ${detail.is_correct === 'True' ? 'correct' : 'incorrect'}`}
                                data-testid={`result-item-${index + 1}`}
                            >
                                <div className="result-header">
                                    <span className="result-number">Q{index + 1}</span>
                                    <span className={`result-badge ${detail.is_correct === 'True' ? 'correct-badge' : 'incorrect-badge'}`}>
                                        {detail.is_correct === 'True' ? '✓ Correct' : '✗ Incorrect'}
                                    </span>
                                </div>
                                <p className="result-question">{detail.question_text}</p>
                                <div className="result-answers">
                                    <p className="user-answer">
                                        <strong>Your Answer:</strong> {detail.user_answer || 'Not answered'}
                                    </p>
                                    {detail.is_correct === 'False' && (
                                        <p className="correct-answer">
                                            <strong>Correct Answer:</strong> {detail.correct_answer}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="retry-button" onClick={resetQuiz} data-testid="take-another-quiz-button">
                        <RotateCcw size={20} />
                        Take Another Quiz
                    </button>
                </div>
            </div>
        );
    }

    return null;
}

export default App;