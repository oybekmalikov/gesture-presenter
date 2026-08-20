import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LangFlag } from '../components/common/LangFlag';
import { useI18n } from '../utils/i18n';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useI18n(language);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(language === 'ru' ? 'Введите логин и пароль' : 'Login va parolni kiriting');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(username.trim(), password.trim());
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.message?.uz ||
        err.response?.data?.message ||
        (language === 'ru' ? 'Неверный логин или пароль' : 'Login yoki parol noto`g`ri');
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <img src="/assets/AGMK_LOGO.gif" alt="OKMK" style={{ width: 36, height: 40, objectFit: 'contain' }} />
          </div>

          <div className="login-title">
            {language === 'ru' ? 'ОКМК Семинар' : 'OKMK Taqdimot'}
          </div>

          <div className="login-subtitle">
            {language === 'ru' ? 'Войти в корпоративную панель' : 'Korporativ tizimga kirish'}
          </div>

          <div className="login-lang">
            <button
              type="button"
              className={`lang-btn ${language === 'uz' ? 'active' : ''}`}
              onClick={() => setLanguage('uz')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <LangFlag lang="uz" /> UZ
            </button>
            <button
              type="button"
              className={`lang-btn ${language === 'ru' ? 'active' : ''}`}
              onClick={() => setLanguage('ru')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <LangFlag lang="ru" /> RU
            </button>
            <button
              type="button"
              className="lang-btn"
              onClick={toggleTheme}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, padding: 4 }}
              title="Mavzuni almashtirish"
            >
              {theme === 'dark' ? (
                <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
                  <path d="M14 10.5a6 6 0 01-8.5-8.5 6.5 6.5 0 108.5 8.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
                  <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="login-card">
          {error && (
            <div className="error-toast show">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                {language === 'ru' ? 'Доменный логин' : 'Domen logini'}
              </label>
              <div className="form-input-wrap">
                <input
                  type="text"
                  className="form-input"
                  placeholder={language === 'ru' ? 'например: rakhimov' : 'masalan: rakhimov'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  autoFocus
                />
                <svg className="form-input-icon" viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {language === 'ru' ? 'Пароль' : 'Parol'}
              </label>
              <div className="form-input-wrap">
                <input
                  type="password"
                  className="form-input"
                  placeholder={language === 'ru' ? 'Введите пароль' : 'Parolni kiriting'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <svg className="form-input-icon" viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <span>{language === 'ru' ? 'Проверка...' : 'Tekshirilmoqda...'}</span>
                </>
              ) : (
                <span>{language === 'ru' ? 'Войти' : 'Kirish'}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
