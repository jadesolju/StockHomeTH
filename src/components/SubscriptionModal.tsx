import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

type Plan = { name: string; price: number; features: string[] };
export function SubscriptionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [plans, setPlans] = useState<Record<string, Plan>>({}); const [message, setMessage] = useState('');
  useEffect(() => { if (isOpen) fetch('/api/subscriptions/plans').then(r => r.json()).then(data => setPlans(data.plans)).catch(() => setMessage('Unable to load plans.')); }, [isOpen]);
  if (!isOpen) return null;
  const checkout = async (plan: string) => { const response = await fetch('/api/subscriptions/checkout', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) }); const result = await response.json(); setMessage(result.error || 'Checkout started.'); };
  return <div className="ios-sheet-overlay" onClick={onClose}><section className="subscription-dialog" onClick={e => e.stopPropagation()}>
    <button className="icon-button auth-close" onClick={onClose}><X size={19}/></button><p className="eyebrow">SUBSCRIPTION</p><h2>Choose the right access</h2><p className="auth-copy">Simple monthly pricing. Cancel any time.</p>
    <div className="plan-grid">{Object.entries(plans).map(([key, plan]) => <article className={`plan-card ${key === 'pro' ? 'featured' : ''}`} key={key}><h3>{plan.name}</h3><p className="plan-price">{plan.price === 0 ? 'Free' : `฿${plan.price.toLocaleString()}`}<small>{plan.price ? ' / month' : ''}</small></p><ul>{plan.features.map(feature => <li key={feature}><Check size={14}/>{feature}</li>)}</ul><button className={key === 'free' ? 'outline-button' : 'solid-button'} onClick={() => key === 'free' ? onClose() : checkout(key)}>{key === 'free' ? 'Current starting plan' : `Choose ${plan.name}`}</button></article>)}</div>
    {message && <p className="subscription-message">{message}</p>}
  </section></div>;
}
