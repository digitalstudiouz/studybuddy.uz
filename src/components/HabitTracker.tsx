"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import Image from "next/image";
import { Doughnut } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement } from "chart.js";
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface Habit {
  id: string;
  user_id: string;
  title: string;
  frequency: string[]; // e.g. ["Mo", "We", "Fr"] or ["daily"]
  goal: string;
  unit: string;
  weekly_target: number;
  reminder_time: string;
  created_at: string;
}

interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed: boolean;
  goal_value?: number;
  current_value?: number;
  unit?: string;
  note?: string;
  mood?: string;
}

export function HabitTracker() {
  const t = useTranslations("Habits");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<string[]>(["daily"]);
  const [goal, setGoal] = useState("");
  const [weeklyTarget, setWeeklyTarget] = useState(1);
  const [reminder, setReminder] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [modalHabit, setModalHabit] = useState<Habit | null>(null);
  const [habitDoneId, setHabitDoneId] = useState<string | null>(null);

  useEffect(() => {
    fetchHabits();
    fetchLogs();
  }, []);

  async function fetchHabits() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("habits").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setHabits(data || []);
  }

  async function fetchLogs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("habit_logs").select("*").eq("user_id", user.id);
    setLogs(data || []);
  }

  async function handleAddOrEditHabit(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("User not found");
      return;
    }
    if (editingId) {
      const { error } = await supabase.from("habits").update({
        title, frequency, goal, weekly_target: weeklyTarget, reminder_time: reminder
      }).eq("id", editingId);
      if (error) {
        toast.error("Update error: " + error.message);
        return;
      }
      toast.success(t("updated"));
    } else {
      const { error } = await supabase.from("habits").insert([
        { user_id: user.id, title, frequency, goal, weekly_target: weeklyTarget, reminder_time: reminder }
      ]);
      if (error) {
        toast.error("Insert error: " + error.message);
        return;
      }
      toast.success(t("added"));
    }
    setTitle(""); setFrequency(["daily"]); setGoal(""); setWeeklyTarget(1); setReminder(""); setEditingId(null); setShowForm(false);
    fetchHabits();
  }

  function getHabitLog(habitId: string, date: Date) {
    return logs.find(l => l.habit_id === habitId && isSameDay(parseISO(l.date), date));
  }

  async function handleCheck(habit: Habit, date: Date, checked: boolean, note: string, mood: string, value: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const log = getHabitLog(habit.id, date);
    if (log) {
      await supabase.from("habit_logs").update({ completed: checked, note, mood, current_value: value }).eq("id", log.id);
    } else {
      await supabase.from("habit_logs").insert([
        { habit_id: habit.id, user_id: user.id, date: format(date, "yyyy-MM-dd"), completed: checked, note, mood, current_value: value }
      ]);
    }
    fetchLogs();
  }

  // Add stats calculation for chart
  const totalCompletions = habits.map(habit =>
    logs.filter(l => l.habit_id === habit.id && l.completed).length
  );

  async function handleDeleteHabit(id: string) {
    await supabase.from("habit_logs").delete().eq("habit_id", id);
    await supabase.from("habits").delete().eq("id", id);
    toast.success(t("deleted"));
    setModalHabit(null);
    fetchHabits();
    fetchLogs();
  }

  return (
    <div className="relative min-h-[70vh] bg-[#18181b] text-white rounded-2xl shadow-xl flex flex-col md:flex-row gap-8 p-8">
      {/* Left: Habits List */}
      <div className="flex-1 flex flex-col gap-6 mt-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <Button onClick={() => setShowForm(!showForm)} className="bg-white/10 hover:bg-white/20 text-white">
            {showForm ? t("cancel") : t("addHabit")}
          </Button>
        </div>
        {showForm && (
          <form onSubmit={handleAddOrEditHabit} className="space-y-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl shadow-lg p-6">
            <div className="flex flex-col gap-2">
              <label className="font-medium">{t("habitName")}</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-transparent border-white/20 text-white placeholder:text-white/40" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium">{t("frequency")}</label>
              <div className="flex gap-2 flex-wrap">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={frequency.includes("daily")}
                    onChange={e => setFrequency(e.target.checked ? ["daily"] : [])} /> {t("daily")}
                </label>
                {WEEKDAYS.map(day => (
                  <label key={day} className="flex items-center gap-1">
                    <input type="checkbox" checked={frequency.includes(day)}
                      onChange={e => {
                        if (e.target.checked) setFrequency(f => f.filter(d => d !== "daily").concat(day));
                        else setFrequency(f => f.filter(d => d !== day));
                      }} /> {t(day)}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium">{t("goal")}</label>
              <Input value={goal} onChange={e => setGoal(e.target.value)} className="bg-transparent border-white/20 text-white placeholder:text-white/40" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium">{t("weeklyTarget")}</label>
              <Input type="number" min={1} value={weeklyTarget} onChange={e => setWeeklyTarget(Number(e.target.value))} className="bg-transparent border-white/20 text-white placeholder:text-white/40" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium">{t("reminder")}</label>
              <Input type="time" value={reminder} onChange={e => setReminder(e.target.value)} className="bg-transparent border-white/20 text-white placeholder:text-white/40" />
            </div>
            <Button type="submit" className="bg-white/20 hover:bg-white/30 text-white w-full mt-2">
              {editingId ? t("update") : t("add")}
            </Button>
          </form>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {habits.map(habit => {
            const today = new Date();
            const log = logs.find(l => l.habit_id === habit.id && isSameDay(parseISO(l.date), today));
            const checked = !!log?.completed;
            return (
              <div
                key={habit.id}
                className="relative bg-white/10 border border-white/10 rounded-xl shadow p-2 flex items-center gap-2 cursor-pointer hover:bg-white/20 transition group min-h-[44px]"
                style={{ minWidth: 0, fontSize: '0.95rem' }}
                onClick={e => {
                  if ((e.target as HTMLElement).tagName !== 'INPUT') setModalHabit(habit);
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={async e => {
                    await handleCheck(habit, today, e.target.checked, log?.note || '', log?.mood || '', log?.current_value || 0);
                    setHabitDoneId(habit.id);
                    setTimeout(() => setHabitDoneId(null), 2000);
                  }}
                  className="w-5 h-5 rounded-full border-2 border-white bg-transparent checked:bg-green-500 checked:border-green-500 transition-all cursor-pointer mr-2"
                  onClick={e => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{habit.title}</div>
                  {habitDoneId === habit.id && (
                    <div className="mt-1 text-green-400 font-medium animate-pulse text-xs">{t("added")}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Modal placeholder */}
        {modalHabit && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#23232b] rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
              <button className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl" onClick={() => setModalHabit(null)}>×</button>
              <div className="text-xl font-bold mb-4">{modalHabit.title}</div>
              {/* Calendar */}
              <div className="mb-4">
                {(() => {
                  const now = new Date();
                  const start = startOfMonth(now);
                  const end = endOfMonth(now);
                  const days = eachDayOfInterval({ start, end });
                  return (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">{format(now, "MMMM yyyy")}</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-xs mb-2">
                        {WEEKDAYS.map(day => (
                          <div key={day} className="text-center text-white/60">{t(day)}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {days.map(date => {
                          const log = getHabitLog(modalHabit.id, date);
                          const isChecked = !!log?.completed;
                          return (
                            <div
                              key={date.toISOString()}
                              className={`w-7 h-7 flex items-center justify-center rounded-full
                                ${isChecked ? "bg-green-500 text-white" : isToday(date) ? "border border-white text-white" : "bg-white/10 text-white/40"}
                                transition-all`}
                            >
                              {format(date, "d")}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="mb-2 text-white/80">{t("goal")}: <span className="font-semibold">{modalHabit.goal}</span></div>
              <div className="flex gap-4 mt-6">
                <Button
                  className="bg-white/20 hover:bg-white/30 text-white"
                  onClick={() => {
                    setEditingId(modalHabit.id);
                    setTitle(modalHabit.title);
                    setFrequency(modalHabit.frequency);
                    setGoal(modalHabit.goal);
                    setWeeklyTarget(modalHabit.weekly_target);
                    setReminder(modalHabit.reminder_time);
                    setShowForm(true);
                    setModalHabit(null);
                  }}
                >Редактировать</Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleDeleteHabit(modalHabit.id)}
                >Удалить</Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Right: Stats */}
      <div className="w-full md:w-96 flex flex-col items-center justify-center bg-white/10 rounded-2xl p-6 shadow-lg mt-12">
        <div className="text-xl font-semibold mb-4">{t("Statistics")}</div>
        <Doughnut
          data={{
            labels: ["Completed", "Incomplete"],
            datasets: [
              {
                label: "Completion Rate",
                data: [
                  totalCompletions.filter(c => c > 0).length,
                  totalCompletions.filter(c => c === 0).length
                ],
                backgroundColor: ["rgba(34,197,94,0.7)", "rgba(255,255,255,0.7)"],
                borderRadius: 8
              }
            ]
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { labels: { color: "#fff" } },
              tooltip: { enabled: true }
            },
            animation: { duration: 1200, easing: "easeOutQuart" }
          }}
          height={220}
        />
      </div>
    </div>
  );
} 