import React, { useState } from 'react';
import { FileText, Video, ClipboardList, HelpCircle, Plus, File } from 'lucide-react';
import { Card, Button, EmptyState, Input, Select } from '../components/ui';
import { Material, MaterialType } from '../types';

export const MaterialsView: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    title: '',
    type: 'PDF',
    description: ''
  });

  const handleAdd = () => {
    if (newMaterial.title && newMaterial.type && newMaterial.description) {
      const item: Material = {
        id: Date.now().toString(),
        title: newMaterial.title,
        type: newMaterial.type as MaterialType,
        description: newMaterial.description,
        dateAdded: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      };
      setMaterials([item, ...materials]);
      setIsAdding(false);
      setNewMaterial({ title: '', type: 'PDF', description: '' });
    }
  };

  const getTypeStyles = (type: MaterialType) => {
    switch (type) {
      case 'PDF':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-800',
          iconBg: 'bg-rose-100',
          iconColor: 'text-rose-600',
          icon: FileText,
          label: 'Modul PDF'
        };
      case 'VIDEO':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          icon: Video,
          label: 'Video Pembelajaran'
        };
      case 'WORKSHEET':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          icon: ClipboardList,
          label: 'Lembar Kerja'
        };
      case 'EXERCISE':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          icon: HelpCircle,
          label: 'Soal Latihan'
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bahan Ajar</h2>
          <p className="text-slate-500">Kumpulan materi, modul, dan latihan siswa.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "secondary" : "purple"}>
          {isAdding ? "Batal" : "Upload Bahan Ajar"}
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-white border-primary-200 shadow-md">
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">Tambah Bahan Ajar Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                label="Judul Materi"
                placeholder="Contoh: Pengenalan Internet"
                value={newMaterial.title}
                onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
              />
              <Select
                label="Format Materi"
                options={[
                  { value: 'PDF', label: 'Modul PDF' },
                  { value: 'VIDEO', label: 'Video Pembelajaran' },
                  { value: 'WORKSHEET', label: 'Lembar Kerja Siswa (LKS)' },
                  { value: 'EXERCISE', label: 'Soal Latihan / Quiz' },
                ]}
                value={newMaterial.type}
                onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value as MaterialType })}
              />
            </div>
            <div className="mb-4 space-y-1">
               <label className="block text-sm font-medium text-slate-700">Deskripsi Singkat</label>
               <input
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Deskripsi isi materi..."
                value={newMaterial.description}
                onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
               />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAdd} variant="success">Simpan Materi</Button>
            </div>
          </div>
        </Card>
      )}

      {materials.length === 0 ? (
        <EmptyState
          icon={File}
          title="Belum Ada Bahan Ajar"
          description="Mulai dengan mengupload modul, video, atau latihan untuk siswa Anda."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {materials.map((item) => {
            const style = getTypeStyles(item.type);
            const Icon = style.icon;
            
            return (
              <div 
                key={item.id} 
                className={`group relative flex flex-col justify-between rounded-xl border ${style.bg} ${style.border} p-6 shadow-sm hover:shadow-md transition-all duration-300`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-lg ${style.iconBg} ${style.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-white/50 backdrop-blur-sm ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                  
                  <h3 className={`text-lg font-bold mb-2 ${style.text} group-hover:underline decoration-2 underline-offset-2`}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-black/5 mt-auto">
                  <span className="text-xs text-slate-500 font-medium">{item.dateAdded}</span>
                  <button className={`text-xs font-bold px-3 py-1.5 rounded-lg bg-white shadow-sm ${style.text} hover:opacity-80 transition-opacity`}>
                    Buka File
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};