import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Brain, Play, Clock, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { API_URL } from "@/config/api";

interface Quiz {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: number;
  duration: string;
  category: string;
  icon: React.ReactNode;
}

interface DynamicQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

const QuizzesY = () => {
  const navigate = useNavigate();

  const quizzes: Quiz[] = [
    {
      id: "1",
      title: "Spiritual Knowledge Quiz",
      difficulty: "Easy",
      questions: 3,
      duration: "~5 min",
      category: "Spiritual",
      icon: <Brain className="w-6 h-6 text-white" />
    },
    {
      id: "2",
      title: "Dharma Challenge",
      difficulty: "Medium",
      questions: 3,
      duration: "~5 min",
      category: "Dharma",
      icon: <Brain className="w-6 h-6 text-white" />
    },
    {
      id: "3",
      title: "General Knowledge",
      difficulty: "Easy",
      questions: 3,
      duration: "~5 min",
      category: "General",
      icon: <Brain className="w-6 h-6 text-white" />
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-600 text-white';
      case 'Medium':
        return 'bg-yellow-600 text-white';
      case 'Hard':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const handleStartQuiz = (quizId: string) => {
    navigate(`/quizY?id=${quizId}`);
  };

  const [customTopic, setCustomTopic] = useState("");
  const [customQuiz, setCustomQuiz] = useState<DynamicQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerateQuiz = async () => {
    if (!customTopic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: customTopic.trim() })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to generate quiz" }));
        alert("Error: " + (errorData.detail || "Failed to generate quiz"));
        return;
      }
      const data = await res.json();
      setCustomQuiz(data.questions || []);
      setUserAnswers({});
      setSubmitted(false);
    } catch (error) {
      console.error(error);
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (qIndex: number, answer: string) => {
    if (submitted) return;
    setUserAnswers({ ...userAnswers, [qIndex]: answer });
  };

  const handleSubmitQuiz = () => {
    if (Object.keys(userAnswers).length < customQuiz.length) {
      alert("Please answer all questions before submitting.");
      return;
    }
    setSubmitted(true);
  };

  const calculateScore = () => {
    return Object.entries(userAnswers).reduce((score, [idx, answer]) => {
      const question = customQuiz[parseInt(idx)];
      return score + (question && answer === question.correct_answer ? 1 : 0);
    }, 0);
  };

  return (
    <Layout showNav>
      <div className="min-h-screen bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-blue-900/30 blur-3xl opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <Button variant="ghost" onClick={() => navigate("/younger")} className="text-gray-400 hover:text-white hover:bg-[#1e1e1e]">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Quizzes & Learning</h1>
              <p className="text-sm sm:text-base text-gray-400 mt-2">
                Learn while having fun with engaging and interactive spiritual content
              </p>
            </div>
          </div>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Available Quizzes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="p-4 sm:p-6 bg-[#1e1e1e] border border-gray-800 hover:scale-105 transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600">
                      {quiz.icon}
                    </div>
                    <Badge className={getDifficultyColor(quiz.difficulty)}>
                      {quiz.difficulty}
                    </Badge>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">{quiz.title}</h3>
                  <div className="space-y-2 mb-4 sm:mb-6 text-xs sm:text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      <span>{quiz.questions} questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{quiz.duration}</span>
                    </div>
                  </div>
                  <Button onClick={() => handleStartQuiz(quiz.id)} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Begin Quiz
                  </Button>
                </Card>
              ))}
            </div>
          </div>
          <Card className="p-4 sm:p-6 bg-[#1e1e1e] border border-gray-800 mt-8 sm:mt-12">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Create Your Quiz</h2>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
              <Input placeholder="Enter a topic..." value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} className="flex-1 bg-[#131313] border border-gray-800 text-white placeholder-gray-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition text-sm h-9 sm:h-10" disabled={loading} onKeyDown={(e) => e.key === 'Enter' && !loading && handleGenerateQuiz()} />
              <Button onClick={handleGenerateQuiz} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition" size="sm" disabled={loading || !customTopic.trim()}>
                {loading ? "Generating..." : "Generate Quiz"}
              </Button>
            </div>
            {customQuiz.length > 0 && (
              <div className="space-y-4 sm:space-y-6 mt-4">
                {customQuiz.map((q, idx) => {
                  const selected = userAnswers[idx];
                  const correct = q.correct_answer;
                  const isCorrect = submitted && selected === correct;
                  const isWrong = submitted && selected && selected !== correct;
                  return (
                    <Card key={idx} className={`p-3 sm:p-4 border ${
                      isCorrect ? "bg-green-600/10 border-green-600" : 
                      isWrong ? "bg-red-600/10 border-red-600" : 
                      "bg-[#131313] border-gray-700"
                    }`}>
                      <p className="font-medium text-sm sm:text-base text-white mb-2">{idx + 1}. {q.question}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt: string) => {
                          const isSelected = selected === opt;
                          const isRightAnswer = submitted && opt === correct;
                          const showAsWrong = submitted && isSelected && opt !== correct;
                          return (
                            <Button
                              key={opt}
                              variant={isSelected ? "default" : "outline"}
                              onClick={() => handleAnswerChange(idx, opt)}
                              disabled={submitted}
                              className={`w-full text-xs sm:text-sm text-left justify-start whitespace-normal break-words min-h-[44px] py-2 px-3 ${
                                isRightAnswer ? "bg-green-600 text-white border-green-600" :
                                showAsWrong ? "bg-red-600 text-white border-red-600" :
                                isSelected ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent" :
                                "border-gray-700 text-white hover:bg-gray-800"
                              }`}
                              size="sm"
                            >
                              <span className="break-words">{opt}</span>
                            </Button>
                          );
                        })}
                      </div>
                      {submitted && (
                        <div className="mt-2">
                          {isCorrect ? <p className="text-green-400 text-sm">✓ Correct!</p> : <p className="text-red-400 text-sm">Correct Answer: {correct}</p>}
                        </div>
                      )}
                    </Card>
                  );
                })}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center pt-2">
                  {!submitted ? (
                    <Button onClick={handleSubmitQuiz} className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition" disabled={Object.keys(userAnswers).length < customQuiz.length}>
                      Submit Quiz
                    </Button>
                  ) : (
                    <>
                      <Button onClick={() => { setSubmitted(false); setUserAnswers({}); setCustomQuiz([]); setCustomTopic(""); }} variant="outline" className="w-full sm:w-auto border-gray-700 text-white hover:bg-gray-800 transition">
                        New Quiz
                      </Button>
                      <div className="text-sm sm:text-base text-gray-300">
                        Score: {calculateScore()} / {customQuiz.length}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </Card>
          <Card className="p-4 sm:p-6 bg-gradient-to-r from-purple-600/10 to-blue-600/5 border-purple-600/20 mt-8 sm:mt-12">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600/20 flex-shrink-0">
                <Info className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Learning Tip</h3>
                <p className="text-sm sm:text-base text-gray-400">
                  Take your time with each question. These exercises are designed to be both fun and beneficial for cognitive health. Regular practice can help improve memory, focus, and overall mental wellness.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default QuizzesY;
