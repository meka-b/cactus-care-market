import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { MessageCircle, X, Send, Sparkles, Leaf, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth';

const STORAGE_KEY = 'yd_yaver_history';
const GREETING = { role: 'assistant', content: 'Merhaba! Ben Yaver 🌿 Bitki bakımı, ürünler veya siparişlerinle ilgili ne sormak istersin?' };

export function YaverChat() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const [messages, setMessages] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return s.length ? s : [GREETING]; } catch { return [GREETING]; }
  });
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const location = useLocation();
  const params = useParams();
  const scrollRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20))); } catch {}
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const buildContext = () => {
    const ctx = { page: location.pathname };
    // Extract product slug from URL /u/:slug
    const productMatch = location.pathname.match(/^\/u\/([^/]+)/);
    if (productMatch) ctx.product_slug = productMatch[1];
    // Extract order id
    const orderMatch = location.pathname.match(/^\/siparis\/([^/]+)/);
    if (orderMatch) ctx.order_id = orderMatch[1];
    return ctx;
  };

  const send = async (e) => {
    e?.preventDefault?.();
    if (!input.trim() || sending) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    try {
      const r = await api.post('/chat', {
        message: userMsg.content,
        history: messages.slice(-6),
        context: buildContext(),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: r.data.reply, sources: r.data.sources }]);
      if (!open) setUnread(true);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Üzgünüm, şu an cevap veremiyorum. Birazdan tekrar dene.' }]);
    } finally { setSending(false); }
  };

  const reset = () => { setMessages([GREETING]); localStorage.removeItem(STORAGE_KEY); };
  const toggle = () => { setOpen(o => !o); setUnread(false); };

  const formatMessage = (text) => {
    if (!text) return '';
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
    return html;
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggle}
        className="fixed bottom-36 sm:bottom-4 right-4 z-[60] w-14 h-14 rounded-full bg-primary text-white grid place-items-center shadow-lg hover:bg-emerald-600 transition-colors"
        aria-label="Yaver Asistan"
        data-testid="yaver-toggle-button"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {unread && !open && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-36 sm:bottom-20 right-4 z-[60] w-[calc(100vw-2rem)] max-w-[400px] sm:w-96 h-[60vh] sm:h-[540px] bg-white rounded-xl shadow-2xl border border-[hsl(var(--border))] flex flex-col overflow-hidden"
            data-testid="yaver-chat-panel"
          >
            <div className="px-4 py-3 border-b border-[hsl(var(--border))] bg-primary text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 grid place-items-center"><Leaf className="w-4 h-4" /></div>
              <div className="flex-1">
                <div className="font-semibold font-heading text-sm">Yaver</div>
                <div className="text-[10px] opacity-90 inline-flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" />AI destekli bitki asistanı</div>
              </div>
              <button onClick={reset} className="text-xs underline opacity-80 hover:opacity-100">Temizle</button>
            </div>
            <TooltipProvider delayDuration={200}>
              <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto bg-[#F7FBF8] space-y-2" data-testid="yaver-messages">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="relative group max-w-[85%]">
                      <div 
                        className={`rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-white whitespace-pre-wrap' : 'bg-white border border-[hsl(var(--border))]'}`}
                        dangerouslySetInnerHTML={m.role === 'user' ? undefined : { __html: formatMessage(m.content) }}
                      >
                        {m.role === 'user' ? m.content : null}
                      </div>
                      
                      {/* RAG Kaynak Hover (Admin Özel) */}
                      {user?.role === 'admin' && m.role === 'assistant' && m.sources && m.sources.length > 0 && (
                        <div className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="p-1 cursor-help bg-white rounded-full shadow-sm border border-indigo-100 text-indigo-500 hover:text-indigo-600">
                                <Info className="w-4 h-4" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" align="center" className="max-w-xs bg-indigo-900 text-white p-3 rounded-lg shadow-xl text-xs z-[70]">
                              <div className="font-semibold mb-1 text-indigo-200">🤖 RAG Referansları ({m.sources.length})</div>
                              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {m.sources.map((src, idx) => (
                                  <li key={idx} className="border-b border-indigo-700/50 pb-2 last:border-0 last:pb-0">
                                    <div className="font-medium text-indigo-300">📄 {src.filename}</div>
                                    <div className="text-[10px] mt-0.5 opacity-80 leading-tight">"...{src.content.substring(0, 100)}..."</div>
                                  </li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[hsl(var(--border))] rounded-xl px-3 py-2 text-sm inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay:'0s'}} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay:'0.15s'}} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay:'0.3s'}} />
                    </div>
                  </div>
                )}
              </div>
            </TooltipProvider>
            <form onSubmit={send} className="p-3 border-t border-[hsl(var(--border))] flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Bitki, ürün veya sipariş sor..."
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-[hsl(var(--border))] focus:outline-none focus:border-primary"
                data-testid="yaver-input"
              />
              <button type="submit" disabled={sending || !input.trim()} className="px-3 rounded-xl bg-primary text-white disabled:opacity-40" data-testid="yaver-send-button"><Send className="w-4 h-4" /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
