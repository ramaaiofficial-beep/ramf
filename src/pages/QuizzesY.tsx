import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Brain, Trophy, Play, Clock, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

const Quizzes = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    
  ];

  const quizzes: Quiz[] = [
    {
      id: "1",
      title: "Health Knowledge Quiz",
      difficulty: "Easy",
      questions: 3,
      duration: "~5 min",
      category: "Health",
      icon: <Brain className="w-6 h-6 text-white" />
    },
    {
      id: "2",
      title: "Cognitive Challenge",
      difficulty: "Medium",
      questions: 3,
      duration: "~5 min",
      category: "Cognitive",
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
        return 'bg-success text-success-foreground';
      case 'Medium':
        return 'bg-warning text-warning-foreground';
      case 'Hard':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleStartQuiz = (quizId: string) => {
    navigate(`/quiz?id=${quizId}`);
  };

  // --- Dynamic Topic Quiz State ---
  const [customTopic, setCustomTopic] = useState("");
  const [customQuiz, setCustomQuiz] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const handleGenerateQuiz = async () => {
    if (!customTopic) return;

    try {
      const res = await fetch(`${API_URL}/quizY/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: customTopic })
      });
      const data = await res.json();
      setCustomQuiz(data.questions);
      setUserAnswers({});
      setSubmitted(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAnswerChange = (qIndex: number, answer: string) => {
    setUserAnswers({ ...userAnswers, [qIndex]: answer });
  };

  const handleSubmitQuiz = () => {
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/younger")}
            className="mr-4 text-foreground hover:bg-accent"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Quizzes & Learning</h1>
            <p className="text-muted-foreground mt-2">
              Learn while having fun with engaging and interactive health content
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {categories.map((category, index) => (
            <Card key={index} className="p-6 bg-card border-border hover:scale-105 transition-all duration-300">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${category.gradient} mb-4`}>
                {category.icon}
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3">
                {category.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {category.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Available Quizzes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Available Quizzes</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="p-6 bg-card border-border hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600">
                    {quiz.icon}
                  </div>
                  <Badge className={getDifficultyColor(quiz.difficulty)}>
                    {quiz.difficulty}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold text-card-foreground mb-4">
                  {quiz.title}
                </h3>
                
                <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span>{quiz.questions} questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{quiz.duration}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleStartQuiz(quiz.id)}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Begin Quiz
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Dynamic Topic Quiz */}
        <Card className="p-6 bg-card border-border mt-12">
          <h2 className="text-xl font-bold text-card-foreground mb-4">Create Your Quiz</h2>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Enter a topic..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleGenerateQuiz} className="bg-primary hover:bg-primary/90">
              Generate Quiz
            </Button>
          </div>

          {customQuiz.length > 0 && (
            <div className="space-y-6 mt-4">
              {customQuiz.map((q, idx) => (
                <Card key={idx} className="p-4 bg-[#1e1e1e] border border-gray-700">
                  <p className="font-medium text-card-foreground mb-2">{idx + 1}. {q.question}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt: string) => (
                      <Button
                        key={opt}
                        variant={userAnswers[idx] === opt ? "secondary" : "outline"}
                        onClick={() => handleAnswerChange(idx, opt)}
                        className="text-white"
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                  {submitted && userAnswers[idx] !== q.correct_answer && (
                    <p className="text-red-400 mt-2">Correct Answer: {q.correct_answer}</p>
                  )}
                </Card>
              ))}
              <Button onClick={handleSubmitQuiz} className="bg-primary hover:bg-primary/90">
                Submit Quiz
              </Button>
            </div>
          )}
        </Card>

        {/* Learning Tip */}
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 mt-12">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 flex-shrink-0">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Learning Tip</h3>
              <p className="text-muted-foreground">
                Take your time with each question. These exercises are designed to be both fun and beneficial for cognitive health. 
                Regular practice can help improve memory, focus, and overall mental wellness.
              </p>
            </div>
          </div>
        </Card>

        
        
      </div>
    </div>
  );
};

export default Quizzes;
