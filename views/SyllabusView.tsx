import React, { useState } from 'react';
import { FileText, Download, ExternalLink, Pencil, Save, X, Cloud, Info } from 'lucide-react';
import { Card, CardContent, Button, Modal, Input } from '../components/ui';

interface SyllabusCard {
  id: string;
  grade: string; // Kelas X, XI, XII
  title: string;
  description: string;
  driveLink: string;
  lastUpdated: string;
}

// Data Awal Default
const INITIAL_SYLLABUS: SyllabusCard[] = [
  {
    id: '1',
    grade: 'Kelas X',
    title: 'Informatika Dasar & Etika Digital',
    description: 'Mencakup pengenalan hardware, software, sistem operasi, serta pemahaman mendalam tentang kewargaan digital, etika internet, dan dasar-dasar computational thinking.',
    driveLink: '',
    lastUpdated: '10 Juli 2024'
  },
  {
    id: '2',
    grade: 'Kelas XI',
    title: 'Aplikasi Perkantoran & Logika Algoritma',
    description: 'Pendalaman Microsoft Office (Word, Excel, PowerPoint) tingkat lanjut untuk produktivitas kerja, serta pengantar logika algoritma pemrograman dasar menggunakan C++ atau Python.',
    driveLink: '',
    lastUpdated: '12 Juli 2024'
  },
  {
    id: '3',
    grade: 'Kelas XII',
    title: 'Desain Grafis & Jaringan Komputer',
    description: 'Dasar-dasar desain grafis menggunakan tools vektor (CorelDraw/Illustrator) dan bitmap (Photoshop), serta pengenalan topologi dan konfigurasi jaringan komputer sederhana.',
    driveLink: '',
    lastUpdated: '15 Juli 2024'
  }
];

export const SyllabusView: React.FC = () => {
  const [syllabusList, setSyllabusList] = useState<SyllabusCard[]>(INITIAL_SYLLABUS);
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState<SyllabusCard | null>(null);

  // --- Handlers ---

  const handleEdit = (item: SyllabusCard) => {
    setEditItem({ ...item });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editItem) {
      setSyllabusList(prev => prev.map(item => item.id === editItem.id ? editItem : item));
      setIsEditing(false);
      setEditItem(null);
    }
  };

  const handleDownload = (link: string) => {
    if (!link || link === '#') {
      alert("Link Google Drive belum diatur oleh Guru. Silakan edit untuk memasukkan URL.");
    } else {
      window.open(link, '_blank');
    }
  };

  // Helper Styles
  const getGradeStyle = (grade: string) => {
    if (grade.includes('X') && !grade.includes('XI')) return { color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200', bar: 'bg-blue-600' }; // Kelas X
    if (grade.includes('XI') && !grade.includes('XII')) return { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', bar: 'bg-emerald-600' }; // Kelas XI
    return { color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200', bar: 'bg-purple-600' }; // Kelas XII
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Silabus & Perangkat Ajar</h2>
          <p className="text-slate-500">Unduh dokumen silabus TIK untuk setiap tingkatan kelas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {syllabusList.map((item) => {
          const style = getGradeStyle(item.grade);
          
          return (
            <Card key={item.id} className="flex flex-col h-full hover:shadow-lg transition-all duration-300 group">
              {/* Colored Top Bar */}
              <div className={`h-2 w-full ${style.bar}`}></div>
              
              <CardContent className="flex-1 p-6 flex flex-col">
                {/* Header Card */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${style.bg} ${style.color}`}>
                    {item.grade}
                  </span>
                  <button 
                    onClick={() => handleEdit(item)}
                    className="text-slate-300 hover:text-primary-600 transition-colors p-1"
                    title="Edit Link & Deskripsi"
                  >
                    <Pencil size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                        <FileText size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {item.title}
                    </h3>
                </div>
                
                <p className="text-slate-600 text-sm mb-6 flex-1 leading-relaxed">
                  {item.description}
                </p>

                {/* Footer Action */}
                <div className="mt-auto pt-5 border-t border-slate-100">
                  <Button 
                    onClick={() => handleDownload(item.driveLink)}
                    className="w-full flex items-center justify-center gap-2"
                    variant="teal"
                  >
                    <Cloud size={18} />
                    Download Silabus
                  </Button>
                  <div className="text-center mt-3 flex items-center justify-center gap-1 text-[10px] text-slate-400">
                    <Info size={10} />
                    <span>File via Google Drive • Update: {item.lastUpdated}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal Edit */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Edit Data Silabus"
      >
        {editItem && (
          <div className="space-y-4">
             <Input 
                label="Judul Materi"
                value={editItem.title}
                onChange={(e) => setEditItem({...editItem, title: e.target.value})}
             />
             
             <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Deskripsi</label>
                <textarea 
                  className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] text-sm"
                  value={editItem.description}
                  onChange={(e) => setEditItem({...editItem, description: e.target.value})}
                />
             </div>

             <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Link Google Drive</label>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-slate-100 rounded-l-lg border border-r-0 border-slate-300 flex items-center justify-center text-slate-500 shrink-0">
                        <Cloud size={18} />
                    </div>
                    <input 
                       className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                       placeholder="https://drive.google.com/..."
                       value={editItem.driveLink}
                       onChange={(e) => setEditItem({...editItem, driveLink: e.target.value})}
                    />
                </div>
                <p className="text-[10px] text-slate-500">Pastikan link Google Drive diset ke "Anyone with the link can view".</p>
             </div>

             <Button onClick={handleSave} variant="success" className="w-full mt-4">
                <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
             </Button>
          </div>
        )}
      </Modal>

    </div>
  );
};