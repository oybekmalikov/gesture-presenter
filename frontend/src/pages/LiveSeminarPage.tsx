// src/pages/LiveSeminarPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { liveApi, seminarsApi, filesApi, getWsBaseUrl } from '../services/api';
import { Seminar, SeminarFile } from '../types';
import { useAuth } from '../context/AuthContext';
import { ThreeDViewer } from '../components/ThreeDViewer';
import { InteractivePresentation } from '../components/InteractivePresentation';
import { useI18n } from '../utils/i18n';

export const LiveSeminarPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, isSuperadmin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const t = useI18n();

  const [seminar, setSeminar] = useState<Seminar | null>(null);
  const [activeFile, setActiveFile] = useState<SeminarFile | null>(null);
  const [viewerCount, setViewerCount] = useState<number>(1);
  const [messages, setMessages] = useState<
    { id: string; username: string; message: string; createdAt: string }[]
  >([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState<{ id: string; reaction: string }[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const [isPresenter, setIsPresenter] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Load seminar metadata
    seminarsApi
      .findOne(id)
      .then((sem) => {
        setSeminar(sem);
        const presenterCheck =
          isAuthenticated &&
          (sem.authorId === user?.id || isAdmin || isSuperadmin);
        setIsPresenter(Boolean(presenterCheck));

        if (sem.files && sem.files.length > 0) {
          setActiveFile(sem.files[0]);
        }
      })
      .catch(() => {});

    // Connect to /live WebSocket Gateway
    const socketUrl = getWsBaseUrl();
    const socket = io(`${socketUrl}/live`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', {
        seminarId: id,
        userId: user?.id,
        username: user?.fio || user?.username || 'Mehmon',
        avatarUrl: user?.avatarUrl,
        role: user?.role,
      });
    });

    socket.on('viewer_count_updated', (data: { viewerCount: number }) => {
      setViewerCount(data.viewerCount || 1);
    });

    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('reaction_received', (data) => {
      const reactionId = `r_${Date.now()}_${Math.random()}`;
      setReactions((prev) => [...prev, { id: reactionId, reaction: data.reaction }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reactionId));
      }, 2500);
    });

    socket.on('session_ended', () => {
      alert("Jonli seminar ma'ruzachi tomonidan yakunlandi.");
      navigate(`/seminars/${id}`);
    });

    return () => {
      socket.emit('leave_room', { seminarId: id });
      socket.disconnect();
    };
  }, [id, isAuthenticated, user?.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current || !id) return;

    socketRef.current.emit('send_message', {
      seminarId: id,
      userId: user?.id || 'guest',
      username: user?.fio || user?.username || 'Ishtirokchi',
      avatarUrl: user?.avatarUrl,
      message: chatInput.trim(),
    });

    setChatInput('');
  };

  const handleSendReaction = (emoji: string) => {
    if (!socketRef.current || !id) return;
    socketRef.current.emit('send_reaction', {
      seminarId: id,
      reaction: emoji,
    });
  };

  const handleEndLive = async () => {
    if (!id) return;
    if (window.confirm("Jonli efirni yakunlamoqchimisiz?")) {
      setEnding(true);
      try {
        await liveApi.endSession(id);
        navigate(`/seminars/${id}`);
      } catch {}
      finally {
        setEnding(false);
      }
    }
  };

  const is3DActive =
    activeFile?.fileType === '3d' ||
    activeFile?.originalName?.match(/\.(step|stp|glb|gltf)$/i);

  return (
    <div className="page active" id="page-live-session">
      {/* Top Header */}
      <div className="page-hd">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
              {t('Live Now')}
            </span>
            <span className="badge badge-slate" style={{ fontFamily: 'var(--f-mono)' }}>
              👥 {viewerCount} ishtirokchi
            </span>
          </div>
          <div className="pg-title">{seminar?.title || "Jonli seminar"}</div>
          <div className="pg-sub">
            {seminar?.author?.fio} · {seminar?.department?.name || 'OKMK'}
          </div>
        </div>

        <div className="card-actions">
          {isPresenter && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={ending}
              onClick={handleEndLive}
            >
              {ending ? t('Loading') : "Efirni yakunlash"}
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(`/seminars/${id}`)}
          >
            Chiqish
          </button>
        </div>
      </div>

      <div className="main-grid">
        {/* Main Live Presentation View */}
        <div className="card" style={{ gridColumn: 'span 8', minHeight: 520, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Jonli ko'rsatuv maydoni</div>
              <div className="card-subtitle">{activeFile ? activeFile.originalName : 'Taqdimot'}</div>
            </div>
            {/* Quick Reactions */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['👍', '👏', '🔥', '💡'].map((em) => (
                <button
                  key={em}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 14, padding: '4px 8px' }}
                  onClick={() => handleSendReaction(em)}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="card-body" style={{ flex: 1, position: 'relative', minHeight: 440, background: '#0b0f19' }}>
            {/* Flying Reactions */}
            {reactions.map((r) => (
              <span
                key={r.id}
                style={{
                  position: 'absolute',
                  bottom: 30,
                  right: Math.random() * 80 + 20,
                  fontSize: 28,
                  animation: 'floatUp 2.5s ease-out forwards',
                  zIndex: 20,
                  pointerEvents: 'none',
                }}
              >
                {r.reaction}
              </span>
            ))}

            {activeFile ? (
              is3DActive ? (
                <ThreeDViewer
                  modelUrl={filesApi.getViewUrl(activeFile.id)}
                  modelName={activeFile.originalName}
                  onBack={() => {}}
                />
              ) : (
                <InteractivePresentation
                  fileUrl={filesApi.getViewUrl(activeFile.id)}
                  fileName={activeFile.originalName}
                />
              )
            ) : (
              <div className="empty-state" style={{ color: '#8b949e', paddingTop: 100 }}>
                Hozirda faol fayl ko'rsatilmayapti
              </div>
            )}
          </div>
        </div>

        {/* Live Chat Panel */}
        <div className="card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', height: 520 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Jonli Chat</div>
              <div className="card-subtitle">Ishtirokchilar savol-javobi</div>
            </div>
          </div>

          <div
            className="card-body"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {messages.length === 0 ? (
              <div className="empty-state" style={{ margin: 'auto' }}>
                Xabarlar hali yo'q. Birinchi savolingizni bering!
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={m.id || idx}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)' }}>
                      {m.username}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--f-mono)' }}>
                      {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-pri)', lineHeight: 1.35 }}>
                    {m.message}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat input form */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: 10,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              type="text"
              className="form-input"
              placeholder="Xabar yozing..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Yuborish
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LiveSeminarPage;
