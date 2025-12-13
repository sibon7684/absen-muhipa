import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Save, CheckCheck, CheckCircle, XCircle, AlertCircle, Clock, Check, X, Settings, Link2, Search, Loader2, Info, AlertTriangle, FileText, List, CalendarRange, Filter, Code, Copy, Printer, School } from 'lucide-react';
import { Card, CardHeader, CardContent, Button, EmptyState, Input, Select, Modal } from '../components/ui';
import { Student } from '../types';

export const AttendanceView: React.FC = () => {
  // View Mode: 'input' = Halaman Absen Harian, 'recap' = Halaman Rekap
  const [viewMode, setViewMode] = useState<'input' | 'recap'>('input');

  // --- EXISTING STATES (Input Absen) ---
  const [students, setStudents] = useState<Student[]>([]);
  const [filterClass, setFilterClass] = useState<string>(''); // Default empty initially
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeClass, setActiveClass] = useState<string>('-');
  const [activeDate, setActiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // URL Default sesuai permintaan
  const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx0VCFCJohcQ1_yY7q0SUCjSyatLZzz6leb6kLezr0asHOkKUZrZqMzBytJJP4wUxfb/exec';
  const [scriptUrl, setScriptUrl] = useState(DEFAULT_SCRIPT_URL);
  
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false); 
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false); // State untuk modal script
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'info'
  });
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNIS, setNewStudentNIS] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('');

  // --- NEW STATES (Rekap Absen) ---
  const [recapName, setRecapName] = useState('');
  const [recapClass, setRecapClass] = useState<string>('');
  const [recapDate, setRecapDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recapPeriod, setRecapPeriod] = useState<string>('harian'); 
  const [recapData, setRecapData] = useState<any[]>([]);
  const [isLoadingRecap, setIsLoadingRecap] = useState(false);

  // State untuk Opsi Kelas (Dinamis dari Spreadsheet)
  const [classOptions, setClassOptions] = useState<{ value: string; label: string }[]>([
      { value: '', label: 'Memuat Data Kelas...' }
  ]);

  const periodOptions = [
    { value: 'harian', label: 'Harian' },
    { value: 'mingguan', label: 'Mingguan' },
    { value: 'bulanan', label: 'Bulanan' },
  ];

  // KODE SCRIPT YANG DIPERBARUI (ANTI DUPLIKASI / UPSERT)
  const GOOGLE_SCRIPT_CODE = `
// ==========================================
// KODE GOOGLE APPS SCRIPT (ANTI DUPLIKASI - UPDATE OR INSERT)
// ==========================================

function doGet(e) {
  var op = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (op == 'test') return ContentService.createTextOutput("Connection Success");

  // --- GET DATA SISWA ---
  if (op == 'get') {
    var sheet = ss.getSheetByName('Master Data Siswa');
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({error: "Sheet 'Master Data Siswa' tidak ditemukan"}));
    var data = sheet.getDataRange().getValues();
    var result = [];
    for (var i = 1; i < data.length; i++) {
      result.push({ id: data[i][0], nama: data[i][1], kelas: data[i][2], nis: data[i][3] });
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  // --- GET REKAP ABSEN ---
  if (op == 'get_recap') {
    var targetSheetName = e.parameter.kelas || e.parameter.class || 'Data Absensi';
    var sheet = ss.getSheetByName(targetSheetName);
    
    if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({data: [], message: "Sheet tidak ditemukan"})).setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheet.getDataRange().getDisplayValues(); 
    if (data.length === 0) return ContentService.createTextOutput(JSON.stringify({data: []})).setMimeType(ContentService.MimeType.JSON);

    var headers = data[0].map(function(h) { return h.toLowerCase(); });
    
    var result = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var obj = {};
      headers.forEach(function(header, index) {
        if (header.includes('nama')) obj.nama = row[index];
        else if (header.includes('kelas')) obj.kelas = row[index];
        else if (header.includes('status')) obj.status = row[index];
        else if (header.includes('tanggal')) obj.tanggal = row[index];
        else if (header.includes('waktu')) obj.waktu = row[index];
        else if (header.includes('nis')) obj.nis = row[index];
      });
      obj.id = "ROW-" + i;
      result.push(obj);
    }
    return ContentService.createTextOutput(JSON.stringify({data: result})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Kunci script untuk menghindari race condition
  
  try {
    var param = JSON.parse(e.postData.contents);
    
    if (param.action == 'save') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var dataRows = param.data;
      
      // 1. Kelompokkan data berdasarkan KELAS
      var rowsByClass = {};
      
      dataRows.forEach(function(item) {
        var className = item['Kelas'] || 'Unassigned';
        if (!rowsByClass[className]) rowsByClass[className] = [];
        
        // Pemrosesan Waktu (Strict HH:mm:ss)
        var rawTime = item['Waktu'] || item['Waktu Input'] || '';
        var strTime = rawTime.toString();
        var cleanTime = "";
        var timeMatch = strTime.match(/(\\d{1,2}:\\d{2}:\\d{2})/);
        if (timeMatch) cleanTime = timeMatch[0];
        else {
            var shortMatch = strTime.match(/(\\d{1,2}:\\d{2})/);
            if (shortMatch) cleanTime = shortMatch[0];
            else cleanTime = strTime;
        }
        var finalTimeValue = "'" + cleanTime;

        // Pemrosesan Tanggal (Strict YYYY-MM-DD)
        var rawDate = item['Tanggal'] || new Date();
        var cleanDate = rawDate.toString().substring(0, 10);
        var finalDateValue = "'" + cleanDate;

        rowsByClass[className].push([
          item['No'],
          item['Nama'] || item['Nama Siswa'],
          item['Kelas'],
          item['Status'],
          finalDateValue,
          finalTimeValue
        ]);
      });
      
      // 2. Simpan ke sheet masing-masing dengan LOGIKA CEK DUPLIKASI
      for (var className in rowsByClass) {
          var sheet = ss.getSheetByName(className);
          if (!sheet) {
            sheet = ss.insertSheet(className);
            sheet.appendRow(['No', 'Nama Siswa', 'Kelas', 'Status', 'Tanggal', 'Waktu Input']);
          }
          
          var newRows = rowsByClass[className];
          
          // Ambil data yang sudah ada untuk pengecekan
          var existingData = [];
          var lastRow = sheet.getLastRow();
          if (lastRow > 1) {
             // Ambil range A2:F[last] (6 Kolom)
             existingData = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
          }

          var rowsToAppend = [];
          var isUpdated = false;

          // Loop setiap data baru yang masuk
          newRows.forEach(function(newRow) {
             var newName = newRow[1].toString().trim().toLowerCase(); // Nama (Kolom B / Index 1)
             var newDate = newRow[4].toString().replace(/'/g, "").trim(); // Tanggal (Kolom E / Index 4)
             
             var matchIndex = -1;

             // Cek apakah data (Nama & Tanggal) sudah ada di sheet?
             for (var i = 0; i < existingData.length; i++) {
                var existingName = existingData[i][1].toString().trim().toLowerCase();
                var existingDateRaw = existingData[i][4];
                var existingDate = "";

                if (existingDateRaw instanceof Date) {
                   existingDate = Utilities.formatDate(existingDateRaw, Session.getScriptTimeZone(), "yyyy-MM-dd");
                } else {
                   existingDate = existingDateRaw.toString().replace(/'/g, "").trim().substring(0, 10);
                }

                if (newName === existingName && newDate === existingDate) {
                   matchIndex = i;
                   break;
                }
             }

             if (matchIndex > -1) {
                // DATA DITEMUKAN: UPDATE STATUS & WAKTU
                existingData[matchIndex][3] = newRow[3]; // Update Status (Kolom D / Index 3)
                existingData[matchIndex][5] = newRow[5]; // Update Waktu (Kolom F / Index 5)
                isUpdated = true;
             } else {
                // DATA BARU: TAMBAHKAN KE ANTRIAN APPEND
                rowsToAppend.push(newRow);
             }
          });

          // Tulis ulang data yang diupdate (jika ada update)
          if (isUpdated && existingData.length > 0) {
             sheet.getRange(2, 1, existingData.length, 6).setValues(existingData);
          }

          // Append data yang benar-benar baru (jika ada)
          if (rowsToAppend.length > 0) {
             var startRow = sheet.getLastRow() + 1;
             sheet.getRange(startRow, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
          }
      }
      
      return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
  `;

  // Load URL from LocalStorage or use Default
  useEffect(() => {
    const savedUrl = localStorage.getItem('teacher_portal_script_url_v4'); 
    if (savedUrl) {
        setScriptUrl(savedUrl);
    }
  }, []);

  // Helper: Safe URL Construction
  const getSafeUrl = (baseUrl: string, params: Record<string, string>) => {
    try {
      if (!baseUrl || baseUrl.trim() === '') return null;
      const url = new URL(baseUrl.trim());
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      return url.toString();
    } catch (e) {
      console.error("Invalid URL:", baseUrl);
      return null;
    }
  };

  // --- FETCH CLASS LIST DARI SPREADSHEET ---
  useEffect(() => {
    const fetchClassList = async () => {
        if (!scriptUrl) return;

        try {
            const fetchUrl = getSafeUrl(scriptUrl, { 
                action: 'get', 
                sheet: 'Master Data Siswa',
                _t: Date.now().toString() 
            });
            if (!fetchUrl) return;

            const response = await fetch(fetchUrl, { method: 'GET', redirect: 'follow' });
            if (!response.ok) return;
            
            const responseBody = await response.json();
            let rawData: any[] = [];
            
            if (Array.isArray(responseBody)) rawData = responseBody;
            else if (responseBody['Master Data Siswa']) rawData = responseBody['Master Data Siswa'];
            else if (responseBody['data']) rawData = responseBody['data'];

            if (!Array.isArray(rawData) || rawData.length === 0) {
                setClassOptions([{ value: 'X', label: 'Data Kelas Kosong/Gagal' }]);
                return;
            }

            // Ekstrak Kelas Unik
            const uniqueClasses = new Set<string>();
            rawData.forEach((row: any, index: number) => {
                if (index === 0) return; // Skip header
                
                let className = '';
                // Deteksi struktur data (Array vs Object)
                if (Array.isArray(row) && row.length >= 3) {
                    // Asumsi Kolom C (Index 2) adalah Kelas
                    className = row[2] ? String(row[2]).trim() : '';
                } else if (typeof row === 'object') {
                    // Cari properti yang mirip 'kelas'
                    const key = Object.keys(row).find(k => k.toLowerCase().includes('kelas') || k.toLowerCase() === 'class' || k.toLowerCase() === 'grade');
                    if (key) className = String(row[key]).trim();
                }

                if (className) {
                    uniqueClasses.add(className);
                }
            });

            // Konversi ke format Options dan Sortir
            const sortedOptions = Array.from(uniqueClasses).sort().map(c => ({
                value: c,
                label: c
            }));

            if (sortedOptions.length > 0) {
                setClassOptions(sortedOptions);
                // Set default filter ke kelas pertama jika belum ada
                if (!filterClass) setFilterClass(sortedOptions[0].value);
                if (!recapClass) setRecapClass(sortedOptions[0].value);
                if (!newStudentClass) setNewStudentClass(sortedOptions[0].value);
            } else {
                setClassOptions([{ value: '', label: 'Tidak ada data kelas' }]);
            }

        } catch (error) {
            console.error("Gagal memuat daftar kelas:", error);
            setClassOptions([{ value: 'X', label: 'Gagal memuat kelas (Gunakan Default)' }]);
        }
    };

    fetchClassList();
  }, [scriptUrl]); // Re-run jika URL script berubah

  // Helper: Trigger Toast
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Helper: Copy to Clipboard
  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(GOOGLE_SCRIPT_CODE);
    triggerToast('Kode script berhasil disalin!', 'success');
  };

  // Helper: Handle Print
  const handlePrint = () => {
    if (recapData.length === 0) {
      triggerToast('Tampilkan data terlebih dahulu sebelum mencetak.', 'info');
      return;
    }
    
    // Ubah judul dokumen sementara untuk nama file PDF yang rapi
    const oldTitle = document.title;
    const safeClass = recapClass.replace(/[^a-zA-Z0-9]/g, '_') || 'Semua_Kelas';
    const safeDate = recapDate;
    document.title = `Rekap_Absen_${safeClass}_${safeDate}`;
    
    // Gunakan setTimeout untuk memastikan UI terupdate (jika ada) dan memberi waktu browser
    setTimeout(() => {
        window.print();
        document.title = oldTitle;
    }, 100);
  };

  // --- LOGIC: Input Absen ---
  const filteredStudents = students.filter(s => {
    const studentClass = s.className ? s.className.toString().toUpperCase() : '';
    const currentFilter = activeClass.toString().toUpperCase();
    return studentClass === currentFilter || studentClass.startsWith(currentFilter + ' ');
  });

  const handleShowList = async () => {
    if (!filterClass) {
        triggerToast('Silakan pilih kelas terlebih dahulu.', 'error');
        return;
    }
    setActiveClass(filterClass);
    setActiveDate(filterDate);
    if (scriptUrl) {
      setIsLoadingList(true);
      try {
        // Add timestamp to prevent caching
        const fetchUrl = getSafeUrl(scriptUrl, { 
            action: 'get', 
            sheet: 'Master Data Siswa',
            _t: Date.now().toString() 
        });
        
        if (!fetchUrl) throw new Error("Format URL tidak valid");
        const response = await fetch(fetchUrl, { method: 'GET', redirect: 'follow' });
        if (!response.ok) throw new Error(`Network Error: ${response.status}`);
        const responseBody = await response.json();
        
        let rawData: any[] = [];
        if (Array.isArray(responseBody)) rawData = responseBody;
        else if (responseBody['Master Data Siswa']) rawData = responseBody['Master Data Siswa'];
        else if (responseBody['data']) rawData = responseBody['data'];
        
        if (!Array.isArray(rawData) || rawData.length === 0) throw new Error("Data kosong.");

        const mappedStudents: Student[] = [];
        rawData.forEach((row: any, index: number) => {
           if (index === 0) return; // Skip header simple check
           let id = `row-${index}`, name = 'Siswa', className = 'Unassigned', nis = '-';
           
           if (Array.isArray(row) && row.length >= 2) {
               id = row[0] ? String(row[0]) : id;
               name = row[1] ? String(row[1]) : name;
               className = row[2] ? String(row[2]) : className;
               nis = row[3] ? String(row[3]) : id;
           } else if (typeof row === 'object') {
               if (row.id) id = row.id;
               if (row.nama) name = row.nama;
               if (row.kelas) className = row.kelas;
               else {
                   // Fallback cari key mirip kelas
                   const kKey = Object.keys(row).find(k => k.toLowerCase().includes('kelas'));
                   if(kKey) className = row[kKey];
               }
               if (row.nis) nis = row.nis;
           }
           mappedStudents.push({ id, name, nis, className, status: 'UNMARKED' });
        });
        setStudents(mappedStudents);
        triggerToast(`Berhasil memuat ${mappedStudents.length} data siswa total.`, 'success');
      } catch (error: any) {
        console.error("Fetch Error:", error);
        let msg = error.message;
        if (msg.includes("Failed to fetch")) msg = "Gagal koneksi. Cek URL atau deploy sebagai 'Anyone'.";
        triggerToast(msg, 'error');
      } finally {
        setIsLoadingList(false);
      }
    } else {
       triggerToast('Masukkan URL Script terlebih dahulu.', 'error');
    }
  };

  const handleSaveUrl = () => {
    const cleanUrl = scriptUrl.trim();
    setScriptUrl(cleanUrl);
    localStorage.setItem('teacher_portal_script_url_v4', cleanUrl); 
    triggerToast('URL berhasil disimpan.', 'success');
  };

  const handleTestConnection = async () => {
    if (!scriptUrl) return triggerToast('URL kosong.', 'error');
    setIsTesting(true);
    try {
      const fetchUrl = getSafeUrl(scriptUrl, { action: 'test', _t: Date.now().toString() });
      if (!fetchUrl) throw new Error("Invalid URL");
      await fetch(fetchUrl, { method: 'GET', redirect: 'follow' });
      triggerToast('Koneksi Berhasil!', 'success');
    } catch (error) {
      triggerToast('Koneksi Gagal / URL Salah.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const addStudent = () => {
    if (newStudentName && newStudentNIS) {
      setStudents([...students, {
          id: Date.now().toString(),
          name: newStudentName,
          nis: newStudentNIS,
          className: newStudentClass,
          status: 'UNMARKED'
        }]);
      setNewStudentName('');
      setNewStudentNIS('');
      triggerToast('Siswa manual ditambahkan.', 'info');
    }
  };

  const updateStatus = (id: string, status: Student['status']) => {
    setStudents(students.map(s => s.id === id ? { ...s, status } : s));
  };

  const markAllPresent = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    setStudents(prev => prev.map(s => filteredIds.includes(s.id) ? { ...s, status: 'PRESENT' as const } : s));
    triggerToast('Semua siswa ditandai Hadir.', 'info');
  };

  const saveAttendance = async () => {
    if (filteredStudents.length === 0) return;
    setIsSaving(true);
    
    // Generate Time String (HH:mm:ss)
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    // Note: React now sends pure string. The Script handles the regex extraction and apostrophe.
    const payload = filteredStudents.map((s, index) => {
      let statusIndo = 'Tanpa Keterangan';
      if (s.status === 'PRESENT') statusIndo = 'Hadir';
      else if (s.status === 'SICK') statusIndo = 'Sakit';
      else if (s.status === 'PERMIT') statusIndo = 'Izin';
      else if (s.status === 'ABSENT') statusIndo = 'Alpa';
      
      return { 
          No: index + 1, 
          Nama: s.name, 
          'Nama Siswa': s.name,
          Kelas: s.className, 
          Status: statusIndo, 
          Tanggal: activeDate, 
          Waktu: timeString, // Send simple time string
          'Waktu Input': timeString
      };
    });

    try {
      if (scriptUrl) {
        await fetch(scriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save', sheet: 'Data Absensi', data: payload })
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      triggerToast('Absensi berhasil disimpan.', 'success');
    } catch (error) {
      setShowErrorModal(true);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Helper: Normalize Date String to YYYY-MM-DD
  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const s = String(dateStr).trim();
    
    // If ISO or already YYYY-MM-DD
    if (s.match(/^\d{4}-\d{2}-\d{2}/)) {
        return s.substring(0, 10);
    }
    
    // If DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (dmy) {
        // Returns YYYY-MM-DD
        return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }
    
    // Fallback: return as is
    return s;
  };

  // --- LOGIC: Rekap Absen ---
  const handleShowRecap = async () => {
    setIsLoadingRecap(true);
    setRecapData([]); // Reset data view

    if (!scriptUrl) {
        triggerToast("URL Script kosong. Silakan cek menu koneksi.", "error");
        setIsLoadingRecap(false);
        return;
    }

    try {
        const params: Record<string, string> = { 
          action: 'get_recap', 
          period: recapPeriod,
          periode: recapPeriod,
          class: recapClass, // Backend now uses this to select the sheet
          kelas: recapClass,
          date: recapDate,
          tanggal: recapDate,
          _t: Date.now().toString() // Cache buster
        };
        
        if (recapName.trim()) {
            params.name = recapName.trim();
            params.nama = recapName.trim();
        }

        const fetchUrl = getSafeUrl(scriptUrl, params);
        if (!fetchUrl) throw new Error("URL Script tidak valid");

        const response = await fetch(fetchUrl, { method: 'GET', redirect: 'follow' });
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const textResponse = await response.text();
        let json;
        try {
            json = JSON.parse(textResponse);
        } catch (e) {
            console.error("Respon bukan JSON:", textResponse);
            throw new Error("Respon server tidak valid (Bukan JSON).");
        }

        let rawData: any[] = [];
        if (Array.isArray(json)) rawData = json;
        else if (json.data && Array.isArray(json.data)) rawData = json.data;
        else if (json.records && Array.isArray(json.records)) rawData = json.records;
        else if (json.result && Array.isArray(json.result)) rawData = json.result;

        let mappedData = rawData.map((item: any, index: number) => {
             // --- VARIABLES FOR EXTRACTED DATA ---
             let no: any = index + 1;
             let id: any = `ROW-${index}`;
             let nis: any = '-';
             let nama: any = '-';
             let kelas: any = '-';
             let status: any = '-';
             let rawTanggal: any = '';
             let rawWaktu: any = '';

             // --- DETECT FORMAT: ARRAY (Sheet Rows) vs OBJECT (JSON) ---
             if (Array.isArray(item)) {
                 // Format Array: [No, Nama Siswa, Kelas, Status, Tanggal, Waktu Input, ...]
                 if (item.length >= 6) {
                    no = item[0] || (index + 1);
                    nama = item[1];
                    kelas = item[2];
                    status = item[3];
                    rawTanggal = item[4];
                    rawWaktu = item[5];
                 } else {
                     nama = item[1] || '-';
                     kelas = item[2] || '-';
                     status = item[3] || '-';
                 }
             } else {
                 // Format Object
                 const getVal = (keys: string[]) => {
                     for (const key of keys) {
                         if (item[key] !== undefined && item[key] !== null) return item[key];
                         const lowerKeyMatch = Object.keys(item).find(k => k.toLowerCase() === key.toLowerCase());
                         if (lowerKeyMatch && item[lowerKeyMatch] !== undefined) return item[lowerKeyMatch];
                     }
                     return null;
                 };

                 no = getVal(['no', 'nomor']) || index + 1;
                 id = getVal(['id', 'uid']) || `ROW-${index}`;
                 nis = getVal(['nis', 'induk', 'nipd']) || '-';
                 nama = getVal(['nama', 'nama siswa', 'name', 'student_name', 'siswa', 'full_name']) || '-';
                 kelas = getVal(['kelas', 'class', 'rombel', 'grade']) || '-';
                 status = getVal(['status', 'keterangan', 'kehadiran', 'attendance']) || '-';
                 rawTanggal = getVal(['tanggal', 'date']) || '';
                 rawWaktu = getVal(['waktu', 'waktu input', 'time', 'timestamp', 'created', 'created_at']) || '';
             }

             // --- CLEAN DATE & TIME ---
             let cleanDate = normalizeDate(rawTanggal);
             if (!cleanDate) cleanDate = String(rawTanggal || '-');

             let cleanTime = '-';
             const timeSource = String(rawWaktu || rawTanggal || '').trim();
             const tokens = timeSource.split(/[\sT]+/);
             const timeToken = tokens.find(t => t.includes(':') && !t.includes('/') && !t.includes('-'));
             
             if (timeToken) {
                 cleanTime = timeToken.split('.')[0].replace('Z', ''); 
             } else {
                 const match = timeSource.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
                 if (match) cleanTime = match[0];
             }

             return {
                 no, id, nis, nama, kelas, 
                 tanggal: cleanDate, 
                 waktu: cleanTime, 
                 status
             };
        });

        // --- ROBUST FILTERING ---
        if (mappedData.length > 0) {
            mappedData = mappedData.filter(item => {
                const searchName = recapName.trim().toLowerCase();
                const itemNama = (item.nama || '').toString().toLowerCase();
                // Normalize class comparison
                const filterClassStr = recapClass.trim().replace(/\s+/g, '').toUpperCase();
                const itemClassStr = (item.kelas || '').toString().replace(/\s+/g, '').toUpperCase();
                
                const filterDateStr = normalizeDate(recapDate);
                const itemDateStr = normalizeDate(item.tanggal);

                // Name Match
                let isNameMatch = true;
                if (searchName !== '') {
                    isNameMatch = itemNama.includes(searchName);
                }

                // Class Match (Loose)
                // Jika sheet sudah terpisah, data pasti milik kelas itu.
                // Tapi kita cek just in case datanya campur.
                let isClassMatch = true;
                if (filterClassStr) {
                    isClassMatch = itemClassStr.includes(filterClassStr) || filterClassStr.includes(itemClassStr);
                }

                // Date Match
                let isDateMatch = true;
                if (recapPeriod === 'harian') {
                    // Try exact match first
                    if (itemDateStr && filterDateStr) {
                         isDateMatch = (itemDateStr === filterDateStr);
                    } else {
                         // Fallback to substring match if normalization fails
                         isDateMatch = item.tanggal.includes(recapDate);
                    }
                } else if (recapPeriod === 'bulanan') {
                    if (itemDateStr && filterDateStr) {
                        isDateMatch = itemDateStr.substring(0, 7) === filterDateStr.substring(0, 7);
                    } else {
                         isDateMatch = item.tanggal.includes(recapDate.substring(0, 7));
                    }
                }

                return isNameMatch && isClassMatch && isDateMatch;
            });
        }
        
        mappedData = mappedData.map((item, idx) => ({ ...item, no: idx + 1 }));
        setRecapData(mappedData);

        if (mappedData.length > 0) {
            triggerToast(`Ditemukan ${mappedData.length} data.`, 'success');
        } else {
            triggerToast('Data tidak ditemukan dengan filter tersebut. Pastikan format tanggal di spreadsheet sesuai.', 'info');
        }

    } catch (error: any) {
        console.error("Error fetching recap:", error);
        let msg = error.message;
        if (msg.includes("Failed to fetch")) {
            msg = "Gagal koneksi. Cek internet atau pastikan Script dideploy 'Anyone'.";
        }
        triggerToast(msg, 'error');
    } finally {
        setIsLoadingRecap(false);
    }
  };

  const getStatusBadge = (status: string) => {
      const s = status ? status.toString().toLowerCase() : '';
      if (s === 'hadir' || s === 'present') return <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200 print:bg-transparent print:border-none print:text-black print:p-0">Hadir</span>;
      if (s === 'sakit' || s === 'sick') return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-200 print:bg-transparent print:border-none print:text-black print:p-0">Sakit</span>;
      if (s === 'izin' || s === 'permit') return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 print:bg-transparent print:border-none print:text-black print:p-0">Izin</span>;
      if (s === 'alpa' || s === 'absent') return <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200 print:bg-transparent print:border-none print:text-black print:p-0">Alpa</span>;
      return <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs border border-slate-200 print:bg-transparent print:border-none print:text-black print:p-0">{status || '-'}</span>;
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-900">Absensi Siswa</h2>
          <p className="text-slate-500">Kelola kehadiran dan lihat rekapitulasi.</p>
        </div>
        
        {/* Toggle View Mode Buttons */}
        <div className="bg-white p-1 rounded-lg border border-slate-200 flex shadow-sm self-start md:self-auto">
            <button 
                onClick={() => setViewMode('input')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === 'input' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <CheckCheck className="w-4 h-4" />
                Input Absen
            </button>
            <button 
                onClick={() => setViewMode('recap')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === 'recap' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <FileText className="w-4 h-4" />
                Rekap Absen
            </button>
        </div>
      </div>

      {/* Connection Bar (Horizontal) - Always Visible except Print */}
      <Card className="border-indigo-100 bg-indigo-50/50 print:hidden">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold min-w-fit shrink-0">
               <Settings className="w-5 h-5 text-indigo-600" />
               <span className="hidden md:inline">Koneksi Spreadsheet</span>
            </div>
            <div className="flex-1 w-full relative group">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link2 className="h-4 w-4 text-indigo-400" />
               </div>
               <input
                  className="w-full pl-9 pr-3 py-2 bg-white text-slate-900 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Paste URL Google Apps Script Web App di sini..."
                  value={scriptUrl}
                  onChange={(e) => setScriptUrl(e.target.value)}
                />
            </div>
            <div className="flex gap-2 w-full md:w-auto shrink-0">
                <Button onClick={() => setShowScriptModal(true)} variant="info" className="flex-1 md:flex-none text-sm px-4">
                  <Code className="w-4 h-4 mr-2" /> Dapatkan Script Baru
                </Button>
                <Button onClick={handleSaveUrl} variant="success" className="flex-1 md:flex-none text-sm px-4">Simpan URL</Button>
                <Button onClick={handleTestConnection} variant="warning" isLoading={isTesting} className="flex-1 md:flex-none text-sm px-4">Test Koneksi</Button>
            </div>
          </div>
          <p className="text-[10px] text-indigo-500 mt-2 md:mt-1 md:ml-[195px]">
             *Pastikan script dideploy sebagai "Web App" dengan akses "Anyone".
          </p>
        </CardContent>
      </Card>

      {/* --- VIEW MODE: INPUT ABSEN --- */}
      {viewMode === 'input' && (
        <>
            {/* Top Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-end gap-4 animate-in fade-in duration-300 print:hidden">
                <div className="w-full md:w-48">
                <Select label="Pilih Kelas" options={classOptions} value={filterClass} onChange={(e) => setFilterClass(e.target.value)} />
                </div>
                <div className="w-full md:w-48">
                <Input label="Tanggal" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                </div>
                <Button onClick={handleShowList} isLoading={isLoadingList} variant="primary" className="w-full md:w-auto">
                {!isLoadingList && <Search className="w-4 h-4 mr-2" />} Tampilkan
                </Button>
                {filteredStudents.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 md:ml-auto w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <Button onClick={markAllPresent} variant="teal" className="flex items-center gap-2"><CheckCheck className="w-4 h-4" /> Hadir Semua</Button>
                    <Button onClick={saveAttendance} isLoading={isSaving} variant="indigo" className="flex items-center gap-2"><Save className="w-4 h-4" /> Simpan Absen</Button>
                </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-2 duration-300 print:hidden">
                {/* Sidebar Manual Input */}
                <div className="lg:col-span-1 order-2 lg:order-1 space-y-6">
                    <Card>
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary-600" /> Input Manual</h3>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <Select label="Kelas" options={classOptions} value={newStudentClass} onChange={(e) => setNewStudentClass(e.target.value)} />
                        <Input label="NIS" placeholder="Nomor Induk Siswa" value={newStudentNIS} onChange={(e) => setNewStudentNIS(e.target.value)} />
                        <Input label="Nama Lengkap" placeholder="Nama Siswa" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
                        <Button onClick={addStudent} variant="pink" className="w-full">Tambah Siswa</Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Main List */}
                <div className="lg:col-span-3 order-1 lg:order-2">
                    {isLoadingList ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200">
                        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Mengambil data dari Spreadsheet...</p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <EmptyState icon={Users} title={`Kelas ${activeClass} Kosong`} description={`Tidak ada data siswa ditemukan untuk Kelas ${activeClass}. ${scriptUrl ? 'Pastikan URL Script benar dan Sheet berisi data (Kolom A=ID, B=Nama, C=Kelas).' : 'Tambahkan siswa melalui panel di samping.'}`} />
                    ) : (
                        <div className="space-y-4">
                        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div className="text-sm text-blue-800 font-medium">Menampilkan daftar: <span className="font-bold">Kelas {activeClass}</span> • Tanggal: <span className="font-bold">{new Date(activeDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span></div>
                            <div className="text-xs text-blue-600">Total: {filteredStudents.length} Siswa</div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {filteredStudents.map((student) => (
                            <div key={student.id} className={`bg-white rounded-xl border p-4 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4
                                ${student.status === 'UNMARKED' ? 'border-slate-200' : ''}
                                ${student.status === 'PRESENT' ? 'border-green-200 bg-green-50/30' : ''}
                                ${student.status === 'SICK' ? 'border-yellow-200 bg-yellow-50/30' : ''}
                                ${student.status === 'PERMIT' ? 'border-blue-200 bg-blue-50/30' : ''}
                                ${student.status === 'ABSENT' ? 'border-red-200 bg-red-50/30' : ''}`}>
                                <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">{student.className}</span>
                                    <span className="text-xs text-slate-400 font-mono">{student.nis}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 truncate">{student.name}</h3>
                                </div>
                                <div className="flex flex-wrap gap-2 shrink-0">
                                <button onClick={() => updateStatus(student.id, 'PRESENT')} className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${student.status === 'PRESENT' ? 'bg-green-600 text-white shadow-md scale-105' : 'bg-white border border-slate-200 text-slate-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200'}`}><CheckCircle className="w-4 h-4" /> Hadir</button>
                                <button onClick={() => updateStatus(student.id, 'SICK')} className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${student.status === 'SICK' ? 'bg-yellow-500 text-white shadow-md scale-105' : 'bg-white border border-slate-200 text-slate-600 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200'}`}><AlertCircle className="w-4 h-4" /> Sakit</button>
                                <button onClick={() => updateStatus(student.id, 'PERMIT')} className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${student.status === 'PERMIT' ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'}`}><Clock className="w-4 h-4" /> Izin</button>
                                <button onClick={() => updateStatus(student.id, 'ABSENT')} className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${student.status === 'ABSENT' ? 'bg-red-600 text-white shadow-md scale-105' : 'bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200'}`}><XCircle className="w-4 h-4" /> Alpa</button>
                                </div>
                            </div>
                            ))}
                        </div>
                        </div>
                    )}
                </div>
            </div>
        </>
      )}

      {/* --- VIEW MODE: REKAP ABSEN --- */}
      {viewMode === 'recap' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Filter Recap - Hidden on Print */}
            <Card className="border-indigo-100 shadow-sm print:hidden">
                <CardHeader className="bg-indigo-50/30 border-b border-indigo-100 pb-3">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                        <Filter className="w-5 h-5 text-indigo-600" /> 
                        Filter Rekapitulasi
                    </h3>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <Input 
                            label="Cari Nama Siswa" 
                            placeholder="Ketik nama..."
                            value={recapName} 
                            onChange={(e) => setRecapName(e.target.value)} 
                        />
                        <Select 
                            label="Kelas" 
                            options={classOptions}
                            value={recapClass}
                            onChange={(e) => setRecapClass(e.target.value)}
                        />
                        <Input 
                            label="Tanggal" 
                            type="date"
                            value={recapDate} 
                            onChange={(e) => setRecapDate(e.target.value)} 
                        />
                        <Select 
                            label="Periode" 
                            options={periodOptions}
                            value={recapPeriod}
                            onChange={(e) => setRecapPeriod(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button 
                              onClick={handleShowRecap} 
                              isLoading={isLoadingRecap} 
                              variant="indigo"
                              className="flex-1"
                          >
                              {!isLoadingRecap && <List className="w-4 h-4 mr-2" />} 
                              Tampilkan Data
                          </Button>
                          <Button 
                              type="button"
                              onClick={handlePrint}
                              variant="pink"
                              className="w-12 px-0 flex items-center justify-center"
                              title="Print Rekap (.pdf)"
                          >
                             <Printer className="w-5 h-5" />
                          </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --- KOP SURAT (PRINT ONLY) --- */}
            <div className="hidden print:block mb-6">
                <div className="flex items-center justify-center gap-6 border-b-4 border-double border-black pb-4 mb-4">
                     <div className="w-24 h-24 flex items-center justify-center">
                         {/* Placeholder Logo - Ganti src jika ada logo sekolah */}
                         <School className="w-20 h-20 text-black" strokeWidth={1.5} />
                     </div>
                     <div className="text-center">
                        <h3 className="text-lg font-serif font-bold uppercase tracking-wide">PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA</h3>
                        <h2 className="text-2xl font-serif font-black uppercase tracking-wider">DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
                        <h1 className="text-3xl font-serif font-black uppercase">SMA NEGERI UNGGULAN</h1>
                        <p className="text-sm font-serif italic mt-1">Jl. Pendidikan No. 1, Kota Pelajar, Telp. (021) 1234567</p>
                     </div>
                </div>
                <div className="text-center mb-6">
                   <h2 className="text-xl font-bold uppercase underline decoration-2 underline-offset-4">LAPORAN REKAPITULASI ABSENSI</h2>
                </div>
                
                <div className="flex justify-between items-start text-sm font-medium px-1 mb-4">
                    <table className="w-auto">
                        <tbody>
                            <tr><td className="w-24">Kelas</td><td>: <b>{recapClass || 'Semua Kelas'}</b></td></tr>
                            <tr><td>Periode</td><td>: <span className="uppercase">{recapPeriod}</span></td></tr>
                        </tbody>
                    </table>
                    <table className="w-auto text-right">
                         <tbody>
                            <tr><td>Tanggal Filter</td><td>: {new Date(recapDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}</td></tr>
                            <tr><td>Dicetak Pada</td><td>: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</td></tr>
                         </tbody>
                    </table>
                </div>
            </div>

            {/* Table Results */}
            <Card className="overflow-hidden border-slate-200 print:border-none print:shadow-none print:overflow-visible">
                {recapData.length === 0 ? (
                    <div className="p-12 text-center print:hidden">
                        <EmptyState 
                            icon={CalendarRange} 
                            title={scriptUrl ? "Tidak ada data ditemukan" : "Data Rekap Belum Ditampilkan"} 
                            description={scriptUrl ? "Coba ubah filter atau pastikan data tersedia di Spreadsheet." : "Gunakan filter di atas dan klik 'Tampilkan Data' untuk melihat riwayat absensi."} 
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full text-sm text-left print:text-xs print:w-full border-collapse">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 print:bg-slate-200 print:text-black print:border-black print:border-2">
                                <tr>
                                    <th className="px-6 py-3 font-bold print:px-2 print:py-2 print:border print:border-black print:text-center w-12">No</th>
                                    <th className="px-6 py-3 font-bold print:px-2 print:py-2 print:border print:border-black">NIS</th>
                                    <th className="px-6 py-3 font-bold print:px-2 print:py-2 print:border print:border-black">Nama Lengkap</th>
                                    <th className="px-6 py-3 font-bold print:px-2 print:py-2 print:border print:border-black print:text-center">Kelas</th>
                                    <th className="px-6 py-3 font-bold print:px-2 print:py-2 print:border print:border-black print:text-center">Tanggal</th>
                                    <th className="px-6 py-3 font-bold print:px-2 print:py-2 print:border print:border-black print:text-center">Waktu</th>
                                    <th className="px-6 py-3 font-bold text-center print:px-2 print:py-2 print:border print:border-black">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 print:divide-black">
                                {recapData.map((row, idx) => (
                                    <tr key={idx} className="bg-white hover:bg-slate-50 transition-colors print:hover:bg-transparent">
                                        <td className="px-6 py-4 font-mono text-slate-400 print:px-2 print:py-1.5 print:text-black print:border print:border-black print:text-center">{row.no || idx + 1}</td>
                                        <td className="px-6 py-4 font-mono print:px-2 print:py-1.5 print:border print:border-black">{row.nis}</td>
                                        <td className="px-6 py-4 font-bold text-slate-800 print:px-2 print:py-1.5 print:border print:border-black">{row.nama}</td>
                                        <td className="px-6 py-4 print:px-2 print:py-1.5 print:border print:border-black print:text-center">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold print:bg-transparent print:p-0">{row.kelas}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium print:px-2 print:py-1.5 print:text-black print:border print:border-black print:text-center">{row.tanggal}</td>
                                        <td className="px-6 py-4 text-slate-500 font-mono print:px-2 print:py-1.5 print:text-black print:border print:border-black print:text-center">{row.waktu}</td>
                                        <td className="px-6 py-4 text-center print:px-2 print:py-1.5 print:border print:border-black">
                                            {getStatusBadge(row.status)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Print Footer - Signature Area */}
             <div className="hidden print:flex mt-12 pt-4 break-inside-avoid">
                <div className="w-1/3 text-center">
                    <p className="mb-20">Mengetahui,<br/>Kepala Sekolah</p>
                    <p className="font-bold underline decoration-1 underline-offset-2">( ........................................ )</p>
                    <p className="text-xs mt-1">NIP. ........................................</p>
                </div>
                <div className="w-1/3"></div>
                <div className="w-1/3 text-center">
                    <p className="mb-20">Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Mata Pelajaran</p>
                    <p className="font-bold underline decoration-1 underline-offset-2">( ........................................ )</p>
                    <p className="text-xs mt-1">NIP. ........................................</p>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL SCRIPT CODE --- */}
      <Modal
        isOpen={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        title="Kode Google Apps Script Baru"
      >
        <div className="space-y-4">
           <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex gap-3 text-sm text-yellow-800">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>Untuk memisahkan tanggal dan waktu secara permanen, Anda <b>WAJIB</b> mengganti kode script lama Anda dengan kode di bawah ini.</p>
           </div>
           
           <div className="relative">
             <pre className="bg-slate-800 text-slate-100 p-4 rounded-lg text-xs font-mono h-64 overflow-y-auto whitespace-pre-wrap shadow-inner border border-slate-700">
                {GOOGLE_SCRIPT_CODE}
             </pre>
             <Button 
                onClick={copyScriptToClipboard} 
                variant="secondary" 
                className="absolute top-2 right-2 text-xs py-1 px-2 h-auto shadow-md bg-white hover:bg-slate-100 text-slate-800"
             >
                <Copy className="w-3 h-3 mr-1" /> Salin Kode
             </Button>
           </div>

           <div className="text-xs text-slate-500 space-y-1">
             <p>1. Buka Script Editor di Google Spreadsheet Anda.</p>
             <p>2. Hapus semua kode lama, lalu Paste kode di atas.</p>
             <p>3. Simpan, lalu klik <b>Deploy</b> {'>'} <b>New Deployment</b> (Penting!).</p>
           </div>
        </div>
      </Modal>

      {/* --- MODALS & TOASTS (Shared) --- */}
      <Modal 
        isOpen={showErrorModal} 
        onClose={() => setShowErrorModal(false)}
        title="Gagal Menyimpan"
        icon={<div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><X className="w-6 h-6 text-red-600" /></div>}
      >
        <p>Gagal menyimpan data, pastikan koneksi internet stabil dan coba lagi!</p>
      </Modal>

      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform ${toast.show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}>
        <div className={`px-6 py-3 rounded-full shadow-lg text-white font-medium flex items-center gap-3 border border-white/10 ${toast.type === 'success' ? 'bg-emerald-600 shadow-emerald-200' : toast.type === 'error' ? 'bg-red-600 shadow-red-200' : 'bg-slate-800 shadow-slate-200'}`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
          {toast.type === 'info' && <Info className="w-5 h-5" />}
          <span className="text-sm">{toast.message}</span>
        </div>
      </div>
    </div>
  );
};