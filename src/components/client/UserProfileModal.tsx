'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  User as UserIcon,
  Camera,
  Mail,
  Key,
  LogOut,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Crown
} from 'lucide-react';
import { useClientAuth } from '../../lib/context/ClientAuthContext';

export function UserProfileModal() {
  const {
    user,
    isProfileModalOpen,
    closeProfileModal,
    updateUserProfile,
    openAuthModal,
    signOut,
  } = useClientAuth();

  const [displayName, setDisplayName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setErrorMessage('');
      setSuccessMessage('');
      setIsEditingName(false);
    }
  }, [user, isProfileModalOpen]);

  if (!isProfileModalOpen || !user) return null;

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('ขนาดรูปภาพต้องไม่เกิน 5MB');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/r2', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'อัปโหลดรูปภาพไปยัง Cloudflare R2 ไม่สำเร็จ');
      }

      await updateUserProfile(undefined, data.url);
      setSuccessMessage('อัปเดตรูปโปรไฟล์บน Cloudflare R2 สำเร็จ');
    } catch (err: any) {
      console.error('[Avatar Upload Error]:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    try {
      await updateUserProfile(displayName.trim());
      setIsEditingName(false);
      setSuccessMessage('บันทึกชื่อโปรไฟล์เรียบร้อย');
    } catch (err: any) {
      setErrorMessage(err.message || 'บันทึกชื่อไม่สำเร็จ');
    }
  };

  const isGoogleUser = user.providerData.some((p) => p.providerId === 'google.com');

  return (
    <div
      className="ios-sheet-overlay"
      onClick={closeProfileModal}
      style={{
        zIndex: 99999,
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <section
        className="auth-dialog glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius: '28px',
          padding: '32px 28px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          border: '1px solid var(--card-border)',
          position: 'relative',
          zIndex: 100000,
        }}
      >
        {/* Close Button */}
        <button
          className="icon-button auth-close"
          onClick={closeProfileModal}
          aria-label="ปิด"
          style={{ position: 'absolute', top: '20px', right: '20px', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {/* Hidden File Input for Cloudflare R2 Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />

        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          {/* Avatar Container with Upload Icon */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '14px' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#007AFF',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 800,
                overflow: 'hidden',
                border: '3px solid rgba(0, 122, 255, 0.4)',
                boxShadow: '0 8px 24px rgba(0, 122, 255, 0.3)',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Profile Avatar'}
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', zIndex: 3 }}
                />
              ) : (
                <span>
                  {user.displayName
                    ? user.displayName.charAt(0).toUpperCase()
                    : user.email?.charAt(0).toUpperCase() || 'M'}
                </span>
              )}

              {isUploading && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <Loader2 size={24} color="#ffffff" className="spin-anim" />
                </div>
              )}
            </div>

            {/* Change Avatar Camera Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="เปลี่ยนรูปโปรไฟล์ (บันทึกลง Cloudflare R2)"
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#007AFF',
                border: '2px solid var(--bg-secondary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 15,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.15s ease',
              }}
            >
              <Camera size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
            <span
              style={{
                background: 'rgba(0, 122, 255, 0.15)',
                color: '#007AFF',
                border: '1px solid rgba(0, 122, 255, 0.3)',
                padding: '2px 10px',
                borderRadius: '100px',
                fontSize: '0.72rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Crown size={12} /> StockHome Member
            </span>
            {isGoogleUser && (
              <span
                style={{
                  background: 'rgba(66, 133, 244, 0.15)',
                  color: '#4285F4',
                  padding: '2px 8px',
                  borderRadius: '100px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              >
                Google Linked
              </span>
            )}
          </div>

          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {user.displayName || 'StockHome Member'}
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {user.email}
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 600 }}>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>{successMessage}</span>
          </div>
        )}

        {/* User Settings List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
          {/* Change Display Name */}
          {isEditingName ? (
            <form onSubmit={handleSaveDisplayName} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ชื่อผู้ใช้งานของคุณ"
                required
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '12px',
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--card-sub-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                className="ios-btn-primary"
                style={{ padding: '8px 14px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '12px' }}
              >
                บันทึก
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="glass-card-hover"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'var(--card-sub-bg)',
                border: '1px solid var(--card-sub-border)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserIcon size={16} color="var(--accent-blue)" />
                <span>แก้ไขชื่อโปรไฟล์</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>แก้ไข</span>
            </button>
          )}

          {/* Upload Image to Cloudflare R2 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="glass-card-hover"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '14px',
              background: 'var(--card-sub-bg)',
              border: '1px solid var(--card-sub-border)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Upload size={16} color="#10b981" />
              <span>อัปโหลดรูปภาพใหม่ (Cloudflare R2)</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>เลือกไฟล์</span>
          </button>

          {/* Change Password */}
          <button
            onClick={() => {
              closeProfileModal();
              openAuthModal('changePassword');
            }}
            className="glass-card-hover"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '14px',
              background: 'var(--card-sub-bg)',
              border: '1px solid var(--card-sub-border)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Key size={16} color="#f59e0b" />
              <span>เปลี่ยนรหัสผ่าน</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>เปลี่ยน</span>
          </button>
        </div>

        {/* ─── Logout Button (Prominent & Clear) ─── */}
        <button
          onClick={() => signOut()}
          className="ios-btn-secondary"
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '14px',
            fontSize: '0.9rem',
            fontWeight: 800,
            color: '#f87171',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <LogOut size={16} /> ออกจากระบบ (Log Out)
        </button>
      </section>
    </div>
  );
}
export default UserProfileModal;
