import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Calendar, 
  BookOpen, 
  Files, 
  Users, 
  Menu, 
  X, 
  LogOut,
  GraduationCap,
  Pencil,
  Upload,
  RotateCcw,
  Camera
} from 'lucide-react';
import { ProfileView } from './views/ProfileView';
import { ScheduleView } from './views/ScheduleView';
import { SyllabusView } from './views/SyllabusView';
import { MaterialsView } from './views/MaterialsView';
import { AttendanceView } from './views/AttendanceView';
import { ViewState } from './types';
import { Modal, Input, Button } from './components/ui';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.PROFILE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Portal Identity State (Name & Logo) ---
  const [portalName, setPortalName] = useState("Portal Guru");
  const [portalLogo, setPortalLogo] = useState<string | null>(null);
  
  // Edit Modal State
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempLogo, setTempLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Identity from LocalStorage
  useEffect(() => {
    const savedIdentity = localStorage.getItem('teacher_portal_identity_v1');
    if (savedIdentity) {
      try {
        const parsed = JSON.parse(savedIdentity);
        setPortalName(parsed.name || "Portal Guru");
        setPortalLogo(parsed.logo || null);
      } catch (e) {
        console.error("Failed to load portal identity", e);
      }
    }
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- Identity Handlers ---
  const openIdentityModal = () => {
    setTempName(portalName);
    setTempLogo(portalLogo);
    setIsEditingIdentity(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Limit 2MB
        alert("Ukuran logo terlalu besar (Maks 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveIdentity = () => {
    try {
      const newIdentity = { name: tempName, logo: tempLogo };
      localStorage.setItem('teacher_portal_identity_v1', JSON.stringify(newIdentity));
      setPortalName(tempName);
      setPortalLogo(tempLogo);
      setIsEditingIdentity(false);
    } catch (error) {
      alert("Gagal menyimpan. Ukuran logo mungkin terlalu besar untuk browser ini.");
    }
  };

  const handleResetIdentity = () => {
    setTempName("Portal Guru");
    setTempLogo(null);
  };

  const menuItems = [
    { id: ViewState.PROFILE, label: 'Profil Guru', icon: User },
    { id: ViewState.SCHEDULE, label: 'Jadwal Mengajar', icon: Calendar },
    { id: ViewState.SYLLABUS, label: 'Silabus', icon: BookOpen },
    { id: ViewState.MATERIALS, label: 'Bahan Ajar', icon: Files },
    { id: ViewState.ATTENDANCE, label: 'Absen Siswa', icon: Users },
  ];

  const renderView = () => {
    switch (currentView) {
      case ViewState.PROFILE: return <ProfileView />;
      case ViewState.SCHEDULE: return <ScheduleView />;
      case ViewState.SYLLABUS: return <SyllabusView />;
      case ViewState.MATERIALS: return <MaterialsView />;
      case ViewState.ATTENDANCE: return <AttendanceView />;
      default: return <ProfileView />;
    }
  };

  // Helper Component for Logo Rendering
  const PortalLogo = ({ className = "w-6 h-6" }: { className?: string }) => {
    if (portalLogo) {
      return <img src={portalLogo} alt="Logo" className={`${className} object-contain rounded`} />;
    }
    return <GraduationCap className={className} />;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans print:bg-white print:block print:h-auto print:overflow-visible">
      
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm print:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - HIDDEN ON PRINT */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 shadow-xl md:shadow-none transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto print:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100 group relative">
             <div className="flex items-center gap-3 text-primary-600 w-full overflow-hidden">
                <div className="bg-transparent text-primary-600 p-1.5 rounded-lg shrink-0">
                  <PortalLogo className="w-8 h-8" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 truncate" title={portalName}>
                  {portalName}
                </span>
             </div>
             
             {/* Edit Trigger (Visible on Hover in Desktop) */}
             <button 
                onClick={openIdentityModal}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                title="Ubah Nama & Logo Portal"
             >
               <Pencil className="w-4 h-4" />
             </button>

             <button onClick={toggleSidebar} className="md:hidden ml-auto text-slate-500">
               <X className="w-6 h-6" />
             </button>
          </div>

          <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-100">
             <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
               <LogOut className="w-4 h-4" /> Keluar
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content - UPDATED FOR PRINT */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden print:overflow-visible print:h-auto print:block">
        {/* Mobile Header - HIDDEN ON PRINT */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between sticky top-0 z-10 print:hidden">
          <div className="flex items-center gap-2 overflow-hidden">
             <div className="bg-transparent text-primary-600 p-1 rounded shrink-0">
                <PortalLogo className="w-7 h-7" />
             </div>
             <span className="font-bold text-slate-900 truncate max-w-[200px]">{portalName}</span>
          </div>
          <button onClick={toggleSidebar} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Main Body - UPDATED FOR PRINT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible print:h-auto print:block">
          <div className="max-w-6xl mx-auto animate-in fade-in duration-500 print:max-w-none print:w-full">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Edit Identity Modal */}
      <Modal
        isOpen={isEditingIdentity}
        onClose={() => setIsEditingIdentity(false)}
        title="Ubah Identitas Portal"
      >
        <div className="space-y-6 text-left">
          {/* Logo Upload Preview */}
          <div className="flex flex-col items-center gap-3">
             <div className="w-20 h-20 bg-primary-100 rounded-xl flex items-center justify-center border-2 border-dashed border-primary-300 overflow-hidden relative group">
                {tempLogo ? (
                  <img src={tempLogo} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <GraduationCap className="w-8 h-8 text-primary-400" />
                )}
                
                {/* Upload Trigger Overlay */}
                <div 
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-6 h-6 text-white" />
                </div>
             </div>
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleLogoUpload} 
               className="hidden" 
               accept="image/*"
             />
             <div className="flex gap-2">
               <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs py-1 h-8"
               >
                 <Upload className="w-3 h-3 mr-1" /> Ganti Logo
               </Button>
             </div>
          </div>

          {/* Name Input */}
          <Input 
            label="Nama Portal"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="Contoh: Portal SMAN 1 Jakarta"
          />

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
             <Button onClick={handleSaveIdentity} className="w-full">
               Simpan Perubahan
             </Button>
             <Button onClick={handleResetIdentity} variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
               <RotateCcw className="w-4 h-4 mr-2" /> Reset ke Default
             </Button>
          </div>
        </div>
      </Modal>

      {/* Helper Styles for Print Reset */}
      <style>{`
        @media print {
          body, html, #root {
            height: auto !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;