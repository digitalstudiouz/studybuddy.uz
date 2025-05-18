import { DailyTodo } from '@/components/DailyTodo';
import '@/app/[locale]/globals.css';
import { useTranslations, useLocale } from 'next-intl';
import { Home, Timer, ListTodo, Brain, CalendarCheck } from 'lucide-react';
import React from 'react';

const menuItems = [
  { icon: <Home />, label: 'menuHome', href: '/dashboard' },
  { icon: <Timer />, label: 'menuFocus', href: '/dashboard/focus' },
  { icon: <ListTodo />, label: 'menuTasks', href: '/dashboard/tasks' },
  // { icon: <CalendarDays />, label: 'menuHabits', href: '/dashboard/habits' },
  // { icon: <NotebookPen />, label: 'menuNotepad', href: '/notepad' },
  // { icon: <LayoutGrid />, label: 'menuEisenhower', href: '/eisenhower' },
  { icon: <Brain />, label: 'menuFlashcards', href: '/dashboard/flashcards' },
  // { icon: <BarChart />, label: 'menuStats', href: '/statistics' },
  // { icon: <HeartPulse />, label: 'menuRelax', href: '/relax' },
  { icon: <CalendarCheck />, label: 'menuPlanner', href: '/dashboard/planner' },
];

export default function TasksPage() {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  return (
    <>
      <DailyTodo />
      {/* macOS-style menu bar */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-6 bg-white/5 rounded-2xl px-12 py-2 shadow-2xl backdrop-blur-md border border-white/10 min-w-[600px] max-w-[90vw] h-16 items-center justify-center z-50">
        {menuItems.map(item => (
          <a key={item.href} href={`/${locale}${item.href}`} className="relative group flex items-center justify-center">
            <span className="p-2 rounded-full group-hover:bg-white/10 transition-colors text-white">{item.icon}</span>
            {/* Tooltip on hover */}
            <span className="absolute bottom-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/90 text-white text-xs rounded shadow opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              {t(item.label)}
            </span>
          </a>
        ))}
      </nav>
    </>
  );
} 