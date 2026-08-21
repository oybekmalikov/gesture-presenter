import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { liveApi, seminarsApi, filesApi, getWsBaseUrl, getWsPath } from '../services/api';
import { Seminar, SeminarFile } from '../types';
import { useAuth } from '../context/AuthContext';
import { ThreeDViewer } from '../components/ThreeDViewer';
import { InteractivePresentation } from '../components/InteractivePresentation';
import { HandCameraWidget } from '../components/HandCameraWidget';
import { GestureHUD } from '../components/GestureHUD';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { useHandTracking } from '../hooks/useHandTracking';
import { usePresentationGestures } from '../hooks/usePresentationGestures';
import { useI18n } from '../utils/i18n';
import { Ban, Hand, Images, MessageCircleMore, Monitor, Send, Star, Users, Video, View, Volume2, VolumeOff } from 'lucide-react';

interface Participant {
  socketId: string;
  userId?: string;
  username: string;
  avatarUrl?: string;
  role?: string;
  isPresenter: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  stream?: MediaStream;
}

interface ChatMessage {
  id: string;
  userId?: string;
  username: string;
  avatarUrl?: string;
  message: string;
  createdAt: string;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const RecordingBadge = memo(({ isRecording, onTimerUpdate }: { isRecording: boolean; onTimerUpdate?: (sec: number) => void }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRecording) {
      setSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        onTimerUpdate?.(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording, onTimerUpdate]);

  if (!isRecording) return null;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid #ef4444',
        color: '#ef4444',
        fontFamily: 'var(--f-mono)',
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: '#ef4444',
          animation: 'pulse 1.2s infinite',
        }}
      />
      REC {timeStr}
    </div>
  );
});

const LiveChatPanel = memo(
  ({
    messages,
    onSendMessage,
    onClose,
  }: {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    onClose: () => void;
  }) => {
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;
      onSendMessage(input.trim());
      setInput('');
    };

    return (
      <aside
        style={{
          width: 320,
          borderLeft: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-pri)' }}>Jonli Chat</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Savol-javob va fikrlar</div>
          </div>
          <button type="button" className="btn-icon" style={{ width: 24, height: 24 }} onClick={onClose}>
            ✕
          </button>
        </div>

        <div
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
            <div className="empty-state" style={{ margin: 'auto', fontSize: 12 }}>
              Xabarlar hali yo'q. Birinchi bo'lib savol bering!
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)' }}>
                    {m.username}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--f-mono)' }}>
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      : ''}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-pri)', lineHeight: 1.35 }}>
                  {m.message}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            <Send />
          </button>
        </form>
      </aside>
    );
  },
);

