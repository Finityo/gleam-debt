import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sessionLoaded: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const fullName = `${firstName} ${lastName}`.trim();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    
    // Session is set by onAuthStateChange
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    const user = data.session?.user;
    
    // Safety check
    if (!user) return;
    
    const isConfirmed = !!user.email_confirmed_at;
    const alreadySent = user.user_metadata?.welcome_sent === true;
    
    // Send welcome email only if email is confirmed and not already sent
    if (isConfirmed && !alreadySent) {
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            event: "client.email_confirmed",
            user: {
              email: user.email,
              name: user.user_metadata?.full_name ?? "there",
            },
          },
        });
        
        // Mark welcome email as sent in user metadata
        await supabase.auth.updateUser({
          data: { welcome_sent: true }
        });
        
        console.log('Welcome email sent to:', user.email);
      } catch (emailErr) {
        console.error('Welcome email failed:', emailErr);
        // Don't throw - signin was successful even if email fails
      }
    }
    
    // Session is set by onAuthStateChange
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear state on sign out
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, sessionLoaded: !loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
