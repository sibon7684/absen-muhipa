import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Award, BookOpen, Pencil, Save, X, Plus, Trash2, Globe, Hash, Camera } from 'lucide-react';
import { Card, CardHeader, CardContent, Button, Input } from '../components/ui';

// Tipe data lokal untuk state profil
interface PersonalInfoItem {
  id: string;
  type: 'email' | 'phone' | 'address' | 'other';
  label: string;
  value: string;
}

interface QualificationItem {
  id: string;
  title: string;
  major: string;
  year: string;
  type: 'academic' | 'certification';
}

interface ProfileData {
  name: string;
  role: string;
  nip: string;
  group: string;
  photo?: string; // Menyimpan Base64 string gambar
  personalInfo: PersonalInfoItem[];
  qualifications: QualificationItem[];
}

// Data Default
const DEFAULT_PROFILE: ProfileData = {
  name: "Dede Ridwan, S.Pd",
  role: "Guru Teknologi Informasi dan Komunikasi (TIK)",
  nip: "19850101 201001 1 001",
  group: "III/c",
  photo: undefined,
  personalInfo: [
    { id: '1', type: 'email', label: 'Email', value: 'dede.ridwan@sekolah.sch.id' },
    { id: '2', type: 'phone', label: 'Telepon', value: '+62 812 3456 7890' },
    { id: '3', type: 'address', label: 'Alamat', value: 'Jl. Pendidikan No. 1, Kota Belajar' }
  ],
  qualifications: [
    { id: '1', type: 'academic', title: 'Sarjana Pendidikan (S1)', major: 'Pendidikan Teknik Informatika', year: 'Universitas Pendidikan Indonesia, 2010' },
    { id: '2', type: 'certification', title: 'Sertifikasi Guru Profesional', major: 'Program Profesi Guru (PPG)', year: '2015' }
  ]
};

