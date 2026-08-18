import { useCallback, useEffect, useMemo, useState } from 'react';
import { PresentationViewer } from './components/PresentationViewer';
import { HandCameraWidget } from './components/HandCameraWidget';
import { GestureHUD } from './components/GestureHUD';
import { LaserPointer } from './components/LaserPointer';
import { ThreeDViewer } from './components/ThreeDViewer';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { FileLibrary } from './components/FileLibrary';
import { GestureView } from './components/GestureView';
import { PasswordModal } from './components/PasswordModal';
import { useHandTracking } from './hooks/useHandTracking';
import { usePresentationGestures } from './hooks/usePresentationGestures';
import { StoredFile, ViewModule } from './types/file';
import { ApiService } from './services/api';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export default function App() {
  const [currentModule, setCurrentModule] = useState<ViewModule>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);

  // Active Presentation State
  const [currentPresentation, setCurrentPresentation] = useState<StoredFile | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pointerPoint, setPointerPoint] = useState<{ x: number; y: number } | null>(null);

  // Active 3D Model State
  const [currentModel, setCurrentModel] = useState<StoredFile | null>(null);

  // Delete modal state
  const [fileToDelete, setFileToDelete] = useState<StoredFile | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Hand tracking and gesture processing
  const { active, loading, error, hands, videoRef, start, stop } = useHandTracking();
  const gestureFrame = usePresentationGestures(hands, active);

  // Fetch files from backend
  const loadFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const isHealthy = await ApiService.checkHealth();
      setServerOnline(isHealthy);
      if (isHealthy) {
        const fetched = await ApiService.getFiles();
        setFiles(fetched);
      }
    } catch (err) {
      console.warn('Backend aloqasida xatolik:', err);
      setServerOnline(false);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const goToPage = useCallback(
    (updater: (p: number) => number) => {
      setPageNumber((p) => clamp(updater(p), 1, pageCount));
      setZoom(1);
    },
    [pageCount]
  );

  // Gesture actions for Presentation Mode
  useEffect(() => {
    if (currentModule !== 'presentation') return;

    const action = gestureFrame.action;
    switch (action.type) {
      case 'next-slide':
        goToPage((p) => p + 1);
        break;
      case 'prev-slide':
        goToPage((p) => p - 1);
        break;
      case 'zoom':
        setZoom((z) => clamp(z * action.factor, MIN_ZOOM, MAX_ZOOM));
        break;
      case 'point':
        setPointerPoint({ x: action.x, y: action.y });
        break;
      case 'point-end':
        setPointerPoint(null);
        break;
      case 'reset':
        setZoom(1);
        break;
      default:
        break;
    }
  }, [gestureFrame.action, currentModule, goToPage]);

  // Open file handler (PDF / GLB)
  const handleOpenFile = useCallback((file: StoredFile) => {
    if (file.fileType === 'pdf') {
      setCurrentPresentation(file);
      setPageNumber(1);
      setPageCount(1);
      setZoom(1);
      setCurrentModule('presentation');
    } else if (file.fileType === 'glb') {
      setCurrentModel(file);
      setCurrentModule('model3d');
    }
  }, []);

  // Delete file request
  const handleRequestDelete = (file: StoredFile) => {
    setFileToDelete(file);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (password: string) => {
    if (!fileToDelete) return;
    await ApiService.deleteFile(fileToDelete.id, password);
    if (currentPresentation?.id === fileToDelete.id) setCurrentPresentation(null);
    if (currentModel?.id === fileToDelete.id) setCurrentModel(null);
    await loadFiles();
  };

  const activePresentationUrl = useMemo(() => {
    if (!currentPresentation) return '';
    return ApiService.resolveFileUrl(currentPresentation.url);
  }, [currentPresentation]);

  const activeModelUrl = useMemo(() => {
    if (currentModel) return ApiService.resolveFileUrl(currentModel.url);
    const firstGlb = files.find((f) => f.fileType === 'glb');
    return firstGlb ? ApiService.resolveFileUrl(firstGlb.url) : ApiService.resolveFileUrl('/models/sag_mill_v2.glb');
  }, [currentModel, files]);

  const activeModelName = useMemo(() => {
    if (currentModel) return currentModel.originalName;
    const firstGlb = files.find((f) => f.fileType === 'glb');
    return firstGlb ? firstGlb.originalName : 'sag_mill_v2.glb';
  }, [currentModel, files]);

  const availableGlbModels = useMemo(() => {
    return files.filter((f) => f.fileType === 'glb');
  }, [files]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        background: '#090d16',
        overflow: 'hidden',
      }}
    >
      {/* ── 1. Left Sidebar Navigation (Matching ui-overview1.png) ── */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        files={files}
        gestureActive={active}
        serverOnline={serverOnline}
      />

      {/* ── 2. Right Main Container (Navbar + Active View) ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Top Navbar */}
        <Navbar
          currentModule={currentModule}
          serverOnline={serverOnline}
          gestureActive={active}
          onToggleGesture={() => (active ? stop() : start())}
          activeFileName={
            currentModule === 'presentation'
              ? currentPresentation?.originalName
              : currentModule === 'model3d'
              ? activeModelName
              : undefined
          }
        />

        {/* View Content Area */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
          {/* Module 1: Dashboard (Boshqaruv Paneli) */}
          {currentModule === 'dashboard' && (
            <Dashboard
              files={files}
              loading={loadingFiles}
              onRefresh={loadFiles}
              onOpenFile={handleOpenFile}
              onRequestDelete={handleRequestDelete}
              gestureActive={active}
            />
          )}

          {/* Module 2: Slayd Taqdimot Viewer */}
          {currentModule === 'presentation' && (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {activePresentationUrl ? (
                <>
                  {/* Floating Presentation Control Bar */}
                  <div style={presentationBarStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        onClick={() => setCurrentModule('dashboard')}
                        style={toolbarBtnStyle}
                      >
                        ← Boshqaruv Paneli
                      </button>
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--cyan)',
                          maxWidth: 240,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {currentPresentation?.originalName}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => goToPage((p) => p - 1)} style={toolbarBtnStyle}>
                        ← Oldingi
                      </button>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: '#fff',
                          minWidth: 64,
                          textAlign: 'center',
                          background: 'var(--bg-surface-2)',
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                        }}
                      >
                        {pageNumber} / {pageCount}
                      </span>
                      <button onClick={() => goToPage((p) => p + 1)} style={toolbarBtnStyle}>
                        Keyingi →
                      </button>
                      <div
                        style={{
                          width: 1,
                          height: 20,
                          background: 'var(--border)',
                          margin: '0 4px',
                        }}
                      />
                      <button onClick={() => setZoom(1)} style={toolbarBtnStyle}>
                        Zoom: {Math.round(zoom * 100)}% ↺
                      </button>
                      <button
                        onClick={() => setCurrentModule('model3d')}
                        style={{
                          ...toolbarBtnStyle,
                          borderColor: 'var(--cyan)',
                          color: 'var(--cyan)',
                        }}
                      >
                        3D Modul →
                      </button>
                    </div>
                  </div>

                  <PresentationViewer
                    fileUrl={activePresentationUrl}
                    pageNumber={pageNumber}
                    zoom={zoom}
                    onReady={setPageCount}
                  />
                  <LaserPointer point={pointerPoint} />
                  <GestureHUD label={gestureFrame.label} active={active} />
                  <HandCameraWidget
                    videoRef={videoRef}
                    hands={gestureFrame.hands}
                    active={active}
                    loading={loading}
                    error={error}
                    label={gestureFrame.label}
                    onToggle={() => (active ? stop() : start())}
                  />
                </>
              ) : (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                  }}
                >
                  <div style={{ fontSize: 48 }}>📄</div>
                  <h3 style={{ fontSize: 18, color: '#fff' }}>Hech qanday taqdimot tanlanmagan</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                    Boshqaruv panelidan taqdimotni tanlang yoki yangi fayl yuklang
                  </p>
                  <button
                    onClick={() => setCurrentModule('dashboard')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  >
                    Boshqaruv paneliga o'tish
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Module 3: 3D CAD / GLB Viewer */}
          {currentModule === 'model3d' && (
            <ThreeDViewer
              onBack={() => setCurrentModule('dashboard')}
              modelUrl={activeModelUrl}
              modelName={activeModelName}
              availableModels={availableGlbModels}
              onSelectModel={(file) => setCurrentModel(file)}
            />
          )}

          {/* Module 4: Fayllar Kutubxonasi */}
          {currentModule === 'files' && (
            <FileLibrary
              files={files}
              loading={loadingFiles}
              onRefresh={loadFiles}
              onOpenFile={handleOpenFile}
              onRequestDelete={handleRequestDelete}
              serverOnline={serverOnline}
              gestureActive={active}
            />
          )}

          {/* Module 5: AI Gesture Nazorati */}
          {currentModule === 'gesture' && (
            <GestureView
              active={active}
              loading={loading}
              error={error}
              hands={gestureFrame.hands}
              videoRef={videoRef}
              label={gestureFrame.label}
              onToggle={() => (active ? stop() : start())}
            />
          )}

          {/* Module 6: Arxiv */}
          {currentModule === 'archive' && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🗄️</div>
              <h3 style={{ fontSize: 18, color: '#fff', marginBottom: 6 }}>Arxiv va Tarix</h3>
              <p style={{ fontSize: 13 }}>O'chirilgan yoki arxivlangan materiallar ro'yxati</p>
            </div>
          )}

          {/* Module 7: Sozlamalar */}
          {currentModule === 'settings' && (
            <div style={{ padding: 40, maxWidth: 600, margin: '0 auto', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>⚙️</div>
              <h3 style={{ fontSize: 18, color: '#fff', marginBottom: 16 }}>Tizim Sozlamalari</h3>
              <div
                style={{
                  background: '#0e1322',
                  border: '1px solid #1c2333',
                  borderRadius: 10,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <div>Platforma: OKMK AI Presentation & 3D Twin</div>
                <div>Backend Port: 5050</div>
                <div>Frontend Port: 4664</div>
                <div>Root Xavfsizlik: .env ROOT_PASSWORD faol</div>
                <div>MediaPipe Tasks Vision: v0.10.17 GPU/CPU</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Security Delete Password Modal ── */}
      <PasswordModal
        file={fileToDelete}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setFileToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

const presentationBarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 14,
  left: 18,
  right: 18,
  zIndex: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 16px',
  borderRadius: 10,
  background: 'rgba(10, 13, 22, 0.92)',
  border: '1px solid #1c2333',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
};

const toolbarBtnStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid #1c2333',
  background: 'var(--bg-surface-2)',
  color: 'var(--text-main)',
  cursor: 'pointer',
};
