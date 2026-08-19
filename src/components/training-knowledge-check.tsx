"use client";

import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";
import type { TrainingQuestion } from "@/lib/training/generated";

type AnswerMap = Record<string, string>;

export function TrainingKnowledgeCheck({ questions, reviewer = false }: { questions: TrainingQuestion[]; reviewer?: boolean }) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  const answeredCount = questions.filter((question) => Boolean(answers[question.id])).length;
  const score = questions.reduce((total, question) => total + (answers[question.id] === question.correctAnswer ? 1 : 0), 0);

  function chooseAnswer(questionId: string, answer: string) {
    if (submitted) return;
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  }

  function retry() {
    setAnswers({});
    setSubmitted(false);
  }

  return <div className="training-quiz">
    <p className="training-quiz-instructions">Choose one answer for every question, then submit your knowledge check.</p>
    {questions.map((question, index) => {
      const selectedAnswer = answers[question.id];
      const correct = selectedAnswer === question.correctAnswer;
      return <fieldset className={`training-quiz-question${submitted ? correct ? " correct" : " incorrect" : ""}`} key={question.id}>
        <legend>{index + 1}. {question.question}</legend>
        <div className="training-quiz-options">
          {question.options.map((option, optionIndex) => {
            const optionId = `training-question-${index}-${optionIndex}`;
            return <label className="training-quiz-option" htmlFor={optionId} key={optionId}>
              <input checked={selectedAnswer === option} disabled={submitted} id={optionId} name={`training-question-${index}`} onChange={() => chooseAnswer(question.id, option)} type="radio" value={option}/>
              <span>{option}</span>
            </label>;
          })}
        </div>
        {submitted && <div className={`training-quiz-feedback ${correct ? "correct" : "incorrect"}`} role="status">
          <strong>{correct ? <><CheckCircle2 size={17}/> Correct</> : <><XCircle size={17}/> Review this answer</>}</strong>
          {!correct && <p><strong>Correct answer:</strong> {question.correctAnswer}</p>}
          <p>{question.explanation}</p>
          {reviewer && <small><strong>Source evidence:</strong> {question.sourceEvidence}</small>}
        </div>}
      </fieldset>;
    })}
    <div className="training-quiz-actions">
      {submitted ? <>
        <div className="training-quiz-score" role="status"><strong>Your score: {score} of {questions.length}</strong><span>{score === questions.length ? "Great work — every answer is correct." : "Review the explanations below, then try again."}</span></div>
        <button className="btn btn-secondary" onClick={retry} type="button"><RotateCcw size={15}/> Try again</button>
      </> : <>
        <span>{answeredCount} of {questions.length} answered</span>
        <button className="btn btn-primary" disabled={answeredCount !== questions.length} onClick={() => setSubmitted(true)} type="button">Submit knowledge check</button>
      </>}
    </div>
  </div>;
}
