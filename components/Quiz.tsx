
import React, { useState } from 'react';
import { QuizData } from '../types';
import { CheckIcon, XIcon, SparklesIcon, ArrowLeftIcon } from './icons';

interface QuizProps {
  quizData: QuizData;
  onComplete: (score: number) => void;
  onRetry: () => void;
}

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

const Quiz: React.FC<QuizProps> = ({ quizData, onComplete, onRetry }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(quizData.length).fill(-1));
  const [answerStates, setAnswerStates] = useState<AnswerState[]>(Array(quizData.length).fill('unanswered'));
  const [showResults, setShowResults] = useState(false);

  const handleAnswerSelect = (optionIndex: number) => {
    if (answerStates[currentQuestionIndex] !== 'unanswered') return;

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);

    const newAnswerStates = [...answerStates];
    if (optionIndex === quizData[currentQuestionIndex].correctAnswerIndex) {
      newAnswerStates[currentQuestionIndex] = 'correct';
    } else {
      newAnswerStates[currentQuestionIndex] = 'incorrect';
    }
    setAnswerStates(newAnswerStates);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
      // Calculate score based on the current state + the just answered question
      // Note: Since we updated state in handleAnswerSelect, and that triggers a re-render, 
      // by the time handleNext is clicked, answerStates is up to date for the current question.
      const finalScore = answerStates.filter(s => s === 'correct').length;
      onComplete(finalScore);
    }
  };
  
  const score = answerStates.filter(s => s === 'correct').length;
  const passed = score > 0;

  if (showResults) {
    return (
      <div className={`p-8 rounded-xl text-center border-2 ${passed ? 'bg-indigo-50 border-indigo-100' : 'bg-red-50 border-red-100'}`}>
        {passed ? (
            <div className="flex flex-col items-center">
                <div className="bg-success text-white p-3 rounded-full mb-4 shadow-lg">
                     <CheckIcon className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Quiz Complete!</h3>
                <p className="text-lg text-gray-600 mt-2">You scored <span className="font-bold text-indigo-600 text-xl">{score}</span> out of {quizData.length}</p>
                <div className="mt-6 flex space-x-4">
                     <button onClick={onRetry} className="px-6 py-2 border border-indigo-300 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors">
                        Try Again
                    </button>
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center">
                <div className="bg-error text-white p-3 rounded-full mb-4 shadow-lg">
                    <XIcon className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Quiz Failed</h3>
                <p className="text-lg text-gray-600 mt-2">You scored {score} out of {quizData.length}.</p>
                <p className="text-sm text-gray-500 mt-4 max-w-md mx-auto">
                    To complete this topic, you must get at least one answer correct. Please review the article content and generate a new quiz.
                </p>
                <button 
                    onClick={onRetry} 
                    className="mt-6 inline-flex items-center px-6 py-3 bg-white border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-primary transition-all"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Review & Generate New Quiz
                </button>
            </div>
        )}
      </div>
    );
  }

  const currentQuestion = quizData[currentQuestionIndex];
  const currentAnswerState = answerStates[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestionIndex];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gray-500">Question {currentQuestionIndex + 1} of {quizData.length}</p>
        <h3 className="text-xl font-semibold text-gray-900 mt-1">{currentQuestion.question}</h3>
      </div>
      <div className="space-y-3">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = currentQuestion.correctAnswerIndex === index;
          
          let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex justify-between items-center ";
          if (currentAnswerState === 'unanswered') {
            buttonClass += "bg-white border-gray-300 hover:bg-gray-100 hover:border-primary";
          } else {
             if (isSelected && isCorrect) buttonClass += "bg-green-100 border-success text-green-800";
             else if (isSelected && !isCorrect) buttonClass += "bg-red-100 border-error text-red-800";
             else if (isCorrect) buttonClass += "bg-green-100 border-success text-green-800";
             else buttonClass += "bg-white border-gray-300 cursor-not-allowed opacity-60";
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={currentAnswerState !== 'unanswered'}
              className={buttonClass}
            >
              <span>{option}</span>
              {currentAnswerState !== 'unanswered' && isSelected && isCorrect && <CheckIcon className="h-6 w-6 text-success"/>}
              {currentAnswerState !== 'unanswered' && isSelected && !isCorrect && <XIcon className="h-6 w-6 text-error"/>}
              {currentAnswerState !== 'unanswered' && !isSelected && isCorrect && <CheckIcon className="h-6 w-6 text-success"/>}
            </button>
          );
        })}
      </div>
      {currentAnswerState !== 'unanswered' && (
        <div className="text-right">
            <button onClick={handleNext} className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                {currentQuestionIndex < quizData.length - 1 ? 'Next Question' : 'View Results'}
            </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;
