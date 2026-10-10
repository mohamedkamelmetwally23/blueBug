import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ language = "en" }: { language?: "en" | "ar" }) {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === "dark");
  useEffect(() => {
    const sync = () => setDark(document.documentElement.dataset.theme === "dark");
    window.addEventListener("ops-theme", sync);
    return () => window.removeEventListener("ops-theme", sync);
  }, []);
  const label = language === "ar" ? dark ? "الوضع الفاتح" : "الوضع الداكن" : dark ? "Light mode" : "Dark mode";
  return <button className="theme-toggle secondary" type="button" aria-label={label} title={label} onClick={() => {
    const theme = dark ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("ops-theme", theme); } catch { /* Keep the selection for this session. */ }
    window.dispatchEvent(new Event("ops-theme"));
  }}>{dark ? <Sun size={17} /> : <Moon size={17} />}<span>{label}</span></button>;
}