export const ProfileView: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<ProfileData>(DEFAULT_PROFILE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data from LocalStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('teacher_portal_profile_v1');
    if (savedProfile) {
      try {
        setData(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Gagal memuat profil", e);
      }
    }
  }, []);

  // Save data to LocalStorage whenever it changes
  const handleSave = () => {
    try {
        localStorage.setItem('teacher_portal_profile_v1', JSON.stringify(data));
        setIsEditing(false);
    } catch (e) {
        alert("Gagal menyimpan: Ukuran foto mungkin terlalu besar untuk LocalStorage.");
    }
  };

  const handleCancel = () => {
    // Revert to saved data
    const savedProfile = localStorage.getItem('teacher_portal_profile_v1');
    if (savedProfile) {
      setData(JSON.parse(savedProfile));
    } else {
      setData(DEFAULT_PROFILE);
    }
    setIsEditing(false);
  };

  // --- Handlers for Photo ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi ukuran simpel (misal maks 2MB agar muat di localStorage)
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file terlalu besar. Maksimal 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setData(prev => ({ ...prev, photo: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Handlers for Personal Info ---
  const updateInfo = (id: string, field: keyof PersonalInfoItem, value: string) => {
    setData(prev => ({
      ...prev,
      personalInfo: prev.personalInfo.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addInfo = () => {
    const newItem: PersonalInfoItem = {
      id: Date.now().toString(),
      type: 'other',
      label: 'Label Baru',
      value: 'Isi informasi...'
    };
    setData(prev => ({ ...prev, personalInfo: [...prev.personalInfo, newItem] }));
  };

  const removeInfo = (id: string) => {
    setData(prev => ({ ...prev, personalInfo: prev.personalInfo.filter(item => item.id !== id) }));
  };

  // --- Handlers for Qualifications ---
  const updateQual = (id: string, field: keyof QualificationItem, value: string) => {
    setData(prev => ({
      ...prev,
      qualifications: prev.qualifications.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addQual = () => {
    const newItem: QualificationItem = {
      id: Date.now().toString(),
      type: 'academic',
      title: 'Gelar/Sertifikat Baru',
      major: 'Jurusan/Deskripsi',
      year: 'Tahun'
    };
    setData(prev => ({ ...prev, qualifications: [...prev.qualifications, newItem] }));
  };

  const removeQual = (id: string) => {
    setData(prev => ({ ...prev, qualifications: prev.qualifications.filter(item => item.id !== id) }));
  };

  // Helper to get Icon based on type
  const getInfoIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'address': return MapPin;
      default: return Globe;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Profile with Edit State */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            {/* Avatar Section */}
            <div className="relative group shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center text-primary-600 text-3xl md:text-4xl font-bold shadow-md border-4 border-primary-400 overflow-hidden">
                    {data.photo ? (
                        <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        data.name.slice(0, 2).toUpperCase()
                    )}
                </div>
                
                {isEditing && (
                    <>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-2 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-700 transition-colors border-2 border-white"
                            title="Ubah Foto"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handlePhotoUpload}
                        />
                        {data.photo && (
                             <button 
                                onClick={handleRemovePhoto}
                                className="absolute top-0 right-0 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors border-2 border-white"
                                title="Hapus Foto"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Info Section */}
            <div className="text-center md:text-left space-y-2 flex-1 w-full">
                {isEditing ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div className="space-y-1">
                           <label className="text-xs text-primary-100 uppercase font-bold tracking-wider">Nama Lengkap</label>
                           <input 
                             className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                             value={data.name}
                             onChange={e => setData({...data, name: e.target.value})}
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs text-primary-100 uppercase font-bold tracking-wider">Jabatan / Mapel</label>
                           <input 
                             className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                             value={data.role}
                             onChange={e => setData({...data, role: e.target.value})}
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs text-primary-100 uppercase font-bold tracking-wider">NIP</label>
                           <input 
                             className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                             value={data.nip}
                             onChange={e => setData({...data, nip: e.target.value})}
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs text-primary-100 uppercase font-bold tracking-wider">Golongan</label>
                           <input 
                             className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                             value={data.group}
                             onChange={e => setData({...data, group: e.target.value})}
                           />
                        </div>
                   </div>
                ) : (
                  <>
                      <h1 className="text-2xl md:text-3xl font-bold leading-tight">{data.name}</h1>
                      <p className="text-primary-100 text-lg flex items-center justify-center md:justify-start gap-2">
                        <BookOpen className="w-5 h-5 shrink-0" />
                        {data.role}
                      </p>
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
                        {data.nip && (
                          <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm border border-white/30 flex items-center gap-2">
                            <Hash className="w-3 h-3 text-primary-200" /> {data.nip}
                          </span>
                        )}
                        {data.group && (
                          <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm border border-white/30">
                            Golongan: {data.group}
                          </span>
                        )}
                      </div>
                  </>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info Card */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Informasi Pribadi
            </h3>
            {isEditing && (
              <Button onClick={addInfo} variant="ghost" className="p-1 h-8 w-8 rounded-full bg-primary-50 text-primary-600">
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {data.personalInfo.map((item) => {
              const Icon = getInfoIcon(item.type);
              return (
                <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg ${isEditing ? 'bg-slate-50 border border-slate-200' : 'bg-slate-50'}`}>
                  {isEditing ? (
                    <div className="flex-1 space-y-2 w-full">
                       <div className="flex items-center gap-2">
                          <input 
                             className="text-xs font-bold uppercase text-slate-900 bg-white border-b border-slate-300 focus:border-primary-500 outline-none w-1/3 px-2 py-1 rounded"
                             value={item.label}
                             onChange={(e) => updateInfo(item.id, 'label', e.target.value)}
                             placeholder="Label"
                          />
                          <button onClick={() => removeInfo(item.id)} className="ml-auto text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                       <input 
                         className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-200 outline-none"
                         value={item.value}
                         onChange={(e) => updateInfo(item.id, 'value', e.target.value)}
                         placeholder="Isi informasi..."
                       />
                    </div>
                  ) : (
                    <>
                      <Icon className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 break-words">
                        <p className="text-xs text-slate-500 font-medium uppercase">{item.label}</p>
                        <p className="text-slate-700 font-medium">{item.value}</p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            
            {isEditing && data.personalInfo.length === 0 && (
              <p className="text-center text-sm text-slate-400 italic py-4">Belum ada informasi. Klik + untuk menambah.</p>
            )}
          </CardContent>
        </Card>

        {/* Qualifications Card */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-600" />
              Kualifikasi Akademik
            </h3>
             {isEditing && (
              <Button onClick={addQual} variant="ghost" className="p-1 h-8 w-8 rounded-full bg-primary-50 text-primary-600">
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
             {data.qualifications.map((item) => (
                <div key={item.id} className="relative pl-6 border-l-2 border-slate-200 group">
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${item.type === 'academic' ? 'bg-primary-100 border-primary-500' : 'bg-amber-100 border-amber-500'}`}></div>
                  
                  {isEditing ? (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                           <input 
                             className="w-full font-semibold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary-200 outline-none"
                             value={item.title}
                             onChange={(e) => updateQual(item.id, 'title', e.target.value)}
                             placeholder="Gelar / Sertifikat"
                           />
                           <button onClick={() => removeQual(item.id)} className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                        <input 
                             className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-200 outline-none"
                             value={item.major}
                             onChange={(e) => updateQual(item.id, 'major', e.target.value)}
                             placeholder="Jurusan / Deskripsi"
                        />
                        <div className="flex items-center gap-2">
                           <input 
                             className="w-24 text-xs text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-200 outline-none"
                             value={item.year}
                             onChange={(e) => updateQual(item.id, 'year', e.target.value)}
                             placeholder="Tahun / Ket"
                           />
                           <select 
                              className="text-xs bg-white text-slate-900 border border-slate-300 rounded px-2 py-1 outline-none"
                              value={item.type}
                              onChange={(e) => updateQual(item.id, 'type', e.target.value as any)}
                           >
                             <option value="academic">Akademik</option>
                             <option value="certification">Sertifikasi</option>
                           </select>
                        </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-slate-800">{item.title}</h4>
                      <p className="text-sm text-slate-600">{item.major}</p>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{item.year}</p>
                    </div>
                  )}
                </div>
             ))}

             {isEditing && data.qualifications.length === 0 && (
              <p className="text-center text-sm text-slate-400 italic py-4">Belum ada kualifikasi. Klik + untuk menambah.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating / Sticky Action Bar */}
      <div className="fixed bottom-6 right-6 md:absolute md:bottom-auto md:right-0 md:relative flex justify-end gap-3 z-20">
        {isEditing ? (
          <>
            <Button onClick={handleCancel} variant="danger" className="shadow-lg">
              <X className="w-4 h-4 mr-2" /> Batal
            </Button>
            <Button onClick={handleSave} variant="success" className="shadow-lg ring-2 ring-emerald-200">
              <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)} variant="warning" className="shadow-lg text-white">
            <Pencil className="w-4 h-4 mr-2" /> Edit Profil
          </Button>
        )}
      </div>
    </div>
  );
};