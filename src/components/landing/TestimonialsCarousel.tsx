import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  debtCleared: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Mitchell",
    role: "Marketing Manager",
    avatar: "SM",
    rating: 5,
    debtCleared: "$23,000",
    text: "Finityo changed my life. I was drowning in credit card debt and didn't know where to start. The AI-powered plan showed me exactly how to pay everything off in 18 months instead of 5+ years. I'm finally debt-free!"
  },
  {
    id: 2,
    name: "Marcus Johnson",
    role: "Software Engineer",
    avatar: "MJ",
    rating: 5,
    debtCleared: "$41,500",
    text: "The Smart Hybrid strategy saved me thousands in interest. I tried spreadsheets and other apps, but Finityo's visual timeline and month-by-month breakdown kept me motivated. Worth every penny."
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    role: "Teacher",
    avatar: "ER",
    rating: 5,
    debtCleared: "$15,800",
    text: "I loved the Plaid integration—no manual entry! Finityo pulled my accounts and built a plan instantly. The coach suggestions were incredibly helpful when I got stuck. Highly recommend!"
  },
  {
    id: 4,
    name: "David Chen",
    role: "Small Business Owner",
    avatar: "DC",
    rating: 5,
    debtCleared: "$67,000",
    text: "Running a business while managing personal debt was overwhelming. Finityo's clear payoff calendar and scenario comparisons helped me make smart decisions. Cleared my debt 2 years early."
  },
  {
    id: 5,
    name: "Jessica Taylor",
    role: "Nurse",
    avatar: "JT",
    rating: 5,
    debtCleared: "$19,200",
    text: "The visual charts made it so easy to understand my progress. I could see exactly when each debt would be paid off. Sharing my plan with my financial coach was a game-changer!"
  },
  {
    id: 6,
    name: "Alex Kumar",
    role: "Graduate Student",
    avatar: "AK",
    rating: 5,
    debtCleared: "$12,500",
    text: "As a student, I needed something simple and effective. Finityo showed me how to tackle my credit card debt while still in school. The snowball method kept me motivated to keep going!"
  }
];

export function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-background/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Quote className="w-4 h-4" />
            <span className="text-sm font-medium">Success Stories</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Real People, Real Results
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join thousands who've achieved financial freedom with Finityo.
          </p>
        </div>

        <div 
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Main Testimonial Card */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-12 shadow-lg hover:shadow-xl transition-all mx-auto max-w-4xl">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
                          {testimonial.avatar}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-4">
                        {/* Stars */}
                        <div className="flex gap-1">
                          {Array.from({ length: testimonial.rating }).map((_, i) => (
                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>

                        {/* Quote */}
                        <p className="text-lg text-foreground leading-relaxed">
                          "{testimonial.text}"
                        </p>

                        {/* Author Info */}
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                          <div>
                            <div className="font-semibold text-foreground">{testimonial.name}</div>
                            <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                          </div>
                          <div className="h-8 w-px bg-border" />
                          <div className="text-sm">
                            <span className="text-muted-foreground">Debt Cleared:</span>{" "}
                            <span className="font-bold text-green-500">{testimonial.debtCleared}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-0 md:-mx-12 pointer-events-none">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              className="pointer-events-auto rounded-full h-12 w-12 bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="pointer-events-auto rounded-full h-12 w-12 bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  currentIndex === index 
                    ? "w-8 bg-primary" 
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
