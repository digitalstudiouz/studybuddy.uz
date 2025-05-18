"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import '@/app/[locale]/globals.css';


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function FlashcardSetPage() {
  const t = useTranslations("Flashcards");
  const params = useParams();
  const router = useRouter();
  const setId = params.setId as string;
  const [cards, setCards] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  useEffect(() => {
    async function fetchSetAndCards() {
      setLoading(true);
      const { data: cardsData } = await supabase.from("flashcards").select("*").eq("set_id", setId).order("created_at", { ascending: true });
      setCards(cardsData || []);
      setLoading(false);
    }
    if (setId) fetchSetAndCards();
  }, [setId]);

  if (loading) return <div className="text-center text-white py-32">Loading...</div>;
  if (!cards.length) return <div className="text-center text-white py-32">{t("noCards") || "No cards in this set."}</div>;

  const card = cards[current];


  function handleRepeat(type: 'wrong' | 'good' | 'easy') {
    setShowAnswer(false);
    let newCorrect = correctCount;
    let newIncorrect = incorrectCount;
    if (type === 'wrong') {
      newIncorrect += 1;
      setIncorrectCount(newIncorrect);
    } else {
      newCorrect += 1;
      setCorrectCount(newCorrect);
    }
    if (current < cards.length - 1) {
      setCurrent(current + 1);
    } else {
      saveStudySession(newCorrect, newIncorrect);
      setShowModal(true);
    }
  }
  
   async function saveStudySession(correct: number, incorrect: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('flashcard_study_sessions').insert({
      user_id: user.id,
      set_id: setId,
      correct,
      incorrect,
    });
  }

  function handleRestart() {
    setCurrent(0);
    setShowAnswer(false);
    setShowModal(false);
    setCorrectCount(0);
    setIncorrectCount(0);
  }

  function handleFinish() {
    router.push('/dashboard/flashcards');
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-full text-center text-white text-lg font-medium mt-4 mb-2">
        {current + 1} / {cards.length} {t("cardsCount") || "карточек"}
      </div>
      <div className="w-full max-w-5xl flex-1 flex flex-col items-center justify-center">
        <div
          className="w-full h-[400px] md:h-[420px] flex items-center justify-center bg-[#23232a] rounded-2xl shadow-lg mb-8 cursor-pointer select-none"
          onClick={() => setShowAnswer((prev) => !prev)}
        >
          <span className="text-5xl font-bold text-white">
            {showAnswer ? card.answer : card.question}
          </span>
          {showAnswer && card.image_url && (
            <img src={card.image_url} alt="card" className="ml-8 rounded-lg max-h-40 max-w-xs" />
          )}
        </div>
        <div className="w-full max-w-5xl flex gap-4 justify-between mt-8 mb-8">
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xl font-bold py-6 rounded-xl" onClick={() => handleRepeat("wrong")}>{t("repeat") || "Повторить"}<div className="text-base font-normal mt-1">{t("repeatIn10m") || "Повторение через 10m"}</div></Button>
          <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-6 rounded-xl" onClick={() => handleRepeat("good")}>{t("good") || "Хорошо"}<div className="text-base font-normal mt-1">{t("repeatIn1d") || "Повторение через 1d"}</div></Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-6 rounded-xl" onClick={() => handleRepeat("easy")}>{t("easy") || "Легко"}<div className="text-base font-normal mt-1">{t("repeatIn4d") || "Повторение через 4d"}</div></Button>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-[#23232a] rounded-2xl p-10 max-w-lg w-full flex flex-col items-center">
            <h2 className="text-4xl font-bold text-white mb-8">Повторение завершено!</h2>
            <div className="flex w-full justify-around mb-8">
              <div className="flex flex-col items-center">
                <span className="text-lg text-white/80 mb-2">Правильно</span>
                <span className="text-5xl font-bold text-white">{correctCount}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg text-white/80 mb-2">Неправильно</span>
                <span className="text-5xl font-bold text-white">{incorrectCount}</span>
              </div>
            </div>
            <Button className="w-full bg-white text-black text-xl font-bold py-4 rounded-xl mb-4" onClick={handleRestart}>Повторить карточки</Button>
            <Button className="w-full bg-white text-black text-xl font-bold py-4 rounded-xl" onClick={handleFinish}>Завершить</Button>
          </div>
        </div>
      )}
    </div>
  );
} 