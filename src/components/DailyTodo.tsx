'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Check, Trash2, Edit2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import '@/app/[locale]/globals.css';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string; 
  is_done: boolean;
}

export function DailyTodo() {
  const t = useTranslations('Tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: new Date().toISOString().split('T')[0],
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order(sortBy === 'priority' ? 'priority' : 'due_date');

    if (error) {
      toast.error(t('errorFetching'));
      return;
    }

    setTasks(data || []);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: user.id,
          ...newTask,
        },
      ]);

    if (error) {
      toast.error(t('errorAdding'));
      return;
    }

    toast.success(t('taskAdded'));
    setNewTask({
      title: '',
      priority: 'medium',
      due_date: new Date().toISOString().split('T')[0],
    });
    fetchTasks();
  };

  const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_done: !currentStatus })
      .eq('id', taskId);

    if (error) {
      toast.error(t('errorUpdating'));
      return;
    }

    fetchTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm(t('confirmDelete'))) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      toast.error(t('errorDeleting'));
      return;
    }

    toast.success(t('taskDeleted'));
    fetchTasks();
  };

  const handleEditTask = async (task: Task) => {
    setEditingTask(task);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const { error } = await supabase
      .from('tasks')
      .update({
        title: editingTask.title,
        priority: editingTask.priority,
        due_date: editingTask.due_date,
      })
      .eq('id', editingTask.id);

    if (error) {
      toast.error(t('errorUpdating'));
      return;
    }

    toast.success(t('taskUpdated'));
    setEditingTask(null);
    fetchTasks();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-500';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'low':
        return 'bg-green-500/20 text-green-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-[#18181b] text-white">
      <div className="max-w-2xl mx-auto py-12 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">{t('dailyTasks')}</h1>
          <Select value={sortBy} onValueChange={(value: 'priority' | 'date') => setSortBy(value)}>
            <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
              <SelectValue placeholder={t('sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">{t('sortByPriority')}</SelectItem>
              <SelectItem value="date">{t('sortByDate')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="space-y-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl shadow-lg p-6">
          <Input
            placeholder={t('taskTitle')}
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
            className="bg-transparent border-white/20 text-white placeholder:text-white/40"
          />
          <div className="flex gap-4">
            <Select
              value={newTask.priority}
              onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask({ ...newTask, priority: value })}
            >
              <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder={t('selectPriority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('priorityLow')}</SelectItem>
                <SelectItem value="medium">{t('priorityMedium')}</SelectItem>
                <SelectItem value="high">{t('priorityHigh')}</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[180px] justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newTask.due_date ? format(new Date(newTask.due_date), 'PPP') : t('selectDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white rounded-lg shadow-lg border border-gray-200">
                <Calendar
                  mode="single"
                  selected={new Date(newTask.due_date)}
                  onSelect={(date) => date && setNewTask({ ...newTask, due_date: date.toISOString().split('T')[0] })}
                  initialFocus
                  className="bg-gray-50 rounded-lg"
                  captionLayout="dropdown"
                  fromYear={2000}
                  toYear={2100}
                />
              </PopoverContent>
            </Popover>
            <Button type="submit" className="bg-white/20 hover:bg-white/30 text-white">
              <Plus className="w-4 h-4 mr-2" />
              {t('addTask')}
            </Button>
          </div>
        </form>

        {/* Tasks List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shadow-lg",
                task.is_done && "opacity-50"
              )}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={cn("px-2 py-1 rounded-md text-xs font-medium", getPriorityColor(task.priority))}>
                  {task.priority}
                </div>
                <span className={cn("flex-1", task.is_done && "line-through text-white/50")}>
                  {task.title}
                </span>
                <span className="text-sm text-white/40">
                  {format(new Date(task.due_date), 'PPP')}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  
                  onClick={() => handleToggleComplete(task.id, task.is_done)}
                  className="rounded-full bg-white/10 backdrop-blur border border-white/20 shadow-lg p-3 hover:bg-white/20 transition"
                >
                  <Check className={cn("h-4 w-4", task.is_done && "text-green-500")} />
                </Button>
                <Button
                 
                  onClick={() => handleEditTask(task)}
                  className="rounded-full bg-white/10 backdrop-blur border border-white/20 shadow-lg p-3 hover:bg-white/20 transition"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                 
                  onClick={() => handleDeleteTask(task.id)}
                  className="rounded-full bg-white/10 backdrop-blur border border-white/20 shadow-lg p-3 hover:bg-white/20 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Task Modal */}
        {editingTask && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl w-full max-w-md border border-white/10 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-white">{t('editTask')}</h2>
              <form onSubmit={handleUpdateTask} className="space-y-4">
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  required
                  className="bg-transparent border-white/20 text-white placeholder:text-white/40"
                />
                <Select
                  value={editingTask.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') =>
                    setEditingTask({ ...editingTask, priority: value })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder={t('selectPriority')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('priorityLow')}</SelectItem>
                    <SelectItem value="medium">{t('priorityMedium')}</SelectItem>
                    <SelectItem value="high">{t('priorityHigh')}</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingTask.due_date ? format(new Date(editingTask.due_date), 'PPP') : t('selectDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white rounded-lg shadow-lg border border-gray-200">
                    <Calendar
                      mode="single"
                      selected={new Date(editingTask.due_date)}
                      onSelect={(date) => date && setEditingTask({ ...editingTask, due_date: date.toISOString().split('T')[0] })}
                      initialFocus
                      className="bg-gray-50 rounded-lg"
                      captionLayout="dropdown"
                      fromYear={2000}
                      toYear={2100}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingTask(null)} className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
                    {t('cancel')}
                  </Button>
                  <Button type="submit" className="bg-white/20 hover:bg-white/30 text-white">
                    {t('save')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 