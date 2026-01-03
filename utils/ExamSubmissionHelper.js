const getAnswerStatus = ({ questionType, correctAnswers, studentAnswer }) => {
  if (
    !studentAnswer ||
    (Array.isArray(studentAnswer) && studentAnswer.length === 0)
  ) {
    return "Skipped";
  }

  const normalize = (str) => str.toLowerCase().trim();
  const normalizeNoSpace = (str) => str.toLowerCase().replace(/\s+/g, "");

  switch (questionType) {
    case "MCQ": {
      const isCorrect = correctAnswers
        .map(normalize)
        .includes(normalize(studentAnswer));

      return isCorrect ? "Correct" : "Incorrect";
    }

    case "Fill in the Blanks": {
      const isCorrect = correctAnswers.some(
        (ans) => normalizeNoSpace(ans) === normalizeNoSpace(studentAnswer)
      );

      return isCorrect ? "Correct" : "Incorrect";
    }

    case "MSQ": {
      const correctSet = new Set(correctAnswers.map(normalize));
      const studentSet = new Set(studentAnswer.map(normalize));

      const correctCount = [...studentSet].filter((a) =>
        correctSet.has(a)
      ).length;

      const hasWrong = [...studentSet].some((a) => !correctSet.has(a));

      if (correctCount === 0 || hasWrong) return "Incorrect";
      if (correctCount === correctSet.size) return "Correct";

      return "Partially Correct";
    }

    case "Short Answer": {
      const matchCount = correctAnswers.filter((word) =>
        studentAnswer.toLowerCase().includes(word.toLowerCase())
      ).length;

      if (matchCount === 0) return "Incorrect";
      if (matchCount === correctAnswers.length) return "Correct";

      return "Partially Correct";
    }

    default:
      return "Skipped";
  }
};

const evaluateQuestion = (question, studQuestion) => {
  const status = studQuestion.isAnswered
    ? getAnswerStatus({
        questionType: question.questionType,
        correctAnswers: question.correctAnswers,
        studentAnswer: studQuestion.studentAnswer,
      })
    : "Skipped";

  return {
    ...studQuestion,
    isRight: status,
    correctAnswer: question.correctAnswers,
  };
};

const calculateMarks = (
  question,
  studQuestion,
  positiveMark,
  negativeMark
) => {
  const { questionType, correctAnswers } = question;
  const studentAnswer = studQuestion.studentAnswer;

  if (
    !studentAnswer ||
    (Array.isArray(studentAnswer) && studentAnswer.length === 0)
  ) {
    return 0;
  }

  const normalize = (str) => str.toLowerCase().trim();

  switch (questionType) {
    case "MCQ": {
      const isCorrect = correctAnswers
        .map(normalize)
        .includes(normalize(studentAnswer));
      return isCorrect ? positiveMark : -negativeMark;
    }

    case "Fill in the Blanks": {
      const normalizeNoSpace = (str) => str.toLowerCase().replace(/\s+/g, "");

      const isCorrect = correctAnswers.some(
        (ans) => normalizeNoSpace(ans) === normalizeNoSpace(studentAnswer)
      );
      return isCorrect ? positiveMark : 0;
    }

    case "MSQ": {
      const correctSet = new Set(correctAnswers.map(normalize));
      const studentSet = new Set(studentAnswer.map(normalize));

      const hasWrong = [...studentSet].some((a) => !correctSet.has(a));
      const correctCount = [...studentSet].filter((a) =>
        correctSet.has(a)
      ).length;

      if (!hasWrong && correctCount > 0) {
        return (correctCount / correctSet.size) * positiveMark;
      }
      return 0;
    }

    case "Short Answer": {
      const matchCount = correctAnswers.filter((word) =>
        studentAnswer.toLowerCase().includes(word.toLowerCase())
      ).length;

      return matchCount > 0
        ? (matchCount / correctAnswers.length) * positiveMark
        : 0;
    }

    default:
      return 0;
  }
};

const getMarksByLevel = (mark, level) => {
  return {
    positive: mark[`level${level}Mark`],
    negative: mark[`level${level}NegativeMark`],
  };
};



module.exports = {
  evaluateQuestion,
  calculateMarks,
  getMarksByLevel,
};

