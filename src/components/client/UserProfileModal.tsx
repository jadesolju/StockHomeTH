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
  Crown,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { useClientAuth } from '../../lib/context/ClientAuthContext';
import { useSubscription, SubscriptionTier, OWNER_DEV_IDENTIFIERS } from '../../lib/context/SubscriptionContext';
import { UserAvatar } from '../ui/UserAvatar';

export function UserProfileModal() {
  const {
    user,
    isProfileModalOpen,
    closeProfileModal,
    updateUserProfile,
    signOut,
    openAuthModal,
  } = useClientAuth();

  const {
    currentPlan,
    currentTier,
    setTier,
    isOwnerOrDev,
    isOwnerAccount,
    restoreOwnerGodMode,
    openPricingModal,
  } = useSubscription();

  const isOwner =
    isOwnerAccount ||
    isOwnerOrDev ||
    Boolean(
      user &&
        (OWNER_DEV_IDENTIFIERS.emails.includes(user.email?.toLowerCase().trim() ?? '') ||
          OWNER_DEV_IDENTIFIERS.firebaseUids.includes(user.uid))
    );

  const [displayName, setDisplayName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLocalEnv, setIsLocalEnv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLocalEnv(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    }
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
      const userId = user?.uid || '';
      if (userId) {
        formData.append('userId', userId);
      }

      const res = await fetch('/api/upload/r2', {
        method: 'POST',
        headers: {
          'x-user-id': userId,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }

      await updateUserProfile(undefined, data.url);
      setSuccessMessage('อัปเดตรูปโปรไฟล์สำเร็จเรียบร้อยแล้ว');
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
        className="auth-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius: '28px',
          padding: '32px 28px',
          maxWidth: '420px',
          width: '100%',
          background: 'var(--bg-secondary)',
          backgroundColor: 'var(--bg-secondary)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75)',
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
              <UserAvatar
                photoURL={user.photoURL}
                displayName={user.displayName}
                email={user.email}
                size={80}
                border="none"
              />

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
              title="เปลี่ยนรูปโปรไฟล์"
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
                background: currentTier === 'vip' ? 'rgba(168, 85, 247, 0.2)' : currentTier === 'pro' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                color: currentTier === 'vip' ? '#a855f7' : currentTier === 'pro' ? 'var(--accent-blue)' : 'var(--accent-bullish)',
                border: `1px solid ${currentTier === 'vip' ? 'rgba(168, 85, 247, 0.4)' : currentTier === 'pro' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(34, 197, 94, 0.3)'}`,
                padding: '2px 10px',
                borderRadius: '100px',
                fontSize: '0.72rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Crown size={12} /> {currentPlan.name}
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

          {/* Membership Tier Status (Local Sandbox Only) */}
          {isLocalEnv && (
            <div
              style={{
                marginTop: '14px',
                padding: '12px 14px',
                borderRadius: '14px',
                background: currentTier === 'free' ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${currentTier === 'free' ? 'rgba(59, 130, 246, 0.3)' : 'var(--card-sub-border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {currentTier === 'free' ? 'อัปเกรดเป็น Pro Investor' : `สิทธิพิเศษระดับ ${currentPlan.name}`}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {currentTier === 'free' ? 'ปลดล็อก AI วิเคราะห์งบ และเตือนเข้า LINE' : `สถานะใช้งานได้ถึง ${currentPlan.expiresAt || 'ตลอดชีพ'}`}
                </div>
              </div>
              <button
                onClick={() => {
                  closeProfileModal();
                  openPricingModal();
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: currentTier === 'free' ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentTier === 'free' ? 'ดูแพ็กเกจ' : 'เปลี่ยนแผน'}
              </button>
            </div>
          )}
        </div>

        {/* ─── Dedicated Admin & Dev Control Panel (Strictly Owner/Dev Only) ─── */}
        {isOwner && (
          <div
            style={{
              marginBottom: '20px',
              padding: '16px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              boxShadow: '0 4px 20px rgba(236, 72, 153, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={18} color="#ec4899" />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f472b6' }}>
                  Owner & Developer Controls
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '100px',
                  background: 'rgba(236, 72, 153, 0.2)',
                  color: '#f472b6',
                  fontWeight: 800,
                  border: '1px solid rgba(236, 72, 153, 0.35)',
                }}
              >
                CURRENT TIER: {currentTier.toUpperCase()}
              </span>
            </div>

            <p style={{ margin: '0 0 12px 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              บัญชีผู้ดูแลระบบ ({user.email}): คุณสามารถสลับสิทธิ์เพื่อทดสอบ และกู้คืนสิทธิ์ Dev + Owner ได้ตลอดเวลา
            </p>

            {/* Quick Switch Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '6px', marginBottom: '12px' }}>
              {[
                { id: 'dev' as SubscriptionTier, label: '👑 Dev Mode', color: '#ec4899' },
                { id: 'whale' as SubscriptionTier, label: '💎 Whale', color: '#06b6d4' },
                { id: 'vip' as SubscriptionTier, label: '👑 VIP Trader', color: '#a855f7' },
                { id: 'pro' as SubscriptionTier, label: '⚡ Pro Investor', color: 'var(--accent-blue)' },
                { id: 'free' as SubscriptionTier, label: '🛡️ Free', color: 'var(--accent-bullish)' },
              ].map((tierItem) => (
                <button
                  key={tierItem.id}
                  onClick={() => {
                    setTier(tierItem.id);
                    setSuccessMessage(`สลับสิทธิ์เป็นระดับ ${tierItem.label} สำเร็จ`);
                  }}
                  style={{
                    padding: '7px 8px',
                    borderRadius: '10px',
                    border: currentTier === tierItem.id ? `1px solid ${tierItem.color}` : '1px solid var(--card-sub-border)',
                    background: currentTier === tierItem.id ? `${tierItem.color}25` : 'var(--card-sub-bg)',
                    color: currentTier === tierItem.id ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.72rem',
                    fontWeight: currentTier === tierItem.id ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {tierItem.label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => {
                  restoreOwnerGodMode();
                  setSuccessMessage('👑 คืนสิทธิ์ Dev + Owner (God Mode) และเติม 99,999,999 GemCoins เรียบร้อยแล้ว!');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(236, 72, 153, 0.45)',
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)',
                  color: '#f472b6',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(236, 72, 153, 0.2)',
                }}
              >
                <Crown size={15} color="#ec4899" /> คืนสิทธิ์ Dev + Owner (99,999,999 GemCoins)
              </button>

              <Link
                href="/admin"
                onClick={() => closeProfileModal()}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#34d399',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                }}
              >
                <Settings size={14} color="#10b981" /> เข้าสู่ระบบ Admin Backoffice (/admin)
              </Link>
            </div>
          </div>
        )}

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

          {/* Upload Image */}
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
              <span>เปลี่ยนรูปโปรไฟล์ใหม่</span>
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
