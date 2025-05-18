"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from '@supabase/supabase-js';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Calendar as CalendarIcon, Edit2, Copy, Save, X, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import '@/app/[locale]/globals.css';
import { Home, Timer, ListTodo, Brain, CalendarCheck } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import Image from "next/image";

// Custom dark theme overrides for FullCalendar
import { css } from '@emotion/css';
const darkCalendarStyles = css`
  .fc {
    background: #18181b !important;
    color: #f3f3f7;
    border-radius: 18px;
    font-family: 'Inter', 'SF Pro Display', 'Segoe UI', Arial, sans-serif;
    box-shadow: 0 4px 32px 0 #00000033;
    padding: 0;
  }
  .fc-toolbar-title {
    color: #fff;
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -0.5px;
  }
  .fc-daygrid-day {
    background: #23232a !important;
    border: 1px solid #23232a !important;
    min-height: 60px;
    min-width: 60px;
    border-radius: 10px;
    margin: 1px !important;
    padding: 0 !important;
    transition: background 0.2s;
  }
  .fc-daygrid-day:hover {
    background: #282832 !important;
  }
  .fc-daygrid-day-number {
    color: #bdbdbd;
    font-size: 1rem;
    font-weight: 500;
    margin: 0.25rem 0 0 0.25rem;
  }
  .fc-daygrid-event {
    background: linear-gradient(90deg, #3a3a4d 0%, #23232a 100%) !important;
    color: #fff !important;
    border: none !important;
    border-radius: 8px !important;
    font-size: 0.95rem !important;
    font-weight: 500;
    margin: 2px 0 0 0 !important;
    box-shadow: 0 2px 8px 0 #00000022;
    padding: 4px 8px !important;
    transition: background 0.2s;
  }
  .fc-daygrid-event:hover {
    background: #44445a !important;
  }
  .fc-col-header-cell {
    background: #20202a !important;
    color: #bdbdbd !important;
    font-size: 1rem;
    font-weight: 600;
    border: none !important;
    border-radius: 10px 10px 0 0;
    padding: 0.25rem 0;
  }
  .fc-scrollgrid {
    border: none !important;
    border-radius: 18px;
    overflow: hidden;
  }
  .fc-day-today {
    background: #23234a !important;
    border-radius: 10px !important;
    box-shadow: 0 0 0 2px #6366f1;
  }
  .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
    color: #fff;
    font-weight: 700;
  }
  .fc-daygrid-day.fc-day-other {
    background: #18181b !important;
    color: #444;
    opacity: 0.5;
  }
`;

interface StudyTopic {
  id: string;
  title: string;
  goal: string;
  startDate: Date;
  endDate: Date;
  dailyTimeMinutes: number;
}

interface StudyPlanItem {
  date: string;
  task: string;
  topic: string;
  duration: string;
}

