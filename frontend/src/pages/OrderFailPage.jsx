import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function OrderFailPage() {
  const [params] = useSearchParams();
  const orderId = params.get('order_id');
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Card className="p-8 bg-white text-center" data-testid="order-fail-page">
        <XCircle className="w-16 h-16 mx-auto text-red-500 mb-3" />
        <h1 className="text-2xl font-semibold font-heading">Ödeme Tamamlanamadı</h1>
        <p className="text-muted-foreground mt-2">Siparişiniz oluşturuldu fakat ödeme tamamlanamadı. Lütfen tekrar deneyin.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link to="/"><Button variant="outline">Ana Sayfa</Button></Link>
          <Link to="/sepet"><Button className="bg-primary text-white hover:bg-emerald-600">Sepete Geri Dön</Button></Link>
        </div>
      </Card>
    </div>
  );
}