export const LiveSeminarPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, isSuperadmin, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const t = useI18n();
  const [seminar, setSeminar] = useState<Seminar | null>(null);
  const [activeFile, setActiveFile] = useState<SeminarFile | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(1);
  const [viewerCount, setViewerCount] = useState<number>(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<{ id: string; reaction: string }[]>([]);
  const [isPresenter, setIsPresenter] = useState(false);
  const [ending, setEnding] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<'stage' | 'gallery'>('stage');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const socketRef = useRef<Socket | null>(null);
  const [laserPointer, setLaserPointer] = useState<{ x: number; y: number; visible: boolean } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingSecondsRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [gestureActive, setGestureActive] = useState(false);
  const [threeDRotation, setThreeDRotation] = useState<[number, number]>([0, 0]);
  const [threeDScale, setThreeDScale] = useState<number>(1);
  const [threeDExploded, setThreeDExploded] = useState<boolean>(false);
  const handTracking = useHandTracking();
  const gestureFrame = usePresentationGestures(handTracking.hands, gestureActive);

  useEffect(() => {
    let active = true;
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });

        if (active) {
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (active) {
            setLocalStream(audioStream);
            setVideoEnabled(false);
          }
        } catch {
          if (active) {
            setAudioEnabled(false);
            setVideoEnabled(false);
          }
        }
      }
    };

    startMedia();

    return () => {
      active = false;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, videoEnabled]);

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !audioEnabled;
      });
      const nextState = !audioEnabled;
      setAudioEnabled(nextState);
      socketRef.current?.emit('toggle_media', {
        seminarId: id,
        audioEnabled: nextState,
        videoEnabled,
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
      const nextState = !videoEnabled;
      setVideoEnabled(nextState);
      socketRef.current?.emit('toggle_media', {
        seminarId: id,
        audioEnabled,
        videoEnabled: nextState,
      });
    }
  };

  useEffect(() => {
    if (!gestureActive || !isPresenter || !id) return;

    if (gestureFrame.action.type === 'next-slide') {
      setActiveSlideIndex((prev) => {
        const next = prev + 1;
        socketRef.current?.emit('sync_slide', {
          seminarId: id,
          fileId: activeFile?.id || '',
          slideIndex: next,
        });
        return next;
      });
    } else if (gestureFrame.action.type === 'prev-slide') {
      setActiveSlideIndex((prev) => {
        const next = Math.max(1, prev - 1);
        socketRef.current?.emit('sync_slide', {
          seminarId: id,
          fileId: activeFile?.id || '',
          slideIndex: next,
        });
        return next;
      });
    } else if (gestureFrame.action.type === 'point') {
      const lp = { x: gestureFrame.action.x, y: gestureFrame.action.y, visible: true };
      setLaserPointer(lp);
      socketRef.current?.emit('laser_pointer', {
        seminarId: id,
        ...lp,
      });
    } else if (gestureFrame.action.type === 'point-end' && laserPointer?.visible) {
      const lp = { x: 0, y: 0, visible: false };
      setLaserPointer(lp);
      socketRef.current?.emit('laser_pointer', {
        seminarId: id,
        ...lp,
      });
    }
  }, [gestureFrame.action, gestureActive, isPresenter, id, activeFile?.id]);

  const toggleGesture = () => {
    if (!gestureActive) {
      handTracking.start();
      setGestureActive(true);
    } else {
      handTracking.stop();
      setGestureActive(false);
      setLaserPointer(null);
    }
  };

  const createPeerConnection = useCallback(
    (targetSocketId: string, isInitiator: boolean) => {
      if (peerConnections.current.has(targetSocketId)) {
        peerConnections.current.get(targetSocketId)!.close();
        peerConnections.current.delete(targetSocketId);
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnections.current.set(targetSocketId, pc);

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice_candidate', {
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setParticipants((prev) =>
          prev.map((p) => (p.socketId === targetSocketId ? { ...p, stream: remoteStream } : p)),
        );
      };

      if (isInitiator) {
        pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            socketRef.current?.emit('signal_offer', {
              targetSocketId,
              offer: pc.localDescription,
            });
          })
          .catch(() => { });
      }

      return pc;
    },
    [localStream],
  );

  useEffect(() => {
    if (!id) return;

    let isAuthorUser = false;

    seminarsApi
      .findOne(id)
      .then((sem) => {
        setSeminar(sem);
        isAuthorUser = Boolean(
          isAuthenticated && user?.id && (sem.authorId === user?.id || sem.author?.id === user?.id),
        );
        setIsPresenter(isAuthorUser);

        if (sem.files && sem.files.length > 0) {
          const defaultF =
            sem.files.find((f) => f.fileType === 'pdf' || f.fileType === '3d' || f.fileType === 'presentation') ||
            sem.files[0];
          setActiveFile(defaultF);
        }

        if (isAuthorUser) {
          startLiveRecording();
        }
      })
      .catch(() => { });

    const socketUrl = getWsBaseUrl();
    const socket = io(`${socketUrl}/live`, {
      path: getWsPath(),
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
        role: user?.role || 'guest',
        isPresenter: isAuthorUser,
        audioEnabled,
        videoEnabled,
      });
    });

    socket.on(
      'room_participants',
      (data: {
        participants: Participant[];
        currentSlide: any;
        current3dState: any;
        activeFileId: string | null;
      }) => {
        setParticipants(data.participants || []);
        if (data.activeFileId && seminar?.files) {
          const f = seminar.files.find((file) => file.id === data.activeFileId);
          if (f) setActiveFile(f);
        }
        if (data.currentSlide?.slideIndex !== undefined) {
          setActiveSlideIndex(data.currentSlide.slideIndex);
        }
        data.participants.forEach((remoteUser) => {
          createPeerConnection(remoteUser.socketId, true);
        });
      },
    );

    socket.on('user_joined', (newParticipant: Participant) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === newParticipant.socketId)) return prev;
        return [...prev, newParticipant];
      });
      createPeerConnection(newParticipant.socketId, false);
    });

    socket.on('user_left', (data: { socketId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.socketId !== data.socketId));
      if (peerConnections.current.has(data.socketId)) {
        peerConnections.current.get(data.socketId)?.close();
        peerConnections.current.delete(data.socketId);
      }
    });

    socket.on('viewer_count_updated', (data: { viewerCount: number }) => {
      setViewerCount(data.viewerCount || 1);
    });

    socket.on('signal_offer', async (data: { callerSocketId: string; offer: RTCSessionDescriptionInit }) => {
      const pc = createPeerConnection(data.callerSocketId, false);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal_answer', {
          targetSocketId: data.callerSocketId,
          answer: pc.localDescription,
        });
      } catch { }
    });

    socket.on('signal_answer', async (data: { callerSocketId: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnections.current.get(data.callerSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch { }
      }
    });

    socket.on('ice_candidate', async (data: { callerSocketId: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerConnections.current.get(data.callerSocketId);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch { }
      }
    });

    socket.on('user_media_changed', (data: { socketId: string; audioEnabled: boolean; videoEnabled: boolean }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === data.socketId
            ? { ...p, audioEnabled: data.audioEnabled, videoEnabled: data.videoEnabled }
            : p,
        ),
      );
    });

    socket.on('file_changed', (data: { fileId: string }) => {
      if (seminar?.files) {
        const f = seminar.files.find((file) => file.id === data.fileId);
        if (f) {
          setActiveFile(f);
          setActiveSlideIndex(1);
        }
      }
    });

    socket.on('slide_changed', (data: { slideIndex: number }) => {
      setActiveSlideIndex(data.slideIndex || 1);
    });

    socket.on('3d_state_changed', (data: { rotation?: [number, number]; scale?: number; exploded?: boolean }) => {
      if (data.rotation) setThreeDRotation(data.rotation);
      if (data.scale !== undefined) setThreeDScale(data.scale);
      if (data.exploded !== undefined) setThreeDExploded(data.exploded);
    });

    socket.on('laser_pointer_moved', (data: { x: number; y: number; visible: boolean }) => {
      setLaserPointer(data);
    });

    socket.on('new_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('reaction_received', (data: { reaction: string }) => {
      const reactionId = `r_${Date.now()}_${Math.random()}`;
      setReactions((prev) => [...prev, { id: reactionId, reaction: data.reaction }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reactionId));
      }, 2500);
    });

    socket.on('session_ended', () => {
      toast.info("Jonli seminar ma'ruzachi tomonidan yakunlandi.");
      navigate(`/seminars/${id}`);
    });

    return () => {
      socket.emit('leave_room', { seminarId: id });
      socket.disconnect();
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      handTracking.stop();
    };
  }, [id, isAuthenticated, user?.id, createPeerConnection]);

  const startLiveRecording = () => {
    if (!window.MediaRecorder || !localStream) return;
    try {
      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      const recorder = new MediaRecorder(
        localStream,
        MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined,
      );

      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.start(3000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch { }
  };

  const stopAndUploadRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      await new Promise((resolve) => setTimeout(resolve, 600));

      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      if (blob.size > 1000 && id) {
        const file = new File(
          [blob],
          `recording_live_${seminar?.title ? seminar.title.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_') : 'seminar'}_${Date.now()}.webm`,
          { type: 'video/webm' },
        );

        try {
          await filesApi.uploadFile(id, file);
          await liveApi.addRecording(id, {
            filePath: file.name,
            durationSeconds: recordingSecondsRef.current,
            size: blob.size,
          });
        } catch { }
      }
    }
  };

  const handleAuthorSelectFile = (file: SeminarFile) => {
    if (!isPresenter || !id) return;
    setActiveFile(file);
    setActiveSlideIndex(1);
    socketRef.current?.emit('file_changed', {
      seminarId: id,
      fileId: file.id,
      fileType: file.fileType,
    });
  };

  const handleAuthorSlideChange = (newIndex: number) => {
    if (!isPresenter || !id || !activeFile) return;
    setActiveSlideIndex(newIndex);
    socketRef.current?.emit('sync_slide', {
      seminarId: id,
      fileId: activeFile.id,
      slideIndex: newIndex,
    });
  };

  const handleAuthor3DRotation = (rotation: [number, number]) => {
    setThreeDRotation(rotation);
    if (socketRef.current && id) {
      socketRef.current.emit('sync_3d_state', {
        seminarId: id,
        rotation,
        scale: threeDScale,
        exploded: threeDExploded,
      });
    }
  };

  const handleAuthor3DScale = (scale: number) => {
    setThreeDScale(scale);
    if (socketRef.current && id) {
      socketRef.current.emit('sync_3d_state', {
        seminarId: id,
        rotation: threeDRotation,
        scale,
        exploded: threeDExploded,
      });
    }
  };

  const handleAuthor3DExplode = (exploded: boolean) => {
    setThreeDExploded(exploded);
    if (socketRef.current && id) {
      socketRef.current.emit('sync_3d_state', {
        seminarId: id,
        rotation: threeDRotation,
        scale: threeDScale,
        exploded,
      });
    }
  };

  const handleSendMessage = useCallback(
    (text: string) => {
      if (!socketRef.current || !id) return;
      socketRef.current.emit('send_message', {
        seminarId: id,
        userId: user?.id || 'guest',
        username: user?.fio || user?.username || 'Ishtirokchi',
        avatarUrl: user?.avatarUrl,
        message: text,
      });
    },
    [id, user],
  );

  const handleSendReaction = (emoji: string) => {
    if (!socketRef.current || !id) return;
    socketRef.current.emit('send_reaction', {
      seminarId: id,
      reaction: emoji,
    });
  };

  const handleEndLiveConfirm = async () => {
    if (!id) return;
    setEnding(true);
    try {
      await stopAndUploadRecording();
      socketRef.current?.emit('end_live_session', { seminarId: id });
      await liveApi.endSession(id);
      toast.success("Jonli efir muvaffaqiyatli yakunlandi va yozuv saqlandi");
      navigate(`/seminars/${id}`);
    } catch {
      navigate(`/seminars/${id}`);
    } finally {
      setEnding(false);
      setShowEndConfirm(false);
    }
  };

  const handleEndLive = () => {
    setShowEndConfirm(true);
  };

  const is3DActive =
    activeFile?.fileType === '3d' || activeFile?.originalName?.match(/\.(step|stp|glb|gltf)$/i);

  return (
    <div
      className="page active"
      id="page-live-session"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 65px)',
        overflow: 'hidden',
        background: '#070b14',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          background: 'rgba(15, 23, 42, 0.9)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 20,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              fontFamily: 'var(--f-mono)',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#ef4444',
                animation: 'pulse 1.2s infinite',
              }}
            />
            {t('Live Now')}
          </div>

          <RecordingBadge
            isRecording={isRecording}
            onTimerUpdate={(s) => {
              recordingSecondsRef.current = s;
            }}
          />

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{seminar?.title || 'Jonli seminar'}</span>
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: isPresenter ? 'var(--blue)' : 'var(--bg-raised)',
                  color: '#fff',
                  fontFamily: 'var(--f-ui)',
                }}
              >
                {isPresenter ? `${<Star />} Ma'ruzachi` : `${<View />} Tinglovchi`}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {seminar?.author?.fio} · {seminar?.department?.name || 'OKMK'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isPresenter && (
            <button
              type="button"
              className={`btn btn-sm ${gestureActive ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                fontSize: 11.5,
                background: gestureActive ? 'linear-gradient(135deg, #10b981, #059669)' : undefined,
                borderColor: gestureActive ? '#059669' : undefined,
              }}
              onClick={toggleGesture}
            >
              <span><Hand /></span>
              <span>{gestureActive ? 'AI Gesture Faol' : 'AI Gesture Yoqish'}</span>
            </button>
          )}

          <div style={{ display: 'flex', background: 'var(--bg-raised)', borderRadius: 8, padding: 2 }}>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'stage' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 10px', fontSize: 11 }}
              onClick={() => setViewMode('stage')}
            >
              <Monitor /> Taqdimot
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'gallery' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 10px', fontSize: 11 }}
              onClick={() => setViewMode('gallery')}
            >
              <Images /> Galereya ({participants.length + 1})
            </button>
          </div>

          {isPresenter ? (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={ending}
              onClick={handleEndLive}
            >
              {ending ? 'Yakunlanmoqda...' : 'Efirni yakunlash'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(`/seminars/${id}`)}
            >
              Chiqish
            </button>
          )}
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: 12,
            gap: 12,
          }}
        >
          {viewMode === 'stage' ? (
            <>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  overflowX: 'auto',
                  paddingBottom: 4,
                  minHeight: 110,
                  maxHeight: 120,
                }}
              >
                <div
                  style={{
                    width: 160,
                    height: 100,
                    borderRadius: 10,
                    background: '#111827',
                    border: '1.5px solid var(--blue)',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: videoEnabled ? 'block' : 'none',
                      transform: 'scaleX(-1)',
                    }}
                  />
                  {!videoEnabled && (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        color: '#94a3b8',
                        fontSize: 11,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'var(--blue-lt)',
                          color: 'var(--blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        {user?.fio?.[0] || user?.username?.[0] || 'S'}
                      </div>
                    </div>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      left: 6,
                      right: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 10,
                      color: '#fff',
                      background: 'rgba(0,0,0,0.6)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Siz {isPresenter ? '(Ma`ruzachi)' : ''}
                    </span>
                    <span>{audioEnabled ? <Volume2 /> : <VolumeOff />}</span>
                  </div>
                </div>

                {/* Remote Participants */}
                {participants.map((p) => (
                  <div
                    key={p.socketId}
                    style={{
                      width: 160,
                      height: 100,
                      borderRadius: 10,
                      background: '#111827',
                      border: `1.5px solid ${p.isPresenter ? 'var(--amber)' : 'var(--border)'}`,
                      position: 'relative',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {p.stream && p.videoEnabled ? (
                      <video
                        autoPlay
                        playsInline
                        ref={(el) => {
                          if (el && p.stream) el.srcObject = p.stream;
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          color: '#94a3b8',
                          fontSize: 11,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'var(--bg-raised)',
                            color: 'var(--text-pri)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 700,
                            marginBottom: 4,
                          }}
                        >
                          {p.username[0] || 'M'}
                        </div>
                      </div>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        left: 6,
                        right: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 10,
                        color: '#fff',
                        background: 'rgba(0,0,0,0.6)',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.username} {p.isPresenter ? <Star /> : ''}
                      </span>
                      <span>{p.audioEnabled ? <Volume2 /> : <VolumeOff />}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  flex: 1,
                  borderRadius: 12,
                  background: '#090d16',
                  border: '1.5px solid var(--border)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                      {activeFile ? activeFile.originalName : 'Taqdimot'}
                    </span>
                    {!isPresenter && (
                      <span
                        style={{
                          fontSize: 10,
                          background: 'rgba(59,130,246,0.15)',
                          color: 'var(--blue)',
                          padding: '2px 8px',
                          borderRadius: 12,
                          border: '1px solid rgba(59,130,246,0.3)',
                        }}
                      >
                        <View /> Ma'ruzachi ekranini tomosha qilyapsiz (Faqat ko'rish)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isPresenter && seminar?.files && seminar.files.length > 1 && (
                      <select
                        className="form-input"
                        style={{ padding: '4px 8px', fontSize: 11, width: 'auto' }}
                        value={activeFile?.id}
                        onChange={(e) => {
                          const f = seminar.files?.find((file) => file.id === e.target.value);
                          if (f) handleAuthorSelectFile(f);
                        }}
                      >
                        {seminar.files.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.originalName} ({f.fileType?.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    )}

                    {['👍', '👏', '🔥', '💡', '❤️'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 13, padding: '3px 6px' }}
                        onClick={() => handleSendReaction(em)}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                  {reactions.map((r) => (
                    <span
                      key={r.id}
                      style={{
                        position: 'absolute',
                        bottom: 30,
                        right: Math.random() * 80 + 30,
                        fontSize: 32,
                        animation: 'floatUp 2.5s ease-out forwards',
                        zIndex: 30,
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
                        rotation={threeDRotation}
                        scale={threeDScale}
                        exploded={threeDExploded}
                        onRotationChange={isPresenter ? handleAuthor3DRotation : undefined}
                        onScaleChange={isPresenter ? handleAuthor3DScale : undefined}
                        onExplodeChange={isPresenter ? handleAuthor3DExplode : undefined}
                        isPresenter={isPresenter}
                        hands={handTracking.hands}
                        gestureActive={gestureActive}
                        onToggleTheater={() => setIsChatOpen(!isChatOpen)}
                        isTheaterMode={!isChatOpen}
                      />
                    ) : (
                      <InteractivePresentation
                        fileUrl={filesApi.getViewUrl(activeFile.id)}
                        fileName={activeFile.originalName}
                        pageNumber={activeSlideIndex}
                        onPageChange={isPresenter ? handleAuthorSlideChange : undefined}
                        isPresenter={isPresenter}
                        laserPointer={laserPointer}
                      />
                    )
                  ) : (
                    <div className="empty-state" style={{ paddingTop: 100, color: 'var(--text-muted)' }}>
                      Ma'ruzachi tomonidan faol fayl tanlanmagan
                    </div>
                  )}

                  {gestureActive && isPresenter && (
                    <>
                      <GestureHUD
                        label={gestureFrame.label}
                        active={gestureFrame.action.type !== 'idle'}
                      />
                      <HandCameraWidget
                        videoRef={handTracking.videoRef}
                        hands={gestureFrame.hands}
                        loading={handTracking.loading}
                        error={handTracking.error}
                        active={handTracking.active}
                        label={gestureFrame.label}
                        onToggle={toggleGesture}
                      />
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 12,
                overflowY: 'auto',
                padding: 10,
              }}
            >
              <div
                style={{
                  borderRadius: 14,
                  background: '#111827',
                  border: '2px solid var(--blue)',
                  position: 'relative',
                  overflow: 'hidden',
                  aspectRatio: '16 / 9',
                }}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: videoEnabled ? 'block' : 'none',
                    transform: 'scaleX(-1)',
                  }}
                />
                {!videoEnabled && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      color: '#94a3b8',
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: 'var(--blue-lt)',
                        color: 'var(--blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      {user?.fio?.[0] || user?.username?.[0] || 'S'}
                    </div>
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 10,
                    right: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: '#fff',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '4px 10px',
                    borderRadius: 6,
                  }}
                >
                  <span>Siz {isPresenter ? '(Ma`ruzachi)' : ''}</span>
                  <span>{audioEnabled ? <Volume2 /> : <VolumeOff />}</span>
                </div>
              </div>

              {participants.map((p) => (
                <div
                  key={p.socketId}
                  style={{
                    borderRadius: 14,
                    background: '#111827',
                    border: `2px solid ${p.isPresenter ? 'var(--amber)' : 'var(--border)'}`,
                    position: 'relative',
                    overflow: 'hidden',
                    aspectRatio: '16 / 9',
                  }}
                >
                  {p.stream && p.videoEnabled ? (
                    <video
                      autoPlay
                      playsInline
                      ref={(el) => {
                        if (el && p.stream) el.srcObject = p.stream;
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        color: '#94a3b8',
                      }}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          background: 'var(--bg-raised)',
                          color: 'var(--text-pri)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 24,
                          fontWeight: 700,
                          marginBottom: 8,
                        }}
                      >
                        {p.username[0] || 'M'}
                      </div>
                    </div>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 10,
                      right: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: '#fff',
                      background: 'rgba(0,0,0,0.7)',
                      padding: '4px 10px',
                      borderRadius: 6,
                    }}
                  >
                    <span>{p.username} {p.isPresenter ? <Star /> : ''}</span>
                    <span>{p.audioEnabled ? <Volume2 /> : <VolumeOff />}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isChatOpen && (
          <LiveChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </div>

      <footer
        style={{
          height: 62,
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          padding: '0 20px',
          zIndex: 50,
        }}
      >
        <button
          type="button"
          onClick={toggleAudio}
          className={`btn ${audioEnabled ? 'btn-ghost' : 'btn-danger'}`}
          style={{ minWidth: 90, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>{audioEnabled ? <Volume2 /> : <VolumeOff />}</span>
          {/* <span>{audioEnabled ? 'Ovoz ON' : 'Ovoz OFF'}</span> */}
        </button>

        <button
          type="button"
          onClick={toggleVideo}
          className={`btn ${videoEnabled ? 'btn-ghost' : 'btn-danger'}`}
          style={{ minWidth: 95, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>{videoEnabled ? <Video /> : <Ban />}</span>
          <span>{videoEnabled ? 'Kamera ON' : 'Kamera OFF'}</span>
        </button>

        {isPresenter && (
          <button
            type="button"
            className={`btn ${gestureActive ? 'btn-primary' : 'btn-ghost'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={toggleGesture}
          >
            <span><Hand /></span>
            <span>{gestureActive ? 'Gesture Faol' : 'Gesture Yoqish'}</span>
          </button>
        )}

        <button
          type="button"
          className="btn btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span><Users /></span>
          <span>Ishtirokchilar ({participants.length + 1})</span>
        </button>

        <button
          type="button"
          className={`btn ${isChatOpen ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          <span><MessageCircleMore /></span>
          <span>Chat</span>
        </button>
      </footer>

      {showEndConfirm && (
        <ConfirmModal
          open={showEndConfirm}
          title="Jonli efirni yakunlash"
          message="Haqiqatan ham jonli efirni yakunlamoqchimisiz? Efir video yozuvi avtomatik saqlanadi va seminar yakunlanadi."
          confirmText="Ha, yakunlash"
          cancelText="Bekor qilish"
          variant="danger"
          onConfirm={handleEndLiveConfirm}
          onCancel={() => setShowEndConfirm(false)}
        />
      )}
    </div>
  );
};

export default LiveSeminarPage;
