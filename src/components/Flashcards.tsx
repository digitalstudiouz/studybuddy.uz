"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";
import { X } from 'lucide-react';
import { useRouter, useParams } from "next/navigation";
import '@/app/[locale]/globals.css';


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface Flashcard {
  id: string;
  question: string;
  answer: string; 
  image_url?: string;
  last_reviewed?: string;
  next_review?: string;
  created_at?: string;
  user_id?: string;
  category?: string;
}

interface FlashcardSet {
  id: string;
  name: string;
  created_at?: string;
}

export function Flashcards() {
  const t = useTranslations("Flashcards");
  const locale = useLocale();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imgGenLoading, setImgGenLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [newCards, setNewCards] = useState<Array<{
    question: string;
    answer: string;
    imgGenKeyword: string;
    imageUrl?: string;
  }>>([{ question: "", answer: "", imgGenKeyword: "", imageUrl: undefined }]);
  const [savingSet, setSavingSet] = useState(false);
  const router = useRouter();
  const params = useParams();
  const setId = params?.setId as string;
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [setCardCounts, setSetCardCounts] = useState<Record<string, number>>({});
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [studySessionCards, setStudySessionCards] = useState<Flashcard[]>([]);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [loadingSets, setLoadingSets] = useState(true);

  useEffect(() => {
    fetchFlashcards();
    fetchSetsAndCounts();
  }, []);

  async function fetchFlashcards() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setFlashcards(data);
    }
  }

  async function fetchSetsAndCounts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLoadingSets(true);
    // Fetch sets
    const { data: setsData } = await supabase
      .from("flashcard_sets")
      .select("id, name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setSets(setsData || []);
    // Fetch card counts for each set
    if (setsData && setsData.length > 0) {
      const { data: cardsData } = await supabase
        .from("flashcards")
        .select("set_id")
        .eq("user_id", user.id);
      const counts: Record<string, number> = {};
      (cardsData || []).forEach(card => {
        if (card.set_id) counts[card.set_id] = (counts[card.set_id] || 0) + 1;
      });
      setSetCardCounts(counts);
    } else {
      setSetCardCounts({});
    }
    setLoadingSets(false);
  }

  async function handleAddFlashcard(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let uploadedImageUrl = imageUrl;
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('flashcards').upload(fileName, imageFile);
      if (!error && data) {
        const { data: publicUrl } = supabase.storage.from('flashcards').getPublicUrl(data.path);
        uploadedImageUrl = publicUrl.publicUrl;
      }
    }
    const { error } = await supabase.from("flashcards").insert([
      {
        user_id: user.id,
        question,
        answer,
        image_url: uploadedImageUrl,
        category: category.trim() || null,
      },
    ]);
    if (!error) {
      toast.success(t("added"));
      setQuestion("");
      setAnswer("");
      setImageUrl(undefined);
      setImageFile(null);
      setCategory("");
      fetchFlashcards();
    } else {
      toast.error(t("errorAdd"));
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("flashcards").delete().eq("id", id);
    if (!error) {
      setFlashcards(flashcards.filter(f => f.id !== id));
      toast.success(t("deleted"));
    }
  }

  async function handleStudied(id: string) {
    const { error } = await supabase.from("flashcards").update({ last_reviewed: new Date().toISOString() }).eq("id", id);
    if (!error) {
      fetchFlashcards();
      toast.success(t("studied"));
    }
  }

  const filteredFlashcards = category
    ? flashcards.filter(f => f.category === category)
    : flashcards;

  // Helper to add a new card to the set
  function handleAddCardToSet() {
    setNewCards([...newCards, { question: "", answer: "", imgGenKeyword: "", imageUrl: undefined }]);
  }

  // Helper to remove a card from the set
  function handleRemoveCard(idx: number) {
    setNewCards(cards => cards.filter((_, i) => i !== idx));
  }

  // Helper to update a card in the set
  function updateCardField(idx: number, field: string, value: string) {
    setNewCards(cards => cards.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  }

  // Helper to set image url for a card
  function setCardImage(idx: number, url: string) {
    setNewCards(cards => cards.map((c, i) => i === idx ? { ...c, imageUrl: url } : c));
  }

  // AI image generation for a card
  async function handleImageGenerateForCard(idx: number) {
    updateCardField(idx, 'imgGenKeyword', newCards[idx].imgGenKeyword);
    setImgGenLoading(true);
    try {
      const res = await fetch("/api/flashcards/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newCards[idx].imgGenKeyword, language: locale }),
      });
      const data = await res.json();
      if (data.image_url) {
        setCardImage(idx, data.image_url);
        toast.success(t("imgSuccess"));
      } else {
        toast.error(t("imgError"));
      }
    } catch {
      toast.error(t("imgError"));
    }
    setImgGenLoading(false);
  }

  // Save the set and all cards
  async function handleSaveSet() {
    if (!categoryName.trim() || newCards.length === 0) return;
    setSavingSet(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // 1. Create the set
    const { data: setData, error: setError } = await supabase.from("flashcard_sets").insert({ user_id: user.id, name: categoryName.trim() }).select().single();
    if (setError || !setData) {
      toast.error(t("errorAdd"));
      setSavingSet(false);
      return;
    }
    const setId = setData.id;
    // 2. Insert cards with set_id
    const inserts = newCards
      .filter(card => card.question.trim() && card.answer.trim())
      .map(card => ({
        user_id: user.id,
        question: card.question,
        answer: card.answer,
        image_url: card.imageUrl,
        set_id: setId,
      }));
    if (inserts.length > 0) {
      const { error } = await supabase.from("flashcards").insert(inserts);
      if (!error) {
        toast.success(t("added"));
        setShowCreateForm(false);
        setCategoryName("");
        setNewCards([{ question: "", answer: "", imgGenKeyword: "", imageUrl: undefined }]);
        fetchSetsAndCounts();
      } else {
        toast.error(t("errorAdd"));
      }
    }
    setSavingSet(false);
  }

  // Delete a set and all its cards
  async function handleDeleteSet(setId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Delete cards first (for RLS)
    await supabase.from("flashcards").delete().eq("user_id", user.id).eq("set_id", setId);
    // Delete the set
    const { error } = await supabase.from("flashcard_sets").delete().eq("user_id", user.id).eq("id", setId);
    if (!error) {
      setSets(sets.filter(s => s.id !== setId));
      const newCounts = { ...setCardCounts };
      delete newCounts[setId];
      setSetCardCounts(newCounts);
      toast.success(t("deleted"));
    } else {
      toast.error(t("errorAdd"));
    }
  }

  // Function to start a new study session
  async function startStudySession() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get cards that are due for review
    const now = new Date().toISOString();
    const { data: dueCards } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .eq("set_id", setId)
      .or(`next_review.is.null,next_review.lte.${now}`)
      .order("next_review", { ascending: true });

    if (dueCards && dueCards.length > 0) {
      setStudySessionCards(dueCards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setSessionStats({ correct: 0, total: dueCards.length });
    } else {
      toast.info(t("noCardsDue"));
    }
  }

  // Function to calculate next review date based on interval
  function calculateNextReview(interval: string): string {
    const now = new Date();
    let nextReview = new Date(now);

    switch (interval) {
      case '10m':
        nextReview.setMinutes(now.getMinutes() + 10);
        break;
      case '1d':
        nextReview.setDate(now.getDate() + 1);
        break;
      case '4d':
        nextReview.setDate(now.getDate() + 4);
        break;
      default:
        nextReview.setDate(now.getDate() + 1);
    }

    return nextReview.toISOString();
  }

  // Function to handle card response with interval
  async function handleCardResponse(cardId: string, interval: string) {
    const card = studySessionCards[currentCardIndex];
    if (!card) return;

    // Calculate next review date
    const nextReview = calculateNextReview(interval);

    // Update card in database
    await supabase
      .from("flashcards")
      .update({
        last_reviewed: new Date().toISOString(),
        next_review: nextReview,
      })
      .eq("id", cardId);

    // Update session stats
    setSessionStats(prev => ({
      correct: interval !== 'repeat' ? prev.correct + 1 : prev.correct,
      total: prev.total
    }));

    // Move to next card or end session
    if (currentCardIndex < studySessionCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setShowCompletionModal(true);
    }
  }

  // Function to restart the study session
  function restartStudySession() {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowCompletionModal(false);
    setSessionStats({ correct: 0, total: studySessionCards.length });
  }

  return (
    <div className="min-h-screen bg-[#18181b] text-white pb-32">
      <div className="max-w-2xl mx-auto py-12 space-y-8">
        {/* If no sets and not showing form, show centered card with white button */}
        {(!loadingSets && sets.length === 0 && !showCreateForm) && (
          <div className="flex flex-col items-center justify-center bg-[#23232a] rounded-2xl shadow-2xl p-12 mx-auto mt-24 max-w-xl">
            <div className="flex flex-col items-center mb-8">
              <div className="bg-white/10 rounded-full p-4 mb-4">
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#fff" fillOpacity="0.08"/><path d="M7 17h10M7 13h10M7 9h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-center">{t('createFirstSet')}</h2>
              <p className="text-md text-gray-300 text-center">{t('createFirstSetDesc')}</p>
            </div>
            <Button className="w-full bg-white text-black font-semibold rounded-xl py-3 text-lg shadow-md hover:bg-gray-100 transition" onClick={() => setShowCreateForm(true)}>
              + {t('createNewSet')}
            </Button>
          </div>
        )}
        {/* Always show the create set button at the bottom center if not showing form */}
        {sets.length > 0 && !showCreateForm && (
          <div className="flex justify-center mt-8">
            <Button className="bg-white text-black font-semibold rounded-xl py-3 px-8 text-lg shadow-md hover:bg-gray-100 transition" onClick={() => setShowCreateForm(true)}>
              + {t('createNewSet')}
            </Button>
          </div>
        )}
        {/* Set creation form */}
        {showCreateForm && (
          <div className="bg-[#23232a] rounded-2xl shadow-2xl p-8 mx-auto mt-12 max-w-xl">
            <h2 className="text-xl font-bold mb-6 text-center">{t('createSetTitle')}</h2>
            <div className="mb-6">
              <label className="block font-medium mb-2">{t('category')}</label>
              <Input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder={t('categoryPlaceholder')} className="border border-white/30 bg-[#23232a] text-white rounded-lg px-4 py-2 focus:border-blue-500" />
            </div>
            {newCards.map((card, idx) => (
              <div key={idx} className="mb-8 p-4 rounded-xl bg-[#23232a] border border-white/10 relative">
                <button 
                  onClick={() => handleRemoveCard(idx)}
                  className="absolute right-2 top-2 p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60 hover:text-white" />
                </button>
                <div className="mb-3">
                  <label className="block font-medium mb-1">{t('question')}</label>
                  <Textarea value={card.question} onChange={e => updateCardField(idx, 'question', e.target.value)} placeholder={t('questionPlaceholder')} className="border border-white/20 bg-[#23232a] text-white rounded-lg px-3 py-2" />
                </div>
                <div className="mb-3">
                  <label className="block font-medium mb-1">{t('answer')}</label>
                  <Textarea value={card.answer} onChange={e => updateCardField(idx, 'answer', e.target.value)} placeholder={t('answerPlaceholder')} className="border border-white/20 bg-[#23232a] text-white rounded-lg px-3 py-2" />
                </div>
                <div className="mb-3">
                  <label className="block font-medium mb-1">{t('imgKeyword')}</label>
                  <div className="flex gap-2 items-center">
                    <Input placeholder={t('imgKeywordPlaceholder')} value={card.imgGenKeyword} onChange={e => updateCardField(idx, 'imgGenKeyword', e.target.value)} className="border border-white/20 bg-[#23232a] text-white rounded-lg px-3 py-2 w-48" />
                    <Button type="button" onClick={() => handleImageGenerateForCard(idx)} disabled={imgGenLoading} className="bg-white/20 hover:bg-white/30 text-white">
                      {imgGenLoading ? t('loading') : t('generateImg')}
                    </Button>
                  </div>
                  {card.imageUrl && <Image src={card.imageUrl} alt="flashcard" width={80} height={80} className="rounded-lg mt-2" />}
                </div>
                <div className="flex gap-4 mt-4">
                  <Button type="button" onClick={handleAddCardToSet} className="bg-white text-black font-semibold rounded-lg px-6 py-2 shadow hover:bg-gray-100 transition">
                    {t('addCard')}
                  </Button>
                </div>
              </div>
            ))}
            {/* Save Set button only once, after all cards */}
            <div className="flex justify-center mt-8">
              <Button type="button" onClick={handleSaveSet} className="bg-blue-600 text-white font-bold rounded-2xl px-12 py-4 text-xl shadow-lg hover:bg-blue-700 transition min-w-[260px]" disabled={savingSet}>
                {savingSet ? t('saving') : t('saveSet')}
              </Button>
            </div>
          </div>
        )}
        {/* Flashcard Sets List */}
        {sets.length > 0 && !showCreateForm && (
          <div className="flex flex-wrap gap-8 mt-8">
            {sets.map(set => (
              <div
                key={set.id}
                className="bg-[#23232a] rounded-2xl shadow-lg p-6 min-w-[300px] max-w-xs flex flex-col justify-between relative cursor-pointer hover:bg-[#28283a] transition-colors"
                onClick={() => router.push(`/dashboard/flashcards/${set.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-bold text-white">{set.name}</span>
                  <button
                    className="ml-2 p-1 rounded-full hover:bg-red-600/20 transition-colors flex items-center justify-center"
                    title={t('deleteBtn')}
                    onClick={e => { e.stopPropagation(); handleDeleteSet(set.id); }}
                  >
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="text-red-500"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6h16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                <div className="flex items-center gap-4 text-gray-300 text-sm mt-auto">
                  <div className="flex items-center gap-1">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M16 17v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="8" y="3" width="13" height="13" rx="2" stroke="#aaa" strokeWidth="2"/></svg>
                    <span>{setCardCounts[set.id] || 0} {t('cardsCount') || 'карточек'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Study Session View */}
        {studySessionCards.length > 0 && !showCompletionModal && (
          <div className="flashcard-container">
            <div 
              className={`flashcard ${isFlipped ? 'flipped' : ''}`}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className="flashcard-front">
                <h3 className="text-xl font-bold mb-4">{t('question')}</h3>
                <p className="text-lg">{studySessionCards[currentCardIndex]?.question}</p>
                {studySessionCards[currentCardIndex]?.image_url && (
                  <Image
                    src={studySessionCards[currentCardIndex].image_url}
                    alt="Question"
                    width={200}
                    height={200}
                    className="mt-4 rounded-lg"
                  />
                )}
              </div>
              <div className="flashcard-back">
                <h3 className="text-xl font-bold mb-4">{t('answer')}</h3>
                <p className="text-lg">{studySessionCards[currentCardIndex]?.answer}</p>
              </div>
            </div>

            {isFlipped && (
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <Button
                  onClick={() => handleCardResponse(studySessionCards[currentCardIndex].id, 'repeat')}
                  className="bg-white text-black hover:bg-gray-100 px-6 py-3 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {t('Flashcards.repeat')}
                </Button>
                <Button
                  onClick={() => handleCardResponse(studySessionCards[currentCardIndex].id, '10m')}
                  className="bg-white text-black hover:bg-gray-100 px-6 py-3 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {t('Flashcards.repeatIn10m')}
                </Button>
                <Button
                  onClick={() => handleCardResponse(studySessionCards[currentCardIndex].id, '1d')}
                  className="bg-white text-black hover:bg-gray-100 px-6 py-3 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {t('Flashcards.repeatIn1d')}
                </Button>
                <Button
                  onClick={() => handleCardResponse(studySessionCards[currentCardIndex].id, '4d')}
                  className="bg-white text-black hover:bg-gray-100 px-6 py-3 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {t('Flashcards.repeatIn4d')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Completion Modal */}
        {showCompletionModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="text-2xl font-bold text-center mb-6">
                {t('Flashcards.sessionComplete')}
              </h2>
              <div className="text-center space-y-6">
                <p className="text-xl">
                  {t('Flashcards.score')}: {sessionStats.correct}/{sessionStats.total}
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={restartStudySession}
                    className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {t('Flashcards.repeat')}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCompletionModal(false);
                      setStudySessionCards([]);
                    }}
                    className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {t('Flashcards.finish')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .flashcard-container {
          position: relative;
          width: 100%;
          height: 300px;
          perspective: 1000px;
        }
        .flashcard {
          position: absolute;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.6s;
        }
        .flashcard-front,
        .flashcard-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
        }
        .flashcard-front {
          transform: rotateY(0deg);
        }
        .flashcard-back {
          transform: rotateY(180deg);
        }
        .flipped {
          transform: rotateY(180deg);
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .modal-content {
          background-color: #23232a;
          padding: 20px;
          border-radius: 20px;
          max-width: 400px;
          width: 100%;
          text-align: center;
        }
        .study-button {
          background-color: white;
          color: black;
          padding: 12px 24px;
          border-radius: 20px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .study-button:hover {
          background-color: #f0f0f0;
        }
      `}</style>
    </div>
  );
} 