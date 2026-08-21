import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { usersApi, authApi } from '../services/api';
import { useI18n } from '../utils/i18n';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const t = useI18n();

  const [fio, setFio] = useState(user?.fio || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showAvatarDeleteConfirm, setShowAvatarDeleteConfirm] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarLoading(true);
      try {
        await usersApi.uploadAvatar(file);
        await refreshUser();
        toast.success('Profil rasmi muvaffaqiyatli yuklandi');
      } catch {
        toast.error('Rasm yuklashda xatolik yuz berdi');
      } finally {
        setAvatarLoading(false);
      }
    }
  };

  const handleDeleteAvatarConfirm = async () => {
    setAvatarLoading(true);
    try {
      await usersApi.deleteAvatar();
      await refreshUser();
      toast.success("Profil rasmi o'chirildi");
    } catch {
      toast.error("Rasm o'chirishda xatolik yuz berdi");
    } finally {
      setAvatarLoading(false);
      setShowAvatarDeleteConfirm(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await usersApi.updateMyProfile({ fio, email, phone });
      await refreshUser();
      toast.success("Profil ma'lumotlari muvaffaqiyatli saqlandi");
    } catch {
      toast.error("Ma'lumotlarni saqlashda xatolik yuz berdi");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.warning('Yangi parollar bir-biriga mos kelmadi');
      return;
    }
    if (newPassword.length < 6) {
      toast.warning("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setPasswordSaving(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
    } catch (err: any) {
      const msg =
        err.response?.data?.message?.uz ||
        err.response?.data?.message ||
        "Parolni o'zgartirishda xatolik";
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="page active" id="page-profile">
      <div className="page-hd">
        <div>
          <div className="pg-title">{t('Profile Settings')}</div>
          <div className="pg-sub">
            {user?.fio} ({user?.username}) · {user?.department?.name || 'OKMK'}
          </div>
        </div>
      </div>

      <div className="main-grid">
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Shaxsiy ma'lumotlar</div>
              <div className="card-subtitle">F.I.O, aloqa va lavozim ma'lumotlari</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--blue-lt)',
                  color: 'var(--blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: 'var(--f-disp)',
                }}
              >
                {user?.fio ? user.fio.slice(0, 2).toUpperCase() : 'OK'}
              </div>
              <div>
                <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', display: 'inline-block' }}>
                  {avatarLoading ? t('Loading') : t('Upload File')}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                {user?.avatarUrl && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    style={{ marginLeft: 8 }}
                    onClick={() => setShowAvatarDeleteConfirm(true)}
                  >
                    O'chirish
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">{t('Full Name')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={fio}
                  onChange={(e) => setFio(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">{t('Username')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.username || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="masalan: name@agmk.uz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Telefon raqam</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={profileSaving}
              >
                {profileSaving ? t('Loading') : t('Save')}
              </button>
            </form>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Xavfsizlik va Parol</div>
              <div className="card-subtitle">Akkaunt parolini yangilash</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: 18 }}>
            <form onSubmit={handleChangePassword}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Amaldagi parol</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Hozirgi parolingiz"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Yangi parol</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Kamida 6 ta belgi"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Yangi parolni tasdiqlang</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Yangi parolni qayta kiriting"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={passwordSaving}
              >
                {passwordSaving ? t('Loading') : "Parolni o'zgartirish"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showAvatarDeleteConfirm && (
        <ConfirmModal
          open={showAvatarDeleteConfirm}
          title="Profil rasmini o'chirish"
          message="Haqiqatan ham profil rasmingizni o'chirmoqchimisiz?"
          confirmText="O'chirish"
          cancelText="Bekor qilish"
          variant="danger"
          onConfirm={handleDeleteAvatarConfirm}
          onCancel={() => setShowAvatarDeleteConfirm(false)}
        />
      )}
    </div>
  );
};

export default ProfilePage;
