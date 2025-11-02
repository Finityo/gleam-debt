import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Download, CheckCircle, Share, Plus } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    setDeferredPrompt(null);
  };

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <SEOHead
        title="Install Finityo App | Mobile Debt Payoff Calculator"
        description="Install Finityo on your phone for quick access to your debt payoff plan. Works offline and feels like a native app."
        canonical="https://finityo-debt.com/install"
      />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          ← Back to Home
        </Button>

        <div className="text-center mb-8">
          <Smartphone className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Install Finityo
          </h1>
          <p className="text-muted-foreground">
            Get quick access to your debt payoff plan right from your home screen
          </p>
        </div>

        {isInstalled ? (
          <Card className="border-success/50 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                <CheckCircle className="w-5 h-5" />
                Already Installed!
              </CardTitle>
              <CardDescription>
                You're all set. Access Finityo from your home screen anytime.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Android/Chrome Install */}
            {isInstallable && !isIOS && (
              <Card className="mb-6 border-primary/50 bg-gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-primary" />
                    Install Now
                  </CardTitle>
                  <CardDescription>
                    Add Finityo to your home screen with one tap
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleInstall} className="w-full" size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Install App
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* iOS Safari Instructions */}
            {isIOS && isSafari && (
              <Card className="mb-6 bg-gradient-card">
                <CardHeader>
                  <CardTitle>Install on iPhone/iPad</CardTitle>
                  <CardDescription>Follow these simple steps</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Tap the Share button</p>
                      <p className="text-sm text-muted-foreground">
                        <Share className="w-4 h-4 inline mr-1" />
                        Look for the share icon in Safari's toolbar
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Select "Add to Home Screen"</p>
                      <p className="text-sm text-muted-foreground">
                        <Plus className="w-4 h-4 inline mr-1" />
                        Scroll down and tap this option
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Tap "Add"</p>
                      <p className="text-sm text-muted-foreground">
                        Finityo will appear on your home screen
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generic Instructions */}
            {!isInstallable && !isIOS && (
              <Card className="mb-6 bg-gradient-card">
                <CardHeader>
                  <CardTitle>Install on Android</CardTitle>
                  <CardDescription>Add to your home screen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Open browser menu</p>
                      <p className="text-sm text-muted-foreground">
                        Tap the menu icon (⋮) in your browser
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Select "Add to Home screen"</p>
                      <p className="text-sm text-muted-foreground">
                        Or "Install app" if available
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Confirm installation</p>
                      <p className="text-sm text-muted-foreground">
                        Finityo will appear on your home screen
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle>Why Install?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <p className="text-sm">Quick access from your home screen</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <p className="text-sm">Works offline after first load</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <p className="text-sm">Feels like a native mobile app</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <p className="text-sm">No app store download required</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <p className="text-sm">Automatic updates</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => navigate('/demo')}>
            Try Demo First
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
