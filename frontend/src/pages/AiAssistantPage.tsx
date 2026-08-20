// src/pages/AiAssistantPage.tsx
import React, { useState, useEffect } from 'react';
import { aiApi } from '../services/api';
import { useI18n } from '../utils/i18n';
import { AiRobot3D } from '../components/ai/AiRobot3D';

const TYPEWRITER_PHRASES = [
  "Eng mos taqdimotlarni ko'rsataman...",
  "3D modellarni interaktiv boshqarish bo'yicha yordam beraman...",
  "Slaydlar matni va nutq rejasini tayyorlayman...",
  "Sanoat xavfsizligi bo'yicha hisobot shakllantiraman...",
  "Taqdimotingizga mos mavzularni tavsiya qilaman...",
];

export const AiAssistantPage: React.FC = () => {
  const t = useI18n();

  const [activeTab, setActiveTab] = useState<'chat' | 'outline' | 'slides' | 'templates'>('chat');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Typewriter effect state
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<any[]>([]);

  // Hero prompt input
  const [heroPrompt, setHeroPrompt] = useState('');

  // Outline Form
  const [outlineTopic, setOutlineTopic] = useState('');
  const [outlineSlideCount, setOutlineSlideCount] = useState(8);
  const [outlineResult, setOutlineResult] = useState<any | null>(null);
  const [outlineLoading, setOutlineLoading] = useState(false);

  // Slides Form
  const [slideTopic, setSlideTopic] = useState('');
  const [slideCount, setSlideCount] = useState(6);
  const [slidesResult, setSlidesResult] = useState<any[]>([]);
  const [slidesLoading, setSlidesLoading] = useState(false);

  // Chat Form
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'assistant'; text: string; suggestions?: string[] }[]
  >([
    {
      role: 'assistant',
      text: "Assalomu alaykum! Men OKMK platformasi bo'yicha sun'iy intellekt maslahatchisiman. Taqdimot rejasini tuzish, 3D modellarni biriktirish yoki slayd matnlarini yozishda yordam berishga tayyorman.",
      suggestions: [
        "3D model bilan taqdimot qilish bo'yicha maslahat",
        "Sanoat xavfsizligi bo'yicha taqdimot rejasi",
        "MBF texnologik jarayoni hisoboti",
        "Slaydlarda matn va vizual taqsimoti",
      ],
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Typewriter animation loop
  useEffect(() => {
    const currentPhrase = TYPEWRITER_PHRASES[phraseIdx];
    const typingSpeed = isDeleting ? 30 : 60;

    const timer = setTimeout(() => {
      if (!isDeleting && typedText === currentPhrase) {
        // Pause before deleting
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && typedText === '') {
        setIsDeleting(false);
        setPhraseIdx((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
      } else {
        setTypedText(
          isDeleting
            ? currentPhrase.substring(0, typedText.length - 1)
            : currentPhrase.substring(0, typedText.length + 1),
        );
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, phraseIdx]);

  useEffect(() => {
    aiApi
      .getTemplates()
      .then((res) => {
        if (Array.isArray(res)) setTemplates(res);
      })
      .catch(() => {});
  }, []);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroPrompt.trim()) return;
    handleSendChat(heroPrompt.trim());
    setHeroPrompt('');
    setActiveTab('chat');
  };

  const handleGenerateOutline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outlineTopic.trim()) return;
    setOutlineLoading(true);
    try {
      const res = await aiApi.generateOutline({
        topic: outlineTopic,
        slideCount: outlineSlideCount,
        language: 'uz',
      });
      setOutlineResult(res);
    } catch {}
    finally {
      setOutlineLoading(false);
    }
  };

  const handleGenerateSlides = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideTopic.trim()) return;
    setSlidesLoading(true);
    try {
      const res = await aiApi.generateSlides({
        topic: slideTopic,
        slideCount,
        language: 'uz',
      });
      if (res?.slides) {
        setSlidesResult(res.slides);
      }
    } catch {}
    finally {
      setSlidesLoading(false);
    }
  };

  const handleSendChat = async (promptText?: string) => {
    const text = promptText || chatPrompt;
    if (!text.trim()) return;

    const userMsg = { role: 'user' as const, text: text.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatPrompt('');
    setChatLoading(true);

    try {
      const res = await aiApi.askAssistant({ prompt: text.trim() });
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.answer,
          suggestions: res.relatedSuggestions,
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "Kechirasiz, so'rovni bajarishda xatolik yuz berdi. Qayta urinib ko'ring.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="page active" id="page-ai-assistant">
      {/* 1. CAREER EDU STYLE AI HERO & 3D ROBOT MASCOT */}
      <div
        className="ai-hero-card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 40px -12px rgba(0, 0, 0, 0.5)',
          borderRadius: 24,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Glow effect behind the robot */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(16,185,129,0.05) 50%, transparent 100%)',
          pointerEvents: 'none',
          borderRadius: '50%',
        }} />

        <div className="ai-hero-left" style={{ position: 'relative', zIndex: 1 }}>
          <div className="ai-hero-title">
            Taqdimotingizni <span>hozirdan</span> boshlang!
          </div>
          <div className="ai-hero-sub" style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
            OKMK sun'iy intellekt maslahatchisi slaydlar tayyorlash, 3D modellarni tushuntirish va sanoat xavfsizligi bo'yicha taqdimot rejasini tuzishda ko'maklashadi.
          </div>

          {/* Quick Search / Ask Bar */}
          <form onSubmit={handleHeroSubmit} style={{ display: 'flex', gap: 8, width: '100%' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Masalan: MBF texnologik xavfsizlik taqdimoti..."
              value={heroPrompt}
              onChange={(e) => setHeroPrompt(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Qidirish
            </button>
          </form>

          {/* Quick Suggestion Chips */}
          <div className="ai-quick-suggestions">
            {[
              '3D modelli taqdimot',
              'Sanoat xavfsizligi qoidalari',
              'MBF flotatsiya hisoboti',
              'Slaydlar rejasi',
            ].map((sug) => (
              <button
                key={sug}
                type="button"
                className="ai-sug-chip"
                onClick={() => {
                  handleSendChat(sug);
                  setActiveTab('chat');
                }}
              >
                <span>💡 {sug}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3D Interactive Robot Mascot with Floating Speech Bubble & Sound Toggle */}
        <div className="ai-robot-panel" style={{ height: 260 }}>
          {/* Animated Thought / Speech Bubble */}
          <div className="ai-speech-bubble">
            <span>{typedText}</span>
            <span style={{ animation: 'blink 1s infinite', marginLeft: 2, fontWeight: 300 }}>|</span>
          </div>

          {/* Interactive 3D Robot Canvas */}
          <div style={{ width: 190, height: 240, marginLeft: 'auto', position: 'relative' }}>
            <AiRobot3D isTalking={chatLoading || outlineLoading || slidesLoading} />
          </div>

          {/* Sound / Mute Toggle Button */}
          <button
            type="button"
            className="btn-icon"
            onClick={() => setSoundEnabled((prev) => !prev)}
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              width: 32,
              height: 32,
              borderRadius: 'var(--r-md)',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              color: soundEnabled ? 'var(--blue)' : 'var(--text-muted)',
              zIndex: 10,
            }}
            title={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
          >
            {soundEnabled ? (
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M7 3L3.5 6H1v4h2.5L7 13V3z" />
                <path d="M10 5.5a3.5 3.5 0 0 1 0 5" strokeLinecap="round" />
                <path d="M12 3.5a6.5 6.5 0 0 1 0 9" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M7 3L3.5 6H1v4h2.5L7 13V3z" />
                <path d="M10.5 6l3 3M13.5 6l-3 3" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 2. TAB CONTROLS */}
      <div className="filter-bar admin-filter-bar" style={{ marginBottom: 18 }}>
        <button
          type="button"
          className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setActiveTab('chat')}
        >
          AI Chat Maslahatchi
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'outline' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setActiveTab('outline')}
        >
          Reja generatsiyasi
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'slides' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setActiveTab('slides')}
        >
          Slaydlar matni
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'templates' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setActiveTab('templates')}
        >
          Tayyor shablonlar
        </button>
      </div>

      {/* 3. ACTIVE TAB CONTENT */}
      <div>
        {/* TAB 1: AI CHAT */}
        {activeTab === 'chat' && (
          <div className="card" style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: 480 }}>
            <div className="card-header">
              <div>
                <div className="card-title">AI Maslahatchi bilan suhbat</div>
                <div className="card-subtitle">Taqdimot bo'yicha istalgan savolingizni bering</div>
              </div>
            </div>

            <div className="ai-chat-thread">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={msg.role === 'user' ? 'ai-bubble-user' : 'ai-bubble-bot'}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          className="ai-sug-chip"
                          onClick={() => handleSendChat(sug)}
                        >
                          {sug} →
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="ai-bubble-bot" style={{ color: 'var(--text-muted)' }}>
                  AI javob tayyorlamoqda...
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}
            >
              <input
                type="text"
                className="form-input"
                placeholder="Savol yoki vazifani yozing..."
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={chatLoading}>
                Yuborish
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: OUTLINE */}
        {activeTab === 'outline' && (
          <div className="main-grid">
            <div className="card" style={{ gridColumn: 'span 5' }}>
              <div className="card-header">
                <div>
                  <div className="card-title">Reja yaratish</div>
                  <div className="card-subtitle">Mavzu bo'yicha ketma-ket slaydlar rejasi</div>
                </div>
              </div>
              <div className="card-body" style={{ padding: 16 }}>
                <form onSubmit={handleGenerateOutline}>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Taqdimot mavzusi</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Masalan: MBF texnologik xavfsizlik qoidalari"
                      value={outlineTopic}
                      onChange={(e) => setOutlineTopic(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Slaydlar soni</label>
                    <input
                      type="number"
                      className="form-input"
                      min={3}
                      max={20}
                      value={outlineSlideCount}
                      onChange={(e) => setOutlineSlideCount(Number(e.target.value))}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={outlineLoading}
                    style={{ width: '100%' }}
                  >
                    {outlineLoading ? t('Loading') : "Rejani shakllantirish"}
                  </button>
                </form>
              </div>
            </div>

            <div className="card" style={{ gridColumn: 'span 7' }}>
              <div className="card-header">
                <div>
                  <div className="card-title">Natija</div>
                  <div className="card-subtitle">Tavsiya etilgan taqdimot strukturasi</div>
                </div>
              </div>
              <div className="card-body" style={{ padding: 16 }}>
                {outlineResult ? (
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--text-pri)' }}>
                      {outlineResult.title}
                    </div>
                    {outlineResult.outline?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--r-md)',
                          background: 'var(--bg-raised)',
                          border: '1px solid var(--border)',
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--blue)' }}>
                          Slayd {idx + 1}: {item.title || item}
                        </div>
                        {item.description && (
                          <div style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 2 }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">Mavzuni kiritib, tugmani bosing</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SLIDES */}
        {activeTab === 'slides' && (
          <div className="main-grid">
            <div className="card" style={{ gridColumn: 'span 5' }}>
              <div className="card-header">
                <div>
                  <div className="card-title">Slaydlar generatsiyasi</div>
                  <div className="card-subtitle">Har bir slayd matni va kontentini tayyorlash</div>
                </div>
              </div>
              <div className="card-body" style={{ padding: 16 }}>
                <form onSubmit={handleGenerateSlides}>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Slayd mavzusi</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Masalan: Raqamlashtirish loyihalari 2026"
                      value={slideTopic}
                      onChange={(e) => setSlideTopic(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Slaydlar soni</label>
                    <input
                      type="number"
                      className="form-input"
                      min={3}
                      max={12}
                      value={slideCount}
                      onChange={(e) => setSlideCount(Number(e.target.value))}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={slidesLoading}
                    style={{ width: '100%' }}
                  >
                    {slidesLoading ? t('Loading') : "Slaydlarni tayyorlash"}
                  </button>
                </form>
              </div>
            </div>

            <div className="card" style={{ gridColumn: 'span 7' }}>
              <div className="card-header">
                <div>
                  <div className="card-title">Tayyorlangan slaydlar</div>
                  <div className="card-subtitle">Matn va ma'ruza uchun tezislar</div>
                </div>
              </div>
              <div className="card-body" style={{ padding: 16 }}>
                {slidesResult.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {slidesResult.map((slide, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--r-md)',
                          background: 'var(--bg-raised)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-pri)', marginBottom: 4 }}>
                          {idx + 1}. {slide.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.4 }}>
                          {slide.content}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">Slaydlar hali shakllantirilmadi</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TEMPLATES */}
        {activeTab === 'templates' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {templates.map((tpl) => (
              <div key={tpl.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-header">
                  <div className="card-title" style={{ fontSize: 13 }}>{tpl.name}</div>
                  <span className="badge badge-blue">{tpl.category || 'Shablon'}</span>
                </div>
                <div className="card-body" style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-sec)', margin: 0, marginBottom: 12 }}>
                    {tpl.description}
                  </p>
                  <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%' }}
                      onClick={() => {
                        setOutlineTopic(tpl.name);
                        setActiveTab('outline');
                      }}
                    >
                      Ushbu shablondan foydalanish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAssistantPage;
