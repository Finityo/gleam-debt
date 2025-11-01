import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Target, Shield, Users, Zap } from 'lucide-react';
import finityoLogo from '@/assets/finityo-logo.png';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';

const About = () => {
  const { goToHome } = useSmartNavigation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Button
          variant="ghost"
          onClick={goToHome}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Home
        </Button>

        <div className="text-center mb-12">
          <img 
            src={finityoLogo} 
            alt="Finityo Logo" 
            className="h-16 mx-auto mb-6"
          />
          <h1 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            About Finityo
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Empowering people to achieve financial freedom through proven debt payoff strategies
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We believe everyone deserves a clear path to becoming debt-free. Finityo was created to simplify 
                  the debt payoff journey by combining powerful automation with proven financial strategies like 
                  the snowball and avalanche methods.
                </p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Too many people feel overwhelmed by debt, unsure where to start or how to make meaningful progress. 
              We built Finityo to change that—providing transparency, guidance, and motivation every step of the way.
            </p>
          </CardContent>
        </Card>

        {/* Why We Built This */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Why We Built Finityo</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                The idea for Finityo came from personal experience. Our founder struggled with managing multiple 
                credit cards and loans, spending hours on spreadsheets trying to figure out the optimal payoff strategy. 
                The math was confusing, progress felt slow, and motivation was hard to maintain.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We realized there had to be a better way—a tool that could automatically connect to your accounts, 
                calculate the best payoff plan, and show you exactly how much faster you could become debt-free with 
                the right approach.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                That's how Finityo was born: a debt management app designed to make the complex simple and the 
                overwhelming manageable.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What Makes Us Different */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">What Makes Us Different</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="inline-flex p-3 bg-accent/10 rounded-lg mb-4">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-bold mb-2">Automated Connection</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your accounts securely through Plaid. No manual entry, no guesswork—just instant, 
                  accurate debt tracking.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="inline-flex p-3 bg-success/10 rounded-lg mb-4">
                  <Shield className="w-6 h-6 text-success" />
                </div>
                <h3 className="font-bold mb-2">Bank-Level Security</h3>
                <p className="text-sm text-muted-foreground">
                  Your financial data is protected with the same encryption standards used by major banks. 
                  We never see your login credentials.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Community-Driven</h3>
                <p className="text-sm text-muted-foreground">
                  Built with feedback from real users on their debt-free journey. We're constantly improving 
                  based on what matters most to you.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Our Commitment */}
        <Card className="mb-8 bg-gradient-primary">
          <CardContent className="p-8 text-primary-foreground">
            <h2 className="text-2xl font-bold mb-4">Our Commitment to You</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span><strong>Privacy First:</strong> Your financial data is yours. We never sell or share your information.</span>
              </li>
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span><strong>Transparency:</strong> Clear strategies, honest math, no hidden fees or upsells.</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span><strong>Continuous Improvement:</strong> We're always adding features and refining the experience.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Debt-Free Journey?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of users who are taking control of their finances with Finityo. 
            Connect your accounts, get your personalized plan, and watch your progress accelerate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8"
            >
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/')}
              className="text-lg px-8"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
