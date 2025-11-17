import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface AppearanceSettings {
  glassBlur: "light" | "standard" | "ultra";
  transparency: "solid" | "standard" | "ultra";
  accentColor: "purple" | "teal" | "gold" | "blue";
  motionEnabled: boolean;
}

const defaultSettings: AppearanceSettings = {
  glassBlur: "standard",
  transparency: "standard",
  accentColor: "purple",
  motionEnabled: true,
};

const accentColorMap = {
  purple: "262 83% 58%", // Default primary
  teal: "173 80% 40%",
  gold: "43 96% 56%",
  blue: "217 91% 60%",
};

export function useAppearance() {
  const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  async function loadSettings() {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("appearance_settings")
      .eq("user_id", user.id)
      .single();

    if (!error && data?.appearance_settings) {
      setSettings({ ...defaultSettings, ...data.appearance_settings });
    }
  }

  async function saveSettings(newSettings: AppearanceSettings) {
    setSettings(newSettings);

    if (!user) return;

    await supabase
      .from("profiles")
      .update({ appearance_settings: newSettings })
      .eq("user_id", user.id);
  }

  function applySettings(settings: AppearanceSettings) {
    const root = document.documentElement;

    // Apply glass blur
    root.style.setProperty("--glass-blur", 
      settings.glassBlur === "light" ? "8px" : 
      settings.glassBlur === "ultra" ? "18px" : "12px"
    );

    // Apply accent color
    root.style.setProperty("--primary", accentColorMap[settings.accentColor]);

    // Apply motion preference
    if (!settings.motionEnabled) {
      root.style.setProperty("--animation-duration", "0s");
    } else {
      root.style.removeProperty("--animation-duration");
    }

    // Apply transparency class to body
    document.body.classList.remove("glass-solid", "glass-standard", "glass-ultra");
    document.body.classList.add(`glass-${settings.transparency}`);
  }

  return {
    settings,
    saveSettings,
  };
}
