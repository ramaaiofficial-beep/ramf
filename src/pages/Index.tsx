import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Pill, BookOpen, Brain } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Pill,
      title: "Medication Management",
      description: "Stay on top of your medication schedule with smart reminders and easy tracking.",
      route: "/medications",
      gradient: "bg-gradient-to-br from-primary to-blue-600"
    },
    {
      icon: BookOpen,
      title: "Health Education Hub",
      description: "Access your medical notes and get instant help from our AI health assistant.",
      route: "/education",
      gradient: "bg-gradient-to-br from-success to-emerald-600"
    },
    {
      icon: Brain,
      title: "Quizzes & Learning",
      description: "Learn while having fun with engaging and interactive health content.",
      route: "/quizzes",
      gradient: "bg-gradient-to-br from-purple-600 to-indigo-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Health Management Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your comprehensive health companion for medication tracking, education, and wellness learning.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="relative overflow-hidden group hover:scale-105 transition-all duration-300 cursor-pointer border-border bg-card">
                <div className="p-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${feature.gradient} mb-6`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-card-foreground mb-4">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <Button 
                    onClick={() => navigate(feature.route)}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Get Started
                  </Button>
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { label: "Active Users", value: "10K+" },
            { label: "Medications Tracked", value: "50K+" },
            { label: "Quizzes Completed", value: "25K+" },
            { label: "Health Articles", value: "1K+" }
          ].map((stat, index) => (
            <Card key={index} className="p-6 text-center bg-card border-border">
              <div className="text-2xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;