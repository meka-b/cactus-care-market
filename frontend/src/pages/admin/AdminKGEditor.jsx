import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminKGEditor() {
  const [familyData, setFamilyData] = useState({ slug: '', name: '', description: '' });
  const [speciesData, setSpeciesData] = useState({ 
    slug: '', scientific_name: '', common_names: '', family_slug: '', genus_slug: '', description: ''
  });

  const createFamily = async () => {
    try {
      await api.post('/kg/families', familyData);
      toast.success('Familya eklendi');
    } catch (err) {
      toast.error('Hata: ' + (err.response?.data?.detail || err.message));
    }
  };

  const createSpecies = async () => {
    try {
      const payload = {
        ...speciesData,
        common_names: speciesData.common_names.split(',').map(s => s.trim())
      };
      await api.post('/kg/species', payload);
      toast.success('Tür eklendi');
    } catch (err) {
      toast.error('Hata: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Knowledge Graph Yönetimi (Basit)</h1>
      
      <Card>
        <CardHeader><CardTitle>Yeni Familya Ekle</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Slug (örn: euphorbiaceae)" value={familyData.slug} onChange={e => setFamilyData({...familyData, slug: e.target.value})} />
          <Input placeholder="Adı (örn: Euphorbiaceae)" value={familyData.name} onChange={e => setFamilyData({...familyData, name: e.target.value})} />
          <Input placeholder="Açıklama" value={familyData.description} onChange={e => setFamilyData({...familyData, description: e.target.value})} />
          <Button onClick={createFamily}>Ekle</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Yeni Tür Ekle</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Slug (örn: euphorbia-trigona)" value={speciesData.slug} onChange={e => setSpeciesData({...speciesData, slug: e.target.value})} />
          <Input placeholder="Latince Adı (örn: Euphorbia trigona)" value={speciesData.scientific_name} onChange={e => setSpeciesData({...speciesData, scientific_name: e.target.value})} />
          <Input placeholder="Yaygın Adları (virgülle ayırın)" value={speciesData.common_names} onChange={e => setSpeciesData({...speciesData, common_names: e.target.value})} />
          <Input placeholder="Familya Slug (örn: euphorbiaceae)" value={speciesData.family_slug} onChange={e => setSpeciesData({...speciesData, family_slug: e.target.value})} />
          <Input placeholder="Açıklama" value={speciesData.description} onChange={e => setSpeciesData({...speciesData, description: e.target.value})} />
          <Button onClick={createSpecies}>Ekle</Button>
        </CardContent>
      </Card>
      
    </div>
  );
}
