import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Testimonial {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Mitchell",
    avatar: "SM",
    rating: 5,
    text: "Finityo transformed how I tackle debt. The visual timeline made everything click. Paid off $18k in 14 months using the Avalanche strategy!",
    role: "Marketing Manager",
  },
  {
    id: 2,
    name: "Maria Rodriguez",
    avatar: "MR",
    rating: 5,
    text: "Best $2.99 I've ever spent. The Plaid sync saves me so much time, and the AI insights actually help me stay on track.",
    role: "Teacher",
  },
  {
    id: 3,
    name: "James Chen",
    avatar: "JC",
    rating: 5,
    text: "The coach feature is like having a financial advisor in my pocket. Already saved over $3,000 in interest with their recommendations.",
    role: "Software Engineer",
  },
  {
    id: 4,
    name: "Emily Thompson",
    avatar: "ET",
    rating: 5,
    text: "I've tried other debt apps, but Finityo's simplicity and powerful features are unmatched. The calendar view keeps me motivated every day.",
    role: "Nurse",
  },
  {
    id: 5,
    name: "David Park",
    avatar: "DP",
    rating: 5,
    text: "Went from drowning in credit card debt to seeing the light. The snowball strategy with extra payments feature is brilliant.",
    role: "Small Business Owner",
  },
  {
    id: 6,
    name: "Lisa Anderson",
    avatar: "LA",
    rating: 5,
    text: "The what-if calculator helped me optimize my strategy. Knocked 8 months off my original timeline just by adjusting my approach!",
    role: "Accountant",
  },
];

export const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <section className="w-full py-20 px-4 bg-gradient-to-b from-background/50 to-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-finityo-textMain mb-4">
            Loved by Thousands
          </h2>
          <p className="text-lg text-finityo-textBody">
            Real stories from people crushing their debt
          </p>
        </div>

        <div className="relative">
          {/* Carousel Container */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="glass rounded-2xl p-8 md:p-12 border border-border/50 border-gradient-animate card-hover">
                    {/* Stars */}
                    <div className="flex gap-1 mb-6 justify-center">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-accent text-accent"
                        />
                      ))}
                    </div>

                    {/* Testimonial Text */}
                    <p className="text-lg md:text-xl text-finityo-textBody text-center mb-8 leading-relaxed">
                      "{testimonial.text}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                        {testimonial.avatar}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-finityo-textMain">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-finityo-textBody">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              className="rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 bg-primary"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