interface StudyPlanRecord {
  id: string;
  user_id: string;
  name: string;
  subject: string | null;
  deadline: string | null;
  recommended_hours: number | null;
  progress_hours: number | null;
  created_at: string;
  plan_text: StudyPlanItem[];
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const menuItems = [
  { icon: <Home />, label: 'menuHome', href: '/dashboard' },
  { icon: <Timer />, label: 'menuFocus', href: '/dashboard/focus' },
  { icon: <ListTodo />, label: 'menuTasks', href: '/dashboard/tasks' },
  { icon: <Brain />, label: 'menuFlashcards', href: '/dashboard/flashcards' },
  { icon: <CalendarCheck />, label: 'menuPlanner', href: '/dashboard/planner' },
];

export default function PlannerPage() {
  const t = useTranslations("planner");
  const locale = useLocale();
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [plans, setPlans] = useState<StudyPlanRecord[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlanRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [planItems, setPlanItems] = useState<StudyPlanItem[] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editPlanItems, setEditPlanItems] = useState<StudyPlanItem[] | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchPlans = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;
      const { data, error } = await supabase
        .from('study_plan')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) setPlans(data as StudyPlanRecord[]);
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (selectedPlan && selectedPlan.plan_text) {
      setPlanItems(selectedPlan.plan_text);
      setEditPlanItems(selectedPlan.plan_text);
    } else {
      setPlanItems(null);
      setEditPlanItems(null);
    }
  }, [selectedPlan]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  const addNewTopic = () => {
    setTopics([
      ...topics,
      {
        id: crypto.randomUUID(),
        title: '',
        goal: '',
        startDate: new Date(),
        endDate: new Date(),
        dailyTimeMinutes: 60,
      },
    ]);
  };

  const updateTopic = (id: string, field: keyof StudyTopic, value: string | number | Date) => {
    setTopics(
      topics.map((topic) =>
        topic.id === id ? { ...topic, [field]: value } : topic
      )
    );
  };

  const removeTopic = (id: string) => {
    setTopics(topics.filter((topic) => topic.id !== id));
  };

  const validateTopics = () => {
    for (const topic of topics) {
      if (!topic.title.trim()) {
        toast.error(t('topicTitleRequired'));
        return false;
      }
      if (!topic.goal.trim()) {
        toast.error(t('topicGoalRequired'));
        return false;
      }
      if (topic.dailyTimeMinutes <= 0) {
        toast.error(t('invalidDailyTime'));
        return false;
      }
      if (topic.startDate > topic.endDate) {
        toast.error(t('invalidDateRange'));
        return false;
      }
    }
    return true;
  };

  const generatePlan = async () => {
    if (topics.length === 0) {
      toast.error(t('addTopicError'));
      return;
    }
    if (!validateTopics()) return;
    setIsGenerating(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('Supabase: Failed to get user.');
        return;
      }
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Failed to generate plan');
      // Use the first topic for main plan fields
      const mainTopic = topics[0];
      const { error: insertError } = await supabase.from('study_plan').insert({
        user_id: user.id,
        name: mainTopic.title,
        subject: mainTopic.title,
        deadline: mainTopic.endDate ? format(mainTopic.endDate, 'yyyy-MM-dd') : null,
        recommended_hours: mainTopic.dailyTimeMinutes,
        progress_hours: 0,
        plan_text: data.plan,
      });
      if (insertError) {
        toast.error('Supabase: Failed to save plan. ' + insertError.message);
        return;
      }
      toast.success(t('planGenerated'));
      setTopics([]);
      const { data: plansData } = await supabase
        .from('study_plan')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPlans(plansData as StudyPlanRecord[] || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('generationError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditPlan = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedPlan) return;
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      toast.error('Supabase: Failed to get user.');
      return;
    }
    const { error: updateError } = await supabase.from('study_plan').update({
      plan_text: editPlanItems,
    }).eq('id', selectedPlan.id).eq('user_id', user.id);
    if (updateError) {
      toast.error('Supabase: Failed to update plan. ' + updateError.message);
      return;
    }
    toast.success(t('planGenerated'));
    setIsEditing(false);
    setSelectedPlan({ ...selectedPlan, plan_text: editPlanItems || [] });
    setPlanItems(editPlanItems);
  };

  const handleCopyPlan = () => {
    if (!planItems) return;
    const text = planItems.map(item => `${item.date}: ${item.task} (${item.topic}, ${item.duration})`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  // Summary card data
  const totalPlans = plans.length;
  const totalHours = plans.reduce((sum, p) => sum + (p.recommended_hours || 0), 0);
  const upcomingDeadlines = plans.filter(p => p.deadline && new Date(p.deadline) > new Date()).length;

  // Group plans by end date for calendar
  const planItemsByEndDate: Record<string, StudyPlanRecord[]> = {};
  plans.forEach(plan => {
    if (plan.deadline) {
      const key = format(new Date(plan.deadline), 'yyyy-MM-dd');
      if (!planItemsByEndDate[key]) planItemsByEndDate[key] = [];
      planItemsByEndDate[key].push(plan);
    }
  });

  // Map study plans to FullCalendar events
  const calendarEvents = plans
    .filter(plan => plan.deadline)
    .map(plan => ({
      id: plan.id,
      title: plan.subject || plan.name || t('task'),
      date: plan.deadline as string,
      extendedProps: { plan },
    }));

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Logo top left */}
        <div className="absolute top-6 left-6 flex items-center gap-2 z-20">
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-full" />
          <span className="font-bold text-lg hidden md:block">Study Buddy</span>
        </div>
        {/* macOS-style menu bar */}
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-6 bg-white/5 rounded-2xl px-12 py-2 shadow-2xl backdrop-blur-md border border-white/10 min-w-[600px] max-w-[90vw] h-16 items-center justify-center z-30">
          {menuItems.map(item => (
            <a key={item.href} href={`/${locale}${item.href}`} className="relative group flex items-center justify-center">
              <span className="p-2 rounded-full group-hover:bg-white/10 transition-colors">{item.icon}</span>
              <span className="absolute bottom-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/90 text-white text-xs rounded shadow opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {t(item.label)}
              </span>
            </a>
          ))}
        </nav>
        {/* Summary Cards */}
        <div className="w-full max-w-6xl flex flex-row justify-between items-center mt-24 mb-8 z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
            <div className="bg-[#23232a] rounded-xl p-6 flex flex-col items-center shadow-lg">
              <span className="text-3xl font-bold text-purple-400">{totalPlans}</span>
              <span className="mt-2 text-sm text-gray-300">{t('totalPlans')}</span>
            </div>
            <div className="bg-[#23232a] rounded-xl p-6 flex flex-col items-center shadow-lg">
              <span className="text-3xl font-bold text-blue-400">{totalHours}</span>
              <span className="mt-2 text-sm text-gray-300">{t('totalHours')}</span>
            </div>
            <div className="bg-[#23232a] rounded-xl p-6 flex flex-col items-center shadow-lg">
              <span className="text-3xl font-bold text-yellow-400">{upcomingDeadlines}</span>
              <span className="mt-2 text-sm text-gray-300">{t('upcomingDeadlines')}</span>
            </div>
          </div>
          <Button className="ml-6 h-14 px-8 text-lg bg-gradient-to-r from-[#3a3a4d] to-[#23232a] text-white border-none shadow-lg fixed top-8 right-8 z-40" onClick={() => setShowFormModal(true)}>
            + {t('createPlan') || 'Create Plan'}
          </Button>
        </div>
        {/* Calendar Section - FullCalendar version */}
        <div className={`w-full max-w-6xl h-[600px] bg-[#18181b] rounded-2xl shadow-xl p-0 mb-8 overflow-y-auto border border-[#23232a] ${darkCalendarStyles}`}>
          {/* Custom minimalistic month navigation */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <button
              className="rounded-full bg-[#23232a] hover:bg-[#282832] p-2 transition flex items-center justify-center shadow border border-[#23232a]"
              aria-label="Previous Month"
              onClick={() => {
                if (calendarRef.current) {
                  calendarRef.current.getApi().prev();
                  setCurrentDate(calendarRef.current.getApi().getDate());
                }
              }}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-lg font-semibold text-white select-none" style={{letterSpacing: '-0.5px'}}>
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              className="rounded-full bg-[#23232a] hover:bg-[#282832] p-2 transition flex items-center justify-center shadow border border-[#23232a]"
              aria-label="Next Month"
              onClick={() => {
                if (calendarRef.current) {
                  calendarRef.current.getApi().next();
                  setCurrentDate(calendarRef.current.getApi().getDate());
                }
              }}
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="w-full h-full">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              height={600}
              contentHeight={600}
              events={calendarEvents}
              eventClick={(info) => {
                setSelectedPlan(info.event.extendedProps.plan);
                setShowModal(true);
              }}
              headerToolbar={false}
              dayMaxEventRows={2}
              fixedWeekCount={false}
              displayEventTime={false}
              datesSet={arg => setCurrentDate(arg.start)}
            />
          </div>
        </div>
        {/* Create Plan Modal - only topic/goal/start/end/daily time, blocks for topics */}
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-[#18181b] text-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative p-8">
              <button className="absolute right-4 top-4 text-2xl text-gray-400 hover:text-white" onClick={() => setShowFormModal(false)} aria-label="Close">×</button>
              <h2 className="text-xl font-bold mb-4">{t('createPlan') || 'Create Plan'}</h2>
              {topics.map((topic) => (
                <Card key={topic.id} className="p-4 bg-[#23232a] border border-[#353545] mb-2 shadow-md">
                  <div className="space-y-4">
                    <Input placeholder={t('topicPlaceholder') || 'Введите тему или предмет (например, Математика, IELTS Speaking)'} value={topic.title} onChange={e => updateTopic(topic.id, 'title', e.target.value)} className="bg-[#23232a] border border-[#444] focus:border-blue-500 text-white rounded-lg px-4 py-2 transition-all" />
                    <Textarea placeholder={t('goalPlaceholder') || 'Введите вашу цель (например, подготовка к экзамену, повторение всех тем)'} value={topic.goal} onChange={e => updateTopic(topic.id, 'goal', e.target.value)} className="bg-[#23232a] border border-[#444] focus:border-blue-500 text-white rounded-lg px-4 py-2 transition-all" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block text-gray-300">{t('startDate') || 'Дата Начала'}</label>
                        <Input type="date" value={format(topic.startDate, 'yyyy-MM-dd')} onChange={e => updateTopic(topic.id, 'startDate', new Date(e.target.value))} className="bg-[#23232a] border border-[#444] focus:border-blue-500 text-white rounded-lg px-4 py-2 transition-all" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block text-gray-300">{t('endDate') || 'Дата Окончания'}</label>
                        <Input type="date" value={format(topic.endDate, 'yyyy-MM-dd')} onChange={e => updateTopic(topic.id, 'endDate', new Date(e.target.value))} className="bg-[#23232a] border border-[#444] focus:border-blue-500 text-white rounded-lg px-4 py-2 transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block text-gray-300">{t('dailyTime') || 'Ежедневное Время Учёбы (минуты)'}</label>
                      <Input type="number" min="1" value={topic.dailyTimeMinutes} onChange={e => updateTopic(topic.id, 'dailyTimeMinutes', parseInt(e.target.value) || 0)} className="bg-[#23232a] border border-[#444] focus:border-blue-500 text-white rounded-lg px-4 py-2 transition-all" />
                    </div>
                    {topics.length > 1 && (
                      <Button variant="destructive" onClick={() => removeTopic(topic.id)} className="rounded-lg border border-[#444]">{t('removeTopic') || 'Удалить Тему'}</Button>
                    )}
                  </div>
                </Card>
              ))}
              <Button onClick={addNewTopic} className="w-full bg-[#23232a] text-white border border-[#444] rounded-lg mb-2"><Plus className="mr-2 h-4 w-4" />{t('addTopic') || 'Добавить Тему'}</Button>
              <Button onClick={async () => { await generatePlan(); setShowFormModal(false); }} disabled={isGenerating || topics.length === 0} className="w-full bg-gradient-to-r from-[#3a3a4d] to-[#23232a] text-white border-none rounded-lg mt-2 text-lg py-3 shadow-md">
                {isGenerating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('generating') || 'Генерация...'}</>) : (<><CalendarIcon className="mr-2 h-4 w-4" />{t('generatePlan') || 'Создать План Учёбы'}</>)}
              </Button>
            </div>
          </div>
        )}
        {/* Plan Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-[#18181b] text-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto relative p-6">
              <button className="absolute right-4 top-4 text-2xl text-gray-400 hover:text-white" onClick={() => { setShowModal(false); setIsEditing(false); }} aria-label="Close">×</button>
              <h2 className="text-xl font-bold mb-4">{selectedPlan?.name || 'Plan'}</h2>
              <div className="flex gap-2 mb-4">
                <Button size="sm" variant="outline" className="bg-[#23232a] text-white border-none" onClick={handleCopyPlan}><Copy className="w-4 h-4 mr-1" />{t('copy') || 'Copy'}</Button>
                {!isEditing && <Button size="sm" variant="outline" className="bg-[#23232a] text-white border-none" onClick={handleEditPlan}><Edit2 className="w-4 h-4 mr-1" />{t('edit') || 'Edit'}</Button>}
                {isEditing && <Button size="sm" variant="outline" className="bg-[#23232a] text-white border-none" onClick={handleSaveEdit}><Save className="w-4 h-4 mr-1" />{t('save') || 'Save'}</Button>}
                {isEditing && <Button size="sm" variant="outline" className="bg-[#23232a] text-white border-none" onClick={() => { setIsEditing(false); setEditPlanItems(planItems); }}><X className="w-4 h-4 mr-1" />{t('cancel') || 'Cancel'}</Button>}
                {!isEditing && selectedPlan && (
                  <Button size="sm" variant="outline" className="bg-green-600 text-white border-none" onClick={async () => {
                    const { data: { user }, error: userError } = await supabase.auth.getUser();
                    if (userError || !user) return;
                    const { error: deleteError } = await supabase.from('study_plan').delete().eq('id', selectedPlan.id).eq('user_id', user.id);
                    if (!deleteError) {
                      setPlans(plans.filter(p => p.id !== selectedPlan.id));
                      setShowModal(false);
                      await supabase.rpc('increment_completed_plans_count', { user_id: user.id });
                      toast.success(t('planCompleted') || 'План выполнен и удалён!');
                    }
                  }}>
                    ✓ {t('done') || 'Выполнено'}
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {isEditing && editPlanItems && Array.isArray(editPlanItems) ? editPlanItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#23232a] rounded-lg flex flex-col gap-2">
                    <Input value={item.date} onChange={e => setEditPlanItems(editPlanItems.map((it, i) => i === idx ? { ...it, date: e.target.value } : it))} className="bg-[#23232a] border-none text-white" />
                    <Input value={item.topic} onChange={e => setEditPlanItems(editPlanItems.map((it, i) => i === idx ? { ...it, topic: e.target.value } : it))} className="bg-[#23232a] border-none text-white" />
                    <Textarea value={item.task} onChange={e => setEditPlanItems(editPlanItems.map((it, i) => i === idx ? { ...it, task: e.target.value } : it))} className="bg-[#23232a] border-none text-white" />
                    <Input value={item.duration} onChange={e => setEditPlanItems(editPlanItems.map((it, i) => i === idx ? { ...it, duration: e.target.value } : it))} className="bg-[#23232a] border-none text-white" />
                  </div>
                )) : planItems && Array.isArray(planItems) ? planItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#23232a] rounded-lg">
                    <p className="font-medium">{item.date}</p>
                    <p className="text-sm text-gray-400">{item.topic}</p>
                    <p>{item.task}</p>
                    <p className="text-sm text-gray-400">{t('duration') || 'Duration'}: {item.duration}</p>
                  </div>
                )) : <p className="text-gray-400">No plan data.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 