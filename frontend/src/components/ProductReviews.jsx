import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

function Stars({ value, onChange, size = 'w-5 h-5', interactive = false }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(i)}
          className={`${interactive ? 'cursor-pointer' : 'cursor-default'} text-amber-500`}
        >
          <Star className={`${size} ${i <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ slug }) {
  const { user } = useAuth();
  const [data, setData] = useState({ items: [], count: 0, average_rating: 0 });
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/products/${slug}/reviews`).then(r => setData(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [slug]);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) { toast.info('Yorum yapmak için giriş yapın'); return; }
    if (comment.trim().length < 3) { toast.error('Lütfen daha uzun bir yorum yazın'); return; }
    setSubmitting(true);
    try {
      await api.post(`/products/${slug}/reviews`, { rating, comment });
      toast.success('Yorumunuz alındı. Admin onayından sonra yayınlanacak.');
      setComment(''); setRating(5);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Yorum gönderilemedi');
    } finally { setSubmitting(false); }
  };

  return (
    <div data-testid="product-reviews">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl font-semibold">{data.average_rating || '0'}</div>
        <div>
          <Stars value={Math.round(data.average_rating)} />
          <div className="text-sm text-muted-foreground">{data.count} değerlendirme</div>
        </div>
      </div>

      {/* Submit form */}
      <Card className="p-4 bg-white mb-4">
        <h4 className="font-semibold mb-2">Yorumunu yaz</h4>
        {!user ? (
          <p className="text-sm text-muted-foreground">Yorum yapmak için <Link to="/giris" className="text-primary">giriş yapın</Link>.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">Puan:</span>
              <Stars value={rating} onChange={setRating} interactive />
            </div>
            <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Bu ürün hakkındaki düşüncelerinizi yazın..." rows={3} data-testid="review-comment-input" />
            <Button type="submit" disabled={submitting} className="bg-primary text-white hover:bg-emerald-600" data-testid="review-submit-button">{submitting ? 'Gönderiliyor...' : 'Yorumu Gönder'}</Button>
          </form>
        )}
      </Card>

      {/* List */}
      {loading ? (
        <div className="shimmer h-20 rounded-xl" />
      ) : data.items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Henüz onaylı yorum yok. İlk yorumu siz yazın.</p>
      ) : (
        <div className="space-y-3">
          {data.items.map(rv => (
            <Card key={rv.id} className="p-4 bg-white" data-testid={`review-item-${rv.id}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{rv.name}</div>
                  <Stars value={rv.rating} size="w-4 h-4" />
                </div>
                <div className="text-xs text-muted-foreground">{new Date(rv.created_at).toLocaleDateString('tr-TR')}</div>
              </div>
              <p className="mt-2 text-sm">{rv.comment}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
