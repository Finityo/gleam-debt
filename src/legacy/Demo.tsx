import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Demo = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard with demo mode enabled
    navigate('/dashboard?demo=true', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Loading demo...</p>
    </div>
  );
};

export default Demo;
