import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizData {
  id: string;
  title: string;
  difficulty: string;
  questions: Question[];
}

const QuizTaker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get('id');

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);

  const quizData: { [key: string]: QuizData } = {
    "1": {
      id: "1",
      title: "Health Knowledge Quiz",
      difficulty: "Easy",
      questions: [
        {
          id: "1",
          question: "How many hours of sleep do adults typically need per night?",
          options: ["5-6 hours", "7-9 hours", "10-12 hours", "4-5 hours"],
          correctAnswer: 1,
          explanation: "Most adults need 7-9 hours of sleep per night for optimal health and cognitive function."
        },
        {
          id: "2", 
          question: "Which vitamin is primarily produced when skin is exposed to sunlight?",
          options: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin E"],
          correctAnswer: 2,
          explanation: "Vitamin D is synthesized in the skin when exposed to UVB radiation from sunlight."
        },
        {
          id: "3",
          question: "What is the recommended daily water intake for adults?",
          options: ["4-5 glasses", "6-7 glasses", "8-10 glasses", "12+ glasses"],
          correctAnswer: 2,
          explanation: "Adults should aim for about 8-10 glasses (64-80 oz) of water daily, though needs may vary."
        }
      ]
    },
    "2": {
      id: "2", 
      title: "Cognitive Challenge",
      difficulty: "Medium",
      questions: [
        {
          id: "1",
          question: "If you have 3 apples and you take away 2, how many do you have?",
          options: ["1 apple", "2 apples", "3 apples", "0 apples"],
          correctAnswer: 1,
          explanation: "You have 2 apples - the ones you took away! This tests logical thinking over quick assumptions."
        },
        {
          id: "2",
          question: "What comes next in this sequence: 2, 6, 12, 20, 30, ?",
          options: ["40", "42", "44", "46"],
          correctAnswer: 1,
          explanation: "The pattern is n(n+1): 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42"
        },
        {
          id: "3",
          question: "Which word doesn't belong with the others?",
          options: ["Heart", "Liver", "Kidney", "Brain"],
          correctAnswer: 0,
          explanation: "Heart is the only muscle organ, while liver, kidney, and brain are solid organs."
        }
      ]
    },
    "3": {
      id: "3",
      title: "General Knowledge", 
      difficulty: "Easy",
      questions: [
        {
          id: "1",
          question: "What is the largest organ in the human body?",
          options: ["Brain", "Liver", "Skin", "Heart"],
          correctAnswer: 2,
          explanation: "The skin is the largest organ, covering the entire body and regulating temperature."
        },
        {
          id: "2",
          question: "Which of these is a good source of omega-3 fatty acids?",
          options: ["Salmon", "Chicken", "Rice", "Bread"],
          correctAnswer: 0,
          explanation: "Salmon and other fatty fish are excellent sources of omega-3 fatty acids, important for heart and brain health."
        },
        {
          id: "3",
          question: "What does BMI stand for?",
          options: ["Body Mass Index", "Basic Medical Information", "Blood Metabolism Indicator", "Bone Mineral Index"],
          correctAnswer: 0,
          explanation: "BMI (Body Mass Index) is a measure of body fat based on height and weight."
        }
      ]
    }
  };

  const currentQuiz = quizId ? quizData[quizId] : null;
  const currentQuestion = currentQuiz?.questions[currentQuestionIndex];
  const totalQuestions = currentQuiz?.questions.length || 0;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  useEffect(() => {
    if (!currentQuiz) {
      navigate('/quizzesY');
      toast({
        title: "Error",
        description: "Quiz not found",
        variant: "destructive"
      });
    }
  }, [currentQuiz, navigate, toast]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);
    setShowResult(true);

    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        // Quiz completed
        const finalScore = newAnswers.reduce((acc, answer, index) => {
          return acc + (answer === currentQuiz!.questions[index].correctAnswer ? 1 : 0);
        }, 0);
        setScore(finalScore);
        setQuizCompleted(true);
      }
    }, 2000);
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserAnswers([]);
    setShowResult(false);
    setQuizCompleted(false);
    setScore(0);
  };

  const getScoreMessage = () => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage === 100) return "Perfect! Outstanding work!";
    if (percentage >= 80) return "Excellent! Great job!";
    if (percentage >= 60) return "Good work! Keep learning!";
    return "Keep practicing! You'll improve!";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-success text-success-foreground';
      case 'Medium':
        return 'bg-warning text-warning-foreground';
      case 'Hard':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (!currentQuiz) {
    return null;
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center bg-card border-border">
              <div className="mb-6">
                <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-card-foreground mb-2">Quiz Completed!</h1>
                <p className="text-muted-foreground">{getScoreMessage()}</p>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold text-primary mb-2">
                  {score}/{totalQuestions}
                </div>
                <div className="text-lg text-muted-foreground">
                  {Math.round((score / totalQuestions) * 100)}% Correct
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={handleRestartQuiz}
                  className="bg-primary hover:bg-primary/90"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/quizzesY')}
                  className="border-border text-foreground hover:bg-accent"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Quizzes
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/quizzesY')}
              className="mr-4 text-foreground hover:bg-accent"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{currentQuiz.title}</h1>
              <Badge className={getDifficultyColor(currentQuiz.difficulty)}>
                {currentQuiz.difficulty}
              </Badge>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Quiz Content */}
        <div className="max-w-2xl mx-auto">
          {!showResult ? (
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-bold text-card-foreground mb-6">
                {currentQuestion?.question}
              </h2>
              
              <div className="space-y-3 mb-6">
                {currentQuestion?.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={selectedAnswer === index ? "default" : "outline"}
                    className={`w-full p-4 h-auto text-left justify-start ${
                      selectedAnswer === index 
                        ? "bg-primary text-primary-foreground" 
                        : "border-border text-foreground hover:bg-accent"
                    }`}
                    onClick={() => handleAnswerSelect(index)}
                  >
                    <span className="mr-3 font-bold">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </Button>
                ))}
              </div>
              
              <Button 
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {currentQuestionIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next Question'}
              </Button>
            </Card>
          ) : (
            <Card className="p-6 bg-card border-border">
              <div className="text-center">
                {selectedAnswer === currentQuestion?.correctAnswer ? (
                  <>
                    <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-success mb-4">Correct!</h3>
                  </>
                ) : (
                  <>
                    <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-destructive mb-4">Incorrect</h3>
                    <p className="text-muted-foreground mb-4">
                      The correct answer was: <strong>{currentQuestion?.options[currentQuestion.correctAnswer]}</strong>
                    </p>
                  </>
                )}
                
                {currentQuestion?.explanation && (
                  <div className="bg-accent p-4 rounded-lg">
                    <p className="text-card-foreground">{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizTaker;