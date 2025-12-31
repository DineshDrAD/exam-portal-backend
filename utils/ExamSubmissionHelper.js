export const evaluateQuestion = (question, studQuestion) => {
  const { questionType, correctAnswers } = question;
  const studentAnswer = studQuestion.studentAnswer;

  const normalize = (str) => str.toLowerCase().trim();
  const normalizeNoSpace = (str) => str.toLowerCase().replace(/\s+/g, "");

  if (
    !studentAnswer ||
    (Array.isArray(studentAnswer) && studentAnswer.length === 0)
  ) {
    return studQuestion;
  }

  let isRight = false;

  switch (questionType) {
    case "MCQ": {
      isRight = correctAnswers
        .map(normalize)
        .includes(normalize(studentAnswer));
      break;
    }

    case "Fill in the Blanks": {
      isRight = correctAnswers.some(
        (ans) => normalizeNoSpace(ans) === normalizeNoSpace(studentAnswer)
      );
      break;
    }

    case "MSQ": {
      const correctSet = new Set(correctAnswers.map(normalize));
      const studentSet = new Set(studentAnswer.map(normalize));

      const hasWrong = [...studentSet].some((a) => !correctSet.has(a));
      const correctCount = [...studentSet].filter((a) =>
        correctSet.has(a)
      ).length;

      isRight = !hasWrong && correctCount > 0;
      break;
    }

    case "Short Answer": {
      const matchCount = correctAnswers.filter((word) =>
        studentAnswer.toLowerCase().includes(word.toLowerCase())
      ).length;

      isRight = matchCount > 0;
      break;
    }
  }

  return {
    ...studQuestion,
    isRight,
    correctAnswer: question.correctAnswers,
  };
};

export const calculateMarks = (
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

export const getMarksByLevel = (mark, level) => {
  return {
    positive: mark[`level${level}Mark`],
    negative: mark[`level${level}NegativeMark`],
  };
};
