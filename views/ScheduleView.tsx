import React, { useState } from 'react';
import { Calendar, Plus, Save, Trash2, X, Pencil, Check } from 'lucide-react';
import { Card, CardContent, Button, EmptyState, Input, Select } from '../components/ui';
import { ScheduleItem } from '../types';

export const ScheduleView: React.FC = () => {
  // Data Awal (5 Jadwal)
  const [schedule, setSchedule] = useState<ScheduleItem[]>([
    { id: '1', day: 'Senin', time: '07:00 - 08:30', subject: 'TIK Dasar', className: 'X IPA 1', room: 'Lab Komputer 1' },
    { id: '2', day: 'Senin', time: '09:00 - 10:30', subject: 'Pemrograman Dasar', className: 'XI IPA 2', room: 'Lab Komputer 2' },
    { id: '3', day: 'Selasa', time: '08:00 - 09:30', subject: 'Desain Grafis', className: 'XII IPS 1', room: 'Lab Multimedia' },
    { id: '4', day: 'Rabu', time: '10:00 - 11:30', subject: 'Jaringan Dasar', className: 'X IPA 3', room: 'R. Teori 05' },
    { id: '5', day: 'Kamis', time: '13:00 - 14:30', subject: 'Algoritma', className: 'XI IPA 1', room: 'Lab Komputer 1' },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  
  // State untuk Form Tambah Baru
  const [newFormData, setNewFormData] = useState<Partial<ScheduleItem>>({
    day: 'Senin',
    time: '',
    className: '',
    subject: '',
    room: ''
  });

  // State untuk Edit Inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ScheduleItem>>({});

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // --- Handlers CRUD ---

  const handleAdd = () => {
    if (newFormData.day && newFormData.time && newFormData.className && newFormData.subject) {
      const newItem: ScheduleItem = {
        id: Date.now().toString(),
        day: newFormData.day,
        time: newFormData.time,
        className: newFormData.className,
        subject: newFormData.subject,
        room: newFormData.room || '-'
      };
      setSchedule([...schedule, newItem]);
      setIsAdding(false);
      setNewFormData({ day: 'Senin', time: '', className: '', subject: '', room: '' });
    } else {
      alert("Mohon lengkapi data wajib (Hari, Waktu, Mapel, Kelas).");
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      setSchedule(schedule.filter(item => item.id !== id));
    }
  };

  // --- Handlers Edit Inline ---

  const startEditing = (item: ScheduleItem) => {
    setEditingId(item.id);
    setEditFormData({ ...item });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const saveEditing = () => {
    if (editingId && editFormData.day && editFormData.time && editFormData.subject) {
      setSchedule(schedule.map(item => 
        item.id === editingId ? { ...item, ...editFormData } as ScheduleItem : item
      ));
      setEditingId(null);
      setEditFormData({});
    } else {
      alert("Data tidak boleh kosong.");
    }
  };

  const handleEditChange = (field: keyof ScheduleItem, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Jadwal Mengajar</h2>
          <p className="text-slate-500">Kelola jadwal mata pelajaran, kelas, dan ruangan.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? 'secondary' : 'indigo'}>
          {isAdding ? 'Tutup Form' : 'Tambah Jadwal'}
        </Button>
      </div>

      {/* Form Tambah Jadwal */}
      {isAdding && (
        <Card className="animate-in fade-in slide-in-from-top-4 duration-300 bg-blue-50/50 border-primary-100">
          <CardContent className="p-6">
            <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Masukan Data Jadwal Baru
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <Select
                label="Hari"
                options={days.map(d => ({ value: d, label: d }))}
                value={newFormData.day}
                onChange={e => setNewFormData({ ...newFormData, day: e.target.value })}
              />
              <Input
                label="Waktu"
                placeholder="Contoh: 07:00 - 08:30"
                value={newFormData.time}
                onChange={e => setNewFormData({ ...newFormData, time: e.target.value })}
              />
               <Input
                label="Mata Pelajaran"
                placeholder="Nama Mapel"
                value={newFormData.subject}
                onChange={e => setNewFormData({ ...newFormData, subject: e.target.value })}
              />
              <Input
                label="Kelas"
                placeholder="Contoh: X IPA 1"
                value={newFormData.className}
                onChange={e => setNewFormData({ ...newFormData, className: e.target.value })}
              />
              <Input
                label="Ruangan"
                placeholder="Contoh: Lab 1"
                value={newFormData.room}
                onChange={e => setNewFormData({ ...newFormData, room: e.target.value })}
              />
            </div>
            <div className="mt-4 flex justify-end">
               <Button onClick={handleAdd} variant="success">Simpan Data</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabel Jadwal */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-bold">Hari</th>
                <th className="px-6 py-3 font-bold">Waktu</th>
                <th className="px-6 py-3 font-bold">Mata Pelajaran</th>
                <th className="px-6 py-3 font-bold">Kelas</th>
                <th className="px-6 py-3 font-bold">Ruangan</th>
                <th className="px-6 py-3 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <EmptyState
                      icon={Calendar}
                      title="Jadwal Kosong"
                      description="Belum ada jadwal. Silakan tambahkan data baru."
                    />
                  </td>
                </tr>
              ) : (
                schedule.map((item) => {
                  const isEditing = editingId === item.id;
                  
                  return (
                    <tr key={item.id} className="bg-white hover:bg-slate-50 transition-colors">
                      {/* Kolom Hari */}
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {isEditing ? (
                          <select 
                             className="w-full px-2 py-1 bg-white text-slate-900 border border-slate-300 rounded text-sm"
                             value={editFormData.day}
                             onChange={(e) => handleEditChange('day', e.target.value)}
                          >
                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        ) : item.day}
                      </td>

                      {/* Kolom Waktu */}
                      <td className="px-6 py-4">
                        {isEditing ? (
                           <input 
                              className="w-full px-2 py-1 bg-white text-slate-900 border border-slate-300 rounded text-sm"
                              value={editFormData.time}
                              onChange={(e) => handleEditChange('time', e.target.value)}
                           />
                        ) : item.time}
                      </td>

                      {/* Kolom Mapel */}
                      <td className="px-6 py-4">
                        {isEditing ? (
                           <input 
                              className="w-full px-2 py-1 bg-white text-slate-900 border border-slate-300 rounded text-sm"
                              value={editFormData.subject}
                              onChange={(e) => handleEditChange('subject', e.target.value)}
                           />
                        ) : (
                          <span className="font-semibold text-primary-700">{item.subject}</span>
                        )}
                      </td>

                      {/* Kolom Kelas */}
                      <td className="px-6 py-4">
                        {isEditing ? (
                           <input 
                              className="w-24 px-2 py-1 bg-white text-slate-900 border border-slate-300 rounded text-sm"
                              value={editFormData.className}
                              onChange={(e) => handleEditChange('className', e.target.value)}
                           />
                        ) : (
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                            {item.className}
                          </span>
                        )}
                      </td>

                      {/* Kolom Ruangan */}
                      <td className="px-6 py-4 text-slate-500">
                        {isEditing ? (
                           <input 
                              className="w-full px-2 py-1 bg-white text-slate-900 border border-slate-300 rounded text-sm"
                              value={editFormData.room}
                              onChange={(e) => handleEditChange('room', e.target.value)}
                           />
                        ) : item.room}
                      </td>

                      {/* Kolom Aksi */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <>
                              <button 
                                onClick={saveEditing}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Simpan"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={cancelEditing}
                                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors"
                                title="Batal"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => startEditing(item)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};