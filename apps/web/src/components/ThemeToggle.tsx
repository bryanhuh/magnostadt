import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const location = useLocation();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide on admin routes
  if (!mounted || location.pathname.startsWith('/admin')) return null;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="fixed cursor-pointer bottom-6 right-6 z-[100] p-2 rounded-full bg-white dark:bg-[#1a2333] text-gray-900 dark:text-[#F0E6CA] shadow-2xl hover:scale-110 transition-all border border-gray-200 dark:border-[#F0E6CA]/20"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
