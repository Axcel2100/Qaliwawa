import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Activity, Droplet, LayoutDashboard, Menu, X, Plus, Search, 
  Save, Wifi, WifiOff, FileText, Download, AlertTriangle, CheckCircle, 
  Phone, MapPin, Calendar, CreditCard, User, ChevronLeft, ChevronRight, 
  Clock, Eye, Edit, Trash, Move, Info, Check, Filter, Circle, Archive, 
  Printer, Settings, Upload, Trash2, Shield, Lock, Mail, Briefcase, 
  Building, Image as ImageIcon, LogOut, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

// --- INTEGRACIÓN FIREBASE (NUBE EN TIEMPO REAL) ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection } from 'firebase/firestore';

// ==============================================================================
// 🔴🔴🔴 ¡ATENCIÓN! REEMPLAZA ESTOS VALORES CON TUS LLAVES DE FIREBASE 🔴🔴🔴
// ==============================================================================
const userFirebaseConfig = {
  apiKey: "AIzaSyD3zDaezsATi3JKNJIkWcXYttXwgy4RVrw",
  authDomain: "qaliwawa-89417.firebaseapp.com",
  projectId: "qaliwawa-89417",
  storageBucket: "qaliwawa-89417.firebasestorage.app",
  messagingSenderId: "1994000104",
  appId: "1:1994000104:web:2e6822a0fd153541036b5d"
};
// ==============================================================================

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : userFirebaseConfig;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'qaliwawa-prod';

// --- MANEJADOR DE ERRORES ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Error capturado:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg m-4 border border-red-200 print:hidden text-sm">
          <h2 className="font-bold flex items-center gap-2"><AlertTriangle size={18} /> Ocurrió un error en este módulo</h2>
          <p className="text-xs mt-2 font-mono bg-white p-2 rounded max-h-32 overflow-auto">{this.state.error?.toString()}</p>
          <button onClick={() => window.location.reload()} className="mt-3 bg-red-600 text-white px-3 py-1.5 rounded font-medium">Recargar aplicación</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- CONSTANTES Y DATOS POR DEFECTO ---
const initialData = [];
const defaultUsers = [{ id: 1, nombre: 'Admin Master', usuario: 'admin', password: '123', rol: 'admin', cargo: 'Jefe de Sistema', establecimiento: 'C.S. Principal', correo: 'admin@minsa.gob.pe', telefono: '999888777', permisos: ['dashboard', 'padron', 'cred', 'anemia', 'reportes', 'configuracion'] }];
const defaultConfig = { nombreCentro: 'Sistema QaliWawa', slogan: 'Gestión Integral de Salud Infantil', version: '2.6.0', footer: '© 2026 Lic. Axcel Zamudio', logo: null };

const ESQUEMA_VACUNACION = [
  { edad: 'Recién Nacido', vacunas: ['BCG', 'Hepatitis B (HvB)'] },
  { edad: '2 Meses', vacunas: ['Pentavalente 1', 'IPV 1', 'Rotavirus 1', 'Neumococo 1'] },
  { edad: '4 Meses', vacunas: ['Pentavalente 2', 'IPV 2', 'Rotavirus 2', 'Neumococo 2'] },
  { edad: '6 Meses', vacunas: ['Pentavalente 3', 'IPV 3', 'Influenza 1'] },
  { edad: '7 Meses', vacunas: ['Influenza 2'] },
  { edad: '12 Meses', vacunas: ['SPR 1 (Sarampión)', 'Neumococo 3', 'Varicela'] },
  { edad: '15 Meses', vacunas: ['Antiamarílica (AMA)', 'Hepatitis A'] },
  { edad: '18 Meses', vacunas: ['DPT 1', 'SPR 2', 'IPV Refuerzo 1'] },
  { edad: '4 Años', vacunas: ['DPT 2', 'APO Refuerzo 2'] },
];

const GENERAR_ESQUEMA_SUPLEMENTOS = (tipo6to11) => [
  {
    titulo: "Etapa 6 Meses - 11 Meses",
    subtitulo: "Inicio de Suplementación",
    color: "blue",
    hasToggle: true,
    hitos: tipo6to11 === 'MMN' ? [
      { id: "6m_hb_entrega", label: "6M", desc: "Entr. Hb", icon: "drop_plus", reqHb: true },
      { id: "7m_entrega", label: "7M", desc: "2da MMN", icon: "pill", reqHb: true }, 
      { id: "8m_mmn", label: "8M", desc: "3ra MMN", icon: "pill" },
      { id: "9m_hb_mmn", label: "9M", desc: "Hb + 4ta MMN", icon: "drop_plus", reqHb: true },
      { id: "10m_mmn", label: "10M", desc: "5ta MMN", icon: "pill" },
      { id: "11m_mmn", label: "11M", desc: "6ta MMN", icon: "pill" },
    ] : [
      { id: "6m_hb_entrega", label: "6M", desc: "Entr. Hb", icon: "drop_plus", reqHb: true },
      { id: "7m_entrega", label: "7M", desc: "1ra Entrega", icon: "pill" },
      { id: "8m_entrega", label: "8M", desc: "2da Entrega", icon: "pill" },
      { id: "9m_hb", label: "9M", desc: "Dosaje Hb", icon: "drop", reqHb: true },
      { id: "10m_entrega", label: "10M", desc: "3ra Entrega", icon: "pill" },
      { id: "11m_entrega", label: "11M", desc: "4ta Entrega", icon: "pill" },
    ]
  },
  {
    titulo: "Etapa 1 Año",
    subtitulo: "Continuidad y Control",
    color: "indigo",
    hitos: [
      { id: "12m_hb", label: "12M", desc: "Dosaje Hb", icon: "drop", reqHb: true },
      { id: "15m_hb_entrega", label: "15M", desc: "Hb + 1ra Entr.", icon: "drop_plus", reqHb: true },
      { id: "16m_entrega", label: "16M", desc: "2da Entrega", icon: "pill" },
      { id: "17m_entrega", label: "17M", desc: "3ra Entrega", icon: "pill" },
      { id: "18m_hb_entrega", label: "18M", desc: "Hb + 4ta Entr.", icon: "drop_plus", reqHb: true },
      { id: "19m_entrega", label: "19M", desc: "5ta Entrega", icon: "pill" },
      { id: "20m_entrega", label: "20M", desc: "6ta Entrega", icon: "pill" },
      { id: "21m_hb", label: "21M", desc: "Dosaje Hb", icon: "drop", reqHb: true },
    ]
  },
  {
    titulo: "Etapa 2 Años",
    subtitulo: "Suplementación Continua",
    color: "green",
    hitos: [
      { id: "2a_hb_entrega", label: "2 AÑOS", desc: "Hb + 1ra", icon: "drop_plus", reqHb: true },
      { id: "2a1m_entrega", label: "2A 1M", desc: "2da Entrega", icon: "pill" },
      { id: "2a2m_entrega", label: "2A 2M", desc: "3ra Entrega", icon: "pill" },
      { id: "2a3m_entrega", label: "2A 3M", desc: "4ta Entrega", icon: "pill" },
      { id: "2a4m_entrega", label: "2A 4M", desc: "5ta Entrega", icon: "pill" },
      { id: "2a5m_entrega", label: "2A 5M", desc: "6ta Entrega", icon: "pill" },
      { id: "2a6m_hb", label: "2A 6M", desc: "Dosaje Hb", icon: "drop", reqHb: true },
    ]
  },
  {
    titulo: "Etapa 3 Años",
    subtitulo: "Ciclo de 3 Entregas",
    color: "orange",
    hitos: [
      { id: "3a_hb_entrega", label: "3 AÑOS", desc: "Hb + 1ra", icon: "drop_plus", reqHb: true },
      { id: "3a1m_entrega", label: "3A 1M", desc: "2da Entrega", icon: "pill" },
      { id: "3a2m_entrega", label: "3A 2M", desc: "3ra Entrega", icon: "pill" },
      { id: "3a3m_hb_fin", label: "3A 3M", desc: "Hb + Término", icon: "drop_check", reqHb: true },
    ]
  },
  {
    titulo: "Etapa 4 Años",
    subtitulo: "Ciclo Final",
    color: "purple",
    hitos: [
      { id: "4a_hb_entrega", label: "4 AÑOS", desc: "Hb + 1ra", icon: "drop_plus", reqHb: true },
      { id: "4a1m_entrega", label: "4A 1M", desc: "2da Entrega", icon: "pill" },
      { id: "4a2m_entrega", label: "4A 2M", desc: "3ra Entrega", icon: "pill" },
      { id: "4a3m_hb_fin", label: "4A 3M", desc: "Hb + Término", icon: "drop_check", reqHb: true },
    ]
  }
];

const ESQUEMA_CONTROLES_CRED = [
  {
    titulo: "Recién Nacido (0-28 días)",
    subtitulo: "Intervalo de 7 días",
    color: "teal",
    controles: [
      { id: "rn_1", label: "1° Control", desc: "< 7 días" },
      { id: "rn_2", label: "2° Control", desc: "7-14 días" },
      { id: "rn_3", label: "3° Control", desc: "14-21 días" }
    ]
  },
  {
    titulo: "Niños Menores de 1 Año",
    subtitulo: "Controles Mensuales",
    color: "blue",
    controles: [
      { id: "m1_1", label: "1° Control", desc: "1 mes" },
      { id: "m1_2", label: "2° Control", desc: "2 meses" },
      { id: "m1_3", label: "3° Control", desc: "3 meses" },
      { id: "m1_4", label: "4° Control", desc: "4 meses" },
      { id: "m1_5", label: "5° Control", desc: "6 meses" },
      { id: "m1_6", label: "6° Control", desc: "7 meses" },
      { id: "m1_7", label: "7° Control", desc: "9 meses" }
    ]
  },
  {
    titulo: "Niños de 1 a 4 Años",
    subtitulo: "Trimestrales / Semestrales",
    color: "indigo",
    controles: [
      { id: "a1_1", label: "1° Control", desc: "12 meses" },
      { id: "a1_2", label: "2° Control", desc: "15 meses" },
      { id: "a1_3", label: "3° Control", desc: "18 meses" },
      { id: "a1_4", label: "4° Control", desc: "21 meses" },
      { id: "a2_1", label: "1° Control", desc: "2 años" },
      { id: "a2_2", label: "2° Control", desc: "2A 6M" },
      { id: "a3_1", label: "1° Control", desc: "3 años" },
      { id: "a3_2", label: "2° Control", desc: "3A 6M" },
      { id: "a4_1", label: "1° Control", desc: "4 años" },
      { id: "a4_2", label: "2° Control", desc: "4A 6M" }
    ]
  }
];

// --- HELPERS ---
const calculateDetailedAge = (birthDateString) => {
  if (!birthDateString) return null;
  const birthDate = new Date(birthDateString + 'T00:00:00'); 
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();
  if (days < 0) { months--; const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0); days += lastMonth.getDate(); }
  if (months < 0) { years--; months += 12; }
  const totalMonths = (years * 12) + months;
  return { years, months, days, totalMonths, formatted: `${years}a, ${months}m, ${days}d`, shortFormatted: `${years}a ${months}m` };
};

const formatDateLong = (dateString) => {
  if (!dateString) return '-';
  const options = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' };
  return new Date(dateString).toLocaleDateString('es-PE', options);
};

const getCitaStatus = (dateStr) => {
    if (!dateStr) return { status: 'sin_cita', label: 'Sin Cita', color: 'text-slate-400', bg: 'bg-slate-100', border: 'border-slate-200' };
    const today = new Date();
    today.setHours(0,0,0,0);
    const cita = new Date(dateStr + 'T00:00:00');
    const diffTime = cita - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: 'vencido', label: `Vencido (${Math.abs(diffDays)}d)`, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
    if (diffDays === 0) return { status: 'hoy', label: 'HOY', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
    if (diffDays > 0 && diffDays <= 30) return { status: 'proximo', label: `Faltan ${diffDays}d`, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { status: 'futuro', label: `En ${diffDays}d`, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
};

const diagnosticarAnemia = (edadMeses, hb) => {
  if (!hb) return { anemia: false, tipo: null, mensaje: '' };
  let anemia = false;
  let tipo = null;
  if (edadMeses >= 6 && edadMeses <= 23) {
    if (hb < 7.0) { anemia = true; tipo = 'Severa'; }
    else if (hb >= 7.0 && hb <= 9.4) { anemia = true; tipo = 'Moderada'; }
    else if (hb >= 9.5 && hb <= 10.4) { anemia = true; tipo = 'Leve'; }
  } else if (edadMeses >= 24 && edadMeses <= 59) {
    if (hb < 7.0) { anemia = true; tipo = 'Severa'; }
    else if (hb >= 7.0 && hb <= 9.9) { anemia = true; tipo = 'Moderada'; }
    else if (hb >= 10.0 && hb <= 10.9) { anemia = true; tipo = 'Leve'; }
  } else if (edadMeses >= 60 && edadMeses <= 132) { 
    if (hb < 8.0) { anemia = true; tipo = 'Severa'; }
    else if (hb >= 8.0 && hb <= 10.9) { anemia = true; tipo = 'Moderada'; }
    else if (hb >= 11.0 && hb <= 11.4) { anemia = true; tipo = 'Leve'; }
  } else {
      if (hb < 11.0 && edadMeses > 0) { anemia = true; tipo = 'S/C'; }
  }
  return { anemia, tipo, mensaje: anemia ? `Anemia ${tipo}` : 'Normal' };
};

// --- COMPONENTES AUXILIARES ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 4000); return () => clearTimeout(timer); }, [onClose]);
  const bgColors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
  return (
    <div className={`fixed top-4 right-4 z-[100] ${bgColors[type]} text-white px-5 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-slideDown print:hidden text-sm`}>
      {type === 'success' && <CheckCircle size={18} />} {type === 'error' && <AlertTriangle size={18} />} {type === 'info' && <Info size={18} />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded-full p-1"><X size={14}/></button>
    </div>
  );
};

const CustomEdadTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg z-50 min-w-[180px] text-sm text-slate-800">
                <p className="font-bold text-blue-800 mb-2 border-b border-slate-100 pb-1">
                    {data.name}: {data.value} ptes.
                </p>
                {data.childrenList && data.childrenList.length > 0 ? (
                    <ul className="text-xs text-slate-600 space-y-1 max-h-40 overflow-y-auto">
                        {data.childrenList.map((c, i) => (
                            <li key={i} className="flex justify-between gap-3 border-b border-slate-50 pb-1">
                                <span className="truncate max-w-[110px]" title={c.nombres}>{c.nombres}</span>
                                <span className="font-bold text-blue-600 whitespace-nowrap">{c.edadCorta}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-[10px] text-slate-400 italic">No hay pacientes</p>
                )}
            </div>
        );
    }
    return null;
};

// --- MÓDULO LOGIN ---
const Login = ({ users, appConfig, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const safeConfig = appConfig || { nombreCentro: 'Sistema de Salud', slogan: 'Bienvenido', version: '1.0', footer: '', logo: null };
  const safeUsers = Array.isArray(users) ? users : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = safeUsers.find(u => u.usuario === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans animate-fadeIn text-slate-800" style={{ colorScheme: 'light' }}>
      <div className="bg-white w-full max-w-[380px] rounded-2xl shadow-xl overflow-hidden border border-slate-200">
         <div className="bg-gradient-to-br from-sky-50 to-blue-100 px-6 py-8 text-center border-b border-sky-200 relative">
             <div className="relative z-10">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-sky-200 overflow-hidden p-1.5">
                    {safeConfig.logo ? (
                        <img src={safeConfig.logo} alt="Logo" className="w-full h-full object-contain rounded-full bg-white" />
                    ) : (
                        <Activity size={36} className="text-blue-500"/>
                    )}
                 </div>
                 <h1 className="text-xl font-bold tracking-tight mb-1 text-blue-900">{safeConfig.nombreCentro}</h1>
                 <p className="text-blue-700 text-xs font-medium">{safeConfig.slogan}</p>
             </div>
         </div>

         <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
               {error && (
                  <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-lg flex items-center gap-2 border border-red-200 animate-slideDown font-medium">
                     <AlertTriangle size={14} /> {error}
                  </div>
               )}
               
               <div>
                   <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Usuario / DNI</label>
                   <div className="relative">
                       <User className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                       <input 
                          type="text" 
                          placeholder="Ingrese su usuario" 
                          className="w-full border border-slate-300 rounded-lg py-2 pl-9 pr-3 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-shadow text-slate-800 text-sm font-medium bg-white" 
                          value={username} 
                          onChange={e => setUsername(e.target.value)} 
                          required 
                          autoFocus
                       />
                   </div>
               </div>
               
               <div>
                   <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Contraseña</label>
                   <div className="relative">
                       <Lock className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                       <input 
                          type="password" 
                          placeholder="••••••••" 
                          className="w-full border border-slate-300 rounded-lg py-2 pl-9 pr-3 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-shadow text-slate-800 text-sm font-medium tracking-widest bg-white" 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                          required
                       />
                   </div>
               </div>
               
               <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-sm hover:shadow transition-all flex justify-center items-center gap-2 mt-2 text-sm">
                   Iniciar Sesión <ChevronRight size={16}/>
               </button>
            </form>
         </div>
      </div>
      <div className="mt-6 text-center text-[11px] text-slate-400 space-y-1">
         <p>{safeConfig.footer}</p>
         <p>Versión {safeConfig.version}</p>
      </div>
    </div>
  );
};


// --- MÓDULOS DEL SISTEMA ---

const Dashboard = ({ children }) => {
  const [selectedLocalidad, setSelectedLocalidad] = useState('Todas');

  const localidades = useMemo(() => {
    const locs = children.map(c => c.localidad ? c.localidad.trim() : '').filter(Boolean);
    return ['Todas', ...new Set(locs)];
  }, [children]);

  const stats = useMemo(() => {
    const filteredChildren = selectedLocalidad === 'Todas' 
      ? children 
      : children.filter(c => c.localidad?.trim() === selectedLocalidad);

    const total = filteredChildren.length;
    const anemiaCases = filteredChildren.filter(c => c.anemia).length;
    const normalNutricion = filteredChildren.filter(c => c.estadoNutricional === 'Normal').length;
    
    const desnutricion = filteredChildren.filter(c => (c.estadoNutricional || '').includes('Desnutrición')).length;
    const sobrepeso = filteredChildren.filter(c => (c.estadoNutricional || '').includes('Sobrepeso') || (c.estadoNutricional || '').includes('Obesidad')).length;

    const nutricionData = [
      { name: 'Normal', value: normalNutricion, color: '#10B981' },
      { name: 'Desnutric.', value: desnutricion, color: '#EF4444' },
      { name: 'S.Peso/Ob', value: sobrepeso, color: '#F59E0B' },
    ];
    const anemiaData = [
      { name: 'Sin Anemia', value: total - anemiaCases, color: '#3B82F6' },
      { name: 'Con Anemia', value: anemiaCases, color: '#EF4444' },
    ];

    const ageGroups = { 
        'RN': { count: 0, list: [] }, 
        '<1A': { count: 0, list: [] }, 
        '1A': { count: 0, list: [] }, 
        '2A': { count: 0, list: [] }, 
        '3A': { count: 0, list: [] }, 
        '4A': { count: 0, list: [] }, 
        '5A+': { count: 0, list: [] } 
    };
    
    const anemiaPorEdad = {
      'RN': { name: 'RN', 'Con Anemia': 0, 'Sin Anemia': 0 },
      '1-5M': { name: '1-5 M', 'Con Anemia': 0, 'Sin Anemia': 0 },
      '6-11M': { name: '6-11 M', 'Con Anemia': 0, 'Sin Anemia': 0 },
      '1A': { name: '1 Año', 'Con Anemia': 0, 'Sin Anemia': 0 },
      '2A': { name: '2 Años', 'Con Anemia': 0, 'Sin Anemia': 0 },
      '3A': { name: '3 Años', 'Con Anemia': 0, 'Sin Anemia': 0 },
      '4A': { name: '4 Años', 'Con Anemia': 0, 'Sin Anemia': 0 }
    };

    filteredChildren.forEach(c => {
       const age = calculateDetailedAge(c.fechaNacimiento);
       if (!age) return;
       
       let groupKey = '';
       if (age.totalMonths === 0 && age.days <= 28) groupKey = 'RN';
       else if (age.totalMonths < 12) groupKey = '<1A';
       else if (age.totalMonths >= 12 && age.totalMonths < 24) groupKey = '1A';
       else if (age.totalMonths >= 24 && age.totalMonths < 36) groupKey = '2A';
       else if (age.totalMonths >= 36 && age.totalMonths < 48) groupKey = '3A';
       else if (age.totalMonths >= 48 && age.totalMonths < 60) groupKey = '4A';
       else groupKey = '5A+';

       ageGroups[groupKey].count++;
       ageGroups[groupKey].list.push({
           nombres: `${c.nombres} ${c.apellidos}`,
           edadCorta: age.shortFormatted
       });

       let groupAnemia = '';
       if (age.totalMonths === 0 && age.days <= 28) groupAnemia = 'RN';
       else if (age.totalMonths < 6) groupAnemia = '1-5M';
       else if (age.totalMonths >= 6 && age.totalMonths < 12) groupAnemia = '6-11M';
       else if (age.totalMonths >= 12 && age.totalMonths < 24) groupAnemia = '1A';
       else if (age.totalMonths >= 24 && age.totalMonths < 36) groupAnemia = '2A';
       else if (age.totalMonths >= 36 && age.totalMonths < 48) groupAnemia = '3A';
       else if (age.totalMonths >= 48 && age.totalMonths < 60) groupAnemia = '4A';

       if (groupAnemia) {
           if (c.anemia) anemiaPorEdad[groupAnemia]['Con Anemia']++;
           else anemiaPorEdad[groupAnemia]['Sin Anemia']++;
       }
    });

    const edadData = Object.keys(ageGroups)
        .filter(k => k !== '5A+' || ageGroups[k].count > 0) 
        .map(k => ({ 
            name: k, 
            value: ageGroups[k].count, 
            color: '#8B5CF6',
            childrenList: ageGroups[k].list
        }));
        
    const anemiaPorEdadData = Object.values(anemiaPorEdad);

    return { total, anemiaCases, nutricionData, anemiaData, edadData, anemiaPorEdadData };
  }, [children, selectedLocalidad]);

  return (
    <div className="space-y-4 animate-fadeIn w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Estadísticas y Monitoreo</h2>
          <p className="text-xs text-slate-500">Visualiza la situación de tu población</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 p-1.5 rounded-lg border border-slate-200">
           <span className="text-xs font-bold text-slate-600 flex items-center shrink-0"><MapPin size={14} className="mr-1 text-slate-400"/> Sector:</span>
           <select
              className="w-full md:w-40 bg-white border border-slate-300 text-slate-800 rounded px-2 py-1 text-xs font-medium outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              value={selectedLocalidad}
              onChange={(e) => setSelectedLocalidad(e.target.value)}
           >
             {localidades.map(loc => <option key={loc} value={loc}>{loc}</option>)}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow"><div><p className="text-xs text-slate-500 font-medium">Total Niños ({selectedLocalidad})</p><p className="text-2xl font-bold text-blue-600">{stats.total}</p></div><Users className="w-10 h-10 text-blue-100 bg-blue-600 rounded-full p-2" /></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow"><div><p className="text-xs text-slate-500 font-medium">Casos de Anemia</p><p className="text-2xl font-bold text-red-600">{stats.anemiaCases}</p></div><Droplet className="w-10 h-10 text-red-100 bg-red-600 rounded-full p-2" /></div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow"><div><p className="text-xs text-slate-500 font-medium">Nutrición Normal</p><p className="text-2xl font-bold text-green-600">{stats.nutricionData[0].value}</p></div><Activity className="w-10 h-10 text-green-100 bg-green-600 rounded-full p-2" /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 h-[280px] flex flex-col">
           <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Users size={16} className="text-purple-600"/> Población Etaria</h3>
           <ResponsiveContainer width="100%" height="100%" className="mt-2">
             <BarChart data={stats.edadData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
               <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
               <Tooltip content={<CustomEdadTooltip />} cursor={{fill: '#f1f5f9'}} />
               <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={40}>
                 {stats.edadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 h-[280px] flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Activity size={16} className="text-green-600"/> Estado Nutricional</h3>
            <ResponsiveContainer width="100%" height="100%" className="mt-2">
                <BarChart data={stats.nutricionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10}/>
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}}/>
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                        {stats.nutricionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 h-[300px] lg:col-span-2 flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-2"><Droplet size={16} className="text-red-600"/> Prevalencia de Anemia</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.anemiaPorEdadData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10}/>
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}}/>
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{fontSize: '11px', color: '#475569'}} />
                    <Bar dataKey="Con Anemia" fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Sin Anemia" fill="#3B82F6" radius={[3, 3, 0, 0]} maxBarSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const PadronNominal = ({ children, setChildren, showToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewChild, setViewChild] = useState(null);
  const [childToDelete, setChildToDelete] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [newChild, setNewChild] = useState({ nombres: '', apellidos: '', dni: '', historiaClinica: '', fechaNacimiento: '', sexo: 'Masculino', seguro: 'SIS', responsable: '', telefono: '', direccion: '', departamento: 'Lima', provincia: 'Lima', distrito: '', localidad: '' });
  const [currentAgeDisplay, setCurrentAgeDisplay] = useState('');

  const handleMouseDown = (e) => { if (e.button !== 0) return; setIsDragging(true); setDragStart({ x: e.clientX - modalPosition.x, y: e.clientY - modalPosition.y }); e.preventDefault(); };
  useEffect(() => { const handleMouseMove = (e) => { if (!isDragging) return; setModalPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }; const handleMouseUp = () => setIsDragging(false); if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); } return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); }; }, [isDragging, dragStart]);
  const initiateDelete = (child) => setChildToDelete(child);
  const confirmDelete = () => { if (childToDelete) { setChildren(prev => prev.filter(c => c.id !== childToDelete.id)); setChildToDelete(null); showToast('Paciente eliminado', 'success'); } };
  const handleEdit = (child) => { setNewChild(child); setIsEditing(true); const ageDetails = calculateDetailedAge(child.fechaNacimiento); setCurrentAgeDisplay(ageDetails ? ageDetails.formatted : ''); setShowForm(true); };
  const handleView = (child) => { setViewChild(child); setModalPosition({ x: 0, y: 0 }); setShowViewModal(true); };
  const handleNew = () => { setNewChild({ nombres: '', apellidos: '', dni: '', historiaClinica: '', fechaNacimiento: '', sexo: 'Masculino', seguro: 'SIS', responsable: '', telefono: '', direccion: '', departamento: 'Lima', provincia: 'Lima', distrito: '', localidad: '' }); setCurrentAgeDisplay(''); setIsEditing(false); setShowForm(true); };
  const handleInputChange = (e) => { const { name, value } = e.target; setNewChild(prev => ({ ...prev, [name]: value })); if (name === 'fechaNacimiento') { const ageDetails = calculateDetailedAge(value); setCurrentAgeDisplay(ageDetails ? ageDetails.formatted : ''); } };
  const handleAdd = (e) => { 
    e.preventDefault(); 
    if (isEditing) { 
      setChildren(prev => prev.map(c => c.id === newChild.id ? newChild : c)); 
      showToast('Actualizado', 'success'); 
    } else { 
      const child = { 
        ...newChild, id: Date.now(), anemia: false, hemoglobina: 0, estadoNutricional: 'Pendiente', 
        controles: [], vacunas: {}, cronogramaSuplementos: {}, cronogramaCred: {}, suplementos: [], 
        proximaCita: '', proximaCitaAnemia: '', tratamientoAnemia: { inicio: null, entregas: [] }, 
        historialAnemia: [], tratamientosAnemiaPrevios: [] 
      }; 
      setChildren(prev => [...prev, child]); 
      showToast('Registrado', 'success'); 
    } 
    setShowForm(false); 
  };
  
  const filtered = children.filter(c => (c.nombres || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.dni || '').includes(searchTerm));

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">Padrón Nominal</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56"><Search className="absolute left-3 top-2 w-4 h-4 text-slate-400" /><input type="text" placeholder="DNI o Nombre" className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <button onClick={handleNew} className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1.5"><Plus size={16} /> Nuevo</button>
        </div>
      </div>
      
      {childToDelete && (<div className="fixed inset-0 bg-slate-900/50 z-[60] flex justify-center items-center p-4"><div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-sm"><div className="flex flex-col items-center text-center"><h3 className="text-base font-bold mb-1 text-slate-800">¿Eliminar?</h3><p className="mb-4 text-sm text-slate-600">Borrarás a {childToDelete.nombres}</p><div className="flex gap-2 w-full"><button onClick={() => setChildToDelete(null)} className="flex-1 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg font-medium">Cancelar</button><button onClick={confirmDelete} className="flex-1 py-1.5 text-sm bg-red-600 text-white rounded-lg font-medium">Eliminar</button></div></div></div></div>)}
      
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex justify-center items-start pt-6 overflow-y-auto pb-6">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl m-2 animate-slideDown overflow-hidden">
            <div className="bg-blue-600 p-3.5 flex justify-between items-center text-white">
              <h3 className="text-base font-bold">{isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}</h3>
              <button onClick={() => setShowForm(false)} className="hover:bg-blue-700 p-1 rounded-md"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleAdd} className="p-5 space-y-6 bg-slate-50/50">
              <div className="space-y-3">
                <h4 className="flex items-center gap-1.5 text-blue-800 text-sm font-bold border-b border-slate-200 pb-1.5"><User size={16} /> Datos Personales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1 uppercase">N° Historia Clínica</label>
                    <div className="relative"><FileText className="absolute left-2.5 top-2 text-slate-400" size={14}/><input name="historiaClinica" placeholder="Ej. HC-12345" className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none bg-white" value={newChild.historiaClinica} onChange={handleInputChange} /></div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1 uppercase">DNI / CNV *</label>
                    <div className="relative"><CreditCard className="absolute left-2.5 top-2 text-slate-400" size={14}/><input name="dni" placeholder="8 dígitos" className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none bg-white" value={newChild.dni} onChange={handleInputChange} required /></div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-slate-500 font-bold mb-1 uppercase">Nombres y Apellidos *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input name="nombres" placeholder="Nombres" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none bg-white" value={newChild.nombres} onChange={handleInputChange} required />
                      <input name="apellidos" placeholder="Apellidos" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none bg-white" value={newChild.apellidos} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1 uppercase">Fecha de Nacimiento *</label>
                    <input type="date" name="fechaNacimiento" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none bg-white text-slate-700 mb-1" value={newChild.fechaNacimiento} onChange={handleInputChange} required />
                    {currentAgeDisplay && (<span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 inline-block">Edad: {currentAgeDisplay}</span>)}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 font-bold mb-1 uppercase">Sexo</label>
                        <select name="sexo" className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none bg-white text-slate-700" value={newChild.sexo} onChange={handleInputChange}><option>Masculino</option><option>Femenino</option></select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 font-bold mb-1 uppercase">Seguro</label>
                        <select name="seguro" className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none bg-white text-slate-700" value={newChild.seguro} onChange={handleInputChange}><option>SIS</option><option>EsSalud</option><option>Privado</option><option>Ninguno</option></select>
                      </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <h4 className="flex items-center gap-1.5 text-blue-800 text-sm font-bold border-b border-slate-200 pb-1.5"><MapPin size={16} /> Ubicación y Contacto</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-[11px] text-slate-500 font-bold mb-1 uppercase">Responsable</label><input name="responsable" placeholder="Apoderado" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none bg-white" value={newChild.responsable} onChange={handleInputChange} /></div>
                  <div><label className="block text-[11px] text-slate-500 font-bold mb-1 uppercase">Teléfono</label><div className="relative"><Phone className="absolute left-2.5 top-2 text-slate-400" size={14}/><input name="telefono" placeholder="999-999-999" className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none bg-white" value={newChild.telefono} onChange={handleInputChange} /></div></div>
                  <div className="md:col-span-2"><label className="block text-[11px] text-slate-500 font-bold mb-1 uppercase">Dirección</label><input name="direccion" placeholder="Av/Jr/Calle" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none bg-white" value={newChild.direccion} onChange={handleInputChange} /></div>
                  <div className="grid grid-cols-2 gap-3 md:col-span-2">
                      <div><label className="block text-[11px] text-slate-500 font-bold mb-1 uppercase">Departamento</label><input name="departamento" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none bg-white" value={newChild.departamento} onChange={handleInputChange} /></div>
                      <div><label className="block text-[11px] text-slate-500 font-bold mb-1 uppercase">Provincia</label><input name="provincia" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none bg-white" value={newChild.provincia} onChange={handleInputChange} /></div>
                      <div><label className="block text-[11px] text-slate-500 font-bold mb-1 uppercase">Distrito</label><input name="distrito" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none bg-white" value={newChild.distrito} onChange={handleInputChange} /></div>
                      <div><label className="block text-[11px] text-slate-500 font-bold mb-1 uppercase">Localidad</label><input name="localidad" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none bg-white" value={newChild.localidad} onChange={handleInputChange} /></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200 gap-2 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm flex items-center gap-1.5 transition-colors"><Save size={16}/> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showViewModal && viewChild && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex justify-center items-center p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]" style={{ transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`, transition: isDragging ? 'none' : 'transform 0.1s' }}>
              <div className="bg-blue-600 p-3.5 flex justify-between items-center text-white cursor-move select-none rounded-t-xl" onMouseDown={handleMouseDown}><h3 className="text-base font-bold flex items-center gap-2"><Move size={16} className="opacity-70"/> Ficha del Paciente</h3><button onClick={() => setShowViewModal(false)} className="hover:bg-blue-700 p-1 rounded-md cursor-pointer" onMouseDown={(e) => e.stopPropagation()}><X size={18}/></button></div>
              <div className="p-5 overflow-y-auto">
                <div className="flex items-center gap-3 mb-5"><div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><User size={24} /></div><div><h2 className="text-lg font-bold text-slate-800">{viewChild.nombres} {viewChild.apellidos}</h2><div className="flex gap-2 mt-0.5"><span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-100">DNI: {viewChild.dni}</span><span className="bg-purple-50 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-100">{viewChild.historiaClinica || 'S/N'}</span></div></div></div>
                <div className="bg-white border border-slate-100 rounded-lg p-3 mb-3 shadow-sm"><h4 className="text-blue-800 text-sm font-bold flex items-center gap-1.5 mb-2"><Activity size={14}/> Datos Básicos</h4><div className="grid grid-cols-2 gap-y-2 gap-x-4"><div><p className="text-[10px] text-slate-400 uppercase font-bold">F. Nacimiento</p><p className="text-slate-800 text-sm font-medium">{formatDateLong(viewChild.fechaNacimiento)}</p></div><div><p className="text-[10px] text-slate-400 uppercase font-bold">Sexo</p><p className="text-slate-800 text-sm font-medium">{viewChild.sexo}</p></div><div><p className="text-[10px] text-slate-400 uppercase font-bold">Seguro</p><p className="text-slate-800 text-sm font-medium">{viewChild.seguro}</p></div><div><p className="text-[10px] text-slate-400 uppercase font-bold">Edad</p><p className="text-slate-800 font-bold text-sm">{calculateDetailedAge(viewChild.fechaNacimiento)?.shortFormatted || '-'}</p></div></div></div>
                <div className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm"><h4 className="text-blue-800 text-sm font-bold flex items-center gap-1.5 mb-2"><MapPin size={14}/> Contacto</h4><div className="grid grid-cols-2 gap-y-2 gap-x-4"><div className="col-span-2"><p className="text-[10px] text-slate-400 uppercase font-bold">Dirección</p><p className="text-slate-800 text-sm font-medium">{viewChild.direccion}</p></div><div><p className="text-[10px] text-slate-400 uppercase font-bold">Localidad</p><p className="text-slate-800 text-sm font-medium">{viewChild.localidad || '-'}</p></div><div><p className="text-[10px] text-slate-400 uppercase font-bold">Distrito</p><p className="text-slate-800 text-sm font-medium">{viewChild.distrito || '-'}</p></div><div><p className="text-[10px] text-slate-400 uppercase font-bold">Responsable</p><p className="text-slate-800 text-sm font-medium">{viewChild.responsable || '-'}</p></div><div><p className="text-[10px] text-slate-400 uppercase font-bold">Teléfono</p><p className="text-slate-800 text-sm font-medium">{viewChild.telefono || '-'}</p></div></div></div>
              </div>
              <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-end rounded-b-xl"><button onClick={() => setShowViewModal(false)} className="px-4 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 font-medium">Cerrar</button></div>
           </div>
        </div>
      )}

      <div className="space-y-2">
         {filtered.length > 0 ? filtered.map(child => (
              <div key={child.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:shadow-md transition-shadow">
                 <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100">
                       {child.nombres?.[0] || '-'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                         <h3 className="font-bold text-sm text-slate-800">{child.nombres} {child.apellidos}</h3>
                         {child.anemia && <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center"><Droplet size={10} className="mr-0.5 fill-current"/> Anemia</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                         <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-semibold">
                            <CreditCard size={10} className="text-slate-400"/> {child.dni}
                         </span>
                         <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-semibold">
                            <FileText size={10} className="text-slate-400"/> {child.historiaClinica || 'Sin HC'}
                         </span>
                         <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-blue-100 bg-blue-50 text-blue-700 text-[10px] font-bold">
                            <Calendar size={10} className="text-blue-500"/> {new Date(child.fechaNacimiento + 'T00:00:00').toLocaleDateString('es-PE', {day: '2-digit', month: 'short', year: 'numeric'})}
                            <span className="mx-0.5 text-blue-300">|</span>
                            <Clock size={10} className="text-blue-500"/> {calculateDetailedAge(child.fechaNacimiento)?.shortFormatted || '-'}
                         </span>
                      </div>
                    </div>
                 </div>
                 
                 <div className="flex justify-center items-center gap-1.5 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                    <button onClick={() => handleView(child)} className="flex-1 sm:flex-none p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100" title="Ver">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => handleEdit(child)} className="flex-1 sm:flex-none p-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors border border-amber-100" title="Editar">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => initiateDelete(child)} className="flex-1 sm:flex-none p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-100" title="Eliminar">
                      <Trash size={16} />
                    </button>
                 </div>
              </div>
            )) : (
              <div className="text-center p-8 text-sm text-slate-500 bg-white rounded-lg shadow-sm border border-slate-100">
                 No se encontraron pacientes.
              </div>
         )}
      </div>
    </div>
  );
};

const ModuloCRED = ({ children, setChildren, showToast }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('crecimiento'); 
  const [supplementType6to11, setSupplementType6to11] = useState('Hierro');
  const [filterCita, setFilterCita] = useState('todos');
  
  const [newCita, setNewCita] = useState('');
  const [hitoModal, setHitoModal] = useState({ show: false, hito: null, data: { fecha: '', hb: '' } });
  
  const [controlModal, setControlModal] = useState({ show: false, controlId: null, label: '', data: { fecha: new Date().toISOString().split('T')[0], peso: '', talla: '', estadoNutricional: 'Normal' } });

  const selectedChild = useMemo(() => children.find(c => c.id === parseInt(selectedId)), [children, selectedId]);
  
  const patientsWithStatus = useMemo(() => children.map(c => ({...c, citaStatus: getCitaStatus(c.proximaCita)})), [children]);

  const filteredPatients = useMemo(() => {
    let list = patientsWithStatus;
    if (searchTerm) list = list.filter(c => (c.nombres || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.dni || '').includes(searchTerm));
    if (filterCita !== 'todos') list = list.filter(c => c.citaStatus.status === filterCita);
    return list;
  }, [patientsWithStatus, searchTerm, filterCita]);

  const updateChildData = (updatedFields) => {
      const updatedChildren = children.map(c => c.id === parseInt(selectedId) ? { ...c, ...updatedFields } : c);
      setChildren(updatedChildren);
  };

  const handleSaveControl = (e) => {
    e.preventDefault();
    const pesoNum = parseFloat(controlModal.data.peso);
    const tallaNum = parseFloat(controlModal.data.talla);
    const status = controlModal.data.estadoNutricional;
    const newRecord = { fecha: controlModal.data.fecha, peso: pesoNum, talla: tallaNum, estadoNutricional: status };
    const updatedCronogramaCred = { ...(selectedChild.cronogramaCred || {}), [controlModal.controlId]: newRecord };
    const updatedControlesList = [...(selectedChild.controles || []), { date: controlModal.data.fecha, weight: pesoNum, height: tallaNum, status }];
    updateChildData({ cronogramaCred: updatedCronogramaCred, estadoNutricional: status, controles: updatedControlesList });
    setControlModal({ show: false, controlId: null, label: '', data: { fecha: '', peso: '', talla: '', estadoNutricional: 'Normal' } });
    showToast(`Control guardado`, 'success');
  };

  const handleVaccineChange = (vaccineName, date) => {
      const updatedVacunas = { ...(selectedChild.vacunas || {}), [vaccineName]: date };
      updateChildData({ vacunas: updatedVacunas });
      showToast('Vacuna actualizada', 'success');
  };

  const handleUpdateCita = () => {
      if(!newCita) return;
      updateChildData({ proximaCita: newCita });
      showToast('Cita agendada', 'success'); 
  };

  const handleHitoClick = (hito) => {
    const existing = selectedChild.cronogramaSuplementos?.[hito.id] || {};
    setHitoModal({ show: true, hito: hito, data: { fecha: existing.fecha || new Date().toISOString().split('T')[0], hb: existing.hb || '' } });
  };

  const saveHito = () => {
    const { hito, data } = hitoModal;
    const updatedCronograma = { ...(selectedChild.cronogramaSuplementos || {}), [hito.id]: { ...data, estado: 'completado' } };
    updateChildData({ cronogramaSuplementos: updatedCronograma });
    setHitoModal({ show: false, hito: null, data: {} });
    showToast('Guardado', 'success');
  };

  const renderIcon = (type, done) => {
    const colorClass = done ? "text-white" : (type.includes("drop") ? "text-red-500" : "text-orange-500");
    if (type === "drop") return <Droplet size={16} className={colorClass} fill={done ? "currentColor" : "none"} />;
    if (type === "drop_plus") return <div className="relative"><Droplet size={16} className={colorClass} /><Plus size={10} className={`absolute -right-1 -top-1 ${colorClass}`} strokeWidth={3} /></div>;
    if (type === "drop_check") return <div className="relative"><Droplet size={16} className={colorClass} /><Check size={10} className={`absolute -right-1 -top-1 ${colorClass}`} strokeWidth={3} /></div>;
    if (type === "pill") return <Circle size={16} className={colorClass} />;
    return <Circle size={16} className={colorClass} />;
  };

  const esquema = GENERAR_ESQUEMA_SUPLEMENTOS(supplementType6to11);

  return (
    <div className="space-y-4 w-full">
      {!selectedChild ? (
         <div className="w-full">
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-800 mb-3">Control CRED</h2>
              <div className="relative max-w-xl"><Search className="absolute left-3 top-2 text-slate-400" size={16} /><input type="text" placeholder="Buscar DNI o Nombre..." className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-400 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100"><span className="text-[11px] font-bold text-slate-500 flex items-center mr-1 uppercase"><Filter size={12} className="mr-1"/> Filtros:</span>{[{ id: 'todos', label: 'Todos' }, { id: 'hoy', label: 'Citas Hoy' }, { id: 'proximo', label: 'Próximos' }, { id: 'vencido', label: 'Vencidos' }, { id: 'sin_cita', label: 'Sin Cita' }].map(f => (<button key={f.id} onClick={() => setFilterCita(f.id)} className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors border ${filterCita === f.id ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{f.label}</button>))}</div>
           </div>
           <div className="space-y-2">
               {filteredPatients.length > 0 ? filteredPatients.map(child => (
                    <div key={child.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex justify-between items-center gap-3 hover:shadow-md transition-shadow">
                       <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-purple-100">{child.nombres?.[0] || '-'}</div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                               <h3 className="font-bold text-sm text-slate-800">{child.nombres} {child.apellidos}</h3>
                               {child.anemia && <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center"><Droplet size={10} className="mr-0.5 fill-current"/> Anemia</span>}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                               <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-semibold"><CreditCard size={10} className="text-slate-400"/> {child.dni}</span>
                               <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-semibold"><FileText size={10} className="text-slate-400"/> {child.historiaClinica || 'Sin HC'}</span>
                               <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-purple-100 bg-purple-50 text-purple-700 text-[10px] font-bold">
                                  <Calendar size={10} className="text-purple-500"/> {new Date(child.fechaNacimiento + 'T00:00:00').toLocaleDateString('es-PE', {day: '2-digit', month: 'short', year: 'numeric'})}
                                  <span className="mx-0.5 text-purple-300">|</span>
                                  <Clock size={10} className="text-purple-500"/> {calculateDetailedAge(child.fechaNacimiento)?.shortFormatted || '-'}
                               </span>
                            </div>
                          </div>
                       </div>
                       <div className={`px-3 py-1.5 rounded-lg border ${child.citaStatus.bg} ${child.citaStatus.border} flex flex-col items-center min-w-[110px] shrink-0`}><span className={`text-[10px] font-bold uppercase ${child.citaStatus.color}`}>{child.citaStatus.status === 'sin_cita' ? 'Cita CRED' : child.citaStatus.label}</span><span className={`text-xs font-medium ${child.citaStatus.color}`}>{child.citaStatus.status === 'sin_cita' ? 'No programada' : formatDateLong(child.proximaCita)}</span></div>
                       <button onClick={() => setSelectedId(child.id)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-1.5 shrink-0 shadow-sm">Atender <ChevronRight size={16}/></button>
                    </div>
                  )) : <div className="text-center p-8 text-sm text-slate-500 bg-white border border-slate-100 rounded-lg">No se encontraron pacientes.</div>}
           </div>
         </div>
      ) : (
          <div className="flex flex-col gap-4 animate-fadeIn">
              <button onClick={() => setSelectedId(null)} className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-sm font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm w-fit transition-all hover:bg-slate-50"><ChevronLeft size={16}/> Volver</button>
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row gap-5 items-start">
                  <div className={`w-16 h-16 shrink-0 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-sm bg-gradient-to-br ${selectedChild.sexo === 'Femenino' ? 'from-pink-400 to-pink-500' : 'from-blue-400 to-blue-500'}`}>
                      {selectedChild.nombres?.[0] || '-'}
                  </div>
                  <div className="flex-1 w-full pt-1">
                      <h2 className="text-xl font-extrabold text-slate-800 leading-tight">{selectedChild.nombres} {selectedChild.apellidos}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-xs text-slate-600"><FileText size={12} className="text-slate-400"/> <span className="font-bold text-slate-700">HC:</span> {selectedChild.historiaClinica || 'S/N'}</span>
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-xs text-slate-600"><User size={12} className="text-slate-400"/> <span className="font-bold text-slate-700">DNI:</span> {selectedChild.dni}</span>
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-xs text-slate-600"><Calendar size={12} className="text-slate-400"/> <span className="font-bold text-slate-700">F. Nac:</span> {new Date(selectedChild.fechaNacimiento + 'T00:00:00').toLocaleDateString('es-PE', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-xs text-slate-600"><Clock size={12} className="text-slate-400"/> <span className="font-bold text-slate-700">Edad:</span> <span className={selectedChild.sexo === 'Femenino' ? 'text-pink-600 font-bold' : 'text-blue-600 font-bold'}>{calculateDetailedAge(selectedChild.fechaNacimiento)?.formatted}</span></span>
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${selectedChild.sexo === 'Femenino' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{selectedChild.seguro}</span>
                          {selectedChild.anemia && (<span className="px-2 py-0.5 rounded border text-[10px] font-bold uppercase bg-red-50 text-red-700 border-red-200 flex items-center gap-1"><AlertTriangle size={10} className="fill-current"/> Anemia</span>)}
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 font-medium"><MapPin size={14} className="text-slate-400" />{selectedChild.direccion} {selectedChild.distrito ? `- ${selectedChild.distrito}` : ''}</div>
                  </div>
                  <div className="hidden md:block text-right border-l border-slate-100 pl-4 py-1 min-w-[140px]">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Apoderado</p>
                      <p className="font-bold text-slate-800 text-sm mb-0.5">{selectedChild.responsable}</p>
                      <p className={`font-bold text-sm ${selectedChild.sexo === 'Femenino' ? 'text-pink-600' : 'text-blue-600'}`}><Phone size={12} className="inline mr-1"/>{selectedChild.telefono}</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200">
                      {[{ id: 'crecimiento', label: 'Controles', icon: Activity }, { id: 'vacunas', label: 'Vacunas', icon: Plus }, { id: 'suplementos', label: 'Suplementos', icon: Circle }, { id: 'citas', label: 'Citas', icon: Calendar }].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-purple-100 text-purple-800' : 'text-slate-600 hover:bg-slate-50'}`}><tab.icon size={16}/> {tab.label}</button>))}
                  </div>
                  
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 min-h-[300px]">
                      {activeTab === 'crecimiento' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                                <h2 className="text-lg font-bold text-purple-800 flex items-center gap-1.5"><Activity size={18}/> Esquema CRED</h2>
                                <p className="text-xs text-slate-500 ml-auto hidden md:block">Haz clic en los cuadros para registrar atenciones</p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {ESQUEMA_CONTROLES_CRED.map((grupo, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                        <div className={`bg-${grupo.color}-50 p-3 border-b border-${grupo.color}-100 flex items-center justify-between`}>
                                            <h3 className={`font-bold text-${grupo.color}-800 text-sm flex items-center gap-1.5`}><CheckCircle size={16}/> {grupo.titulo}</h3>
                                            <p className={`text-${grupo.color}-600 text-xs font-medium`}>{grupo.subtitulo}</p>
                                        </div>
                                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                            {grupo.controles.map((control) => {
                                                const record = selectedChild.cronogramaCred?.[control.id];
                                                const isDone = !!record;
                                                return (
                                                    <button 
                                                        key={control.id} 
                                                        onClick={() => setControlModal({ show: true, controlId: control.id, label: control.label, data: { fecha: record?.fecha || new Date().toISOString().split('T')[0], peso: record?.peso || '', talla: record?.talla || '', estadoNutricional: record?.estadoNutricional || 'Normal' } })} 
                                                        className={`flex flex-col items-center justify-center p-2.5 rounded-lg border-2 transition-all group ${isDone ? `bg-green-50 border-green-400 hover:bg-green-100` : 'bg-white border-slate-200 hover:border-purple-300 shadow-sm'}`}
                                                    >
                                                        <div className={`text-xs font-bold mb-0.5 ${isDone ? 'text-green-800' : 'text-slate-700 group-hover:text-purple-700'}`}>{control.label}</div>
                                                        <div className="text-[10px] text-slate-500 text-center mb-1.5">{control.desc}</div>
                                                        {isDone ? (
                                                            <div className="flex flex-col items-center w-full bg-white p-1 rounded border border-green-200">
                                                                <span className="text-[10px] text-green-700 font-bold block mb-0.5">{formatDateLong(record.fecha)}</span>
                                                                <div className="flex gap-1.5 text-[10px] font-medium text-slate-600"><span>P: {record.peso}kg</span><span>T: {record.talla}cm</span></div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-500 group-hover:border-purple-200 transition-colors">
                                                                <Plus size={14} />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                      )}

                      {activeTab === 'vacunas' && (<div className="space-y-4 animate-fadeIn"><h2 className="text-lg font-bold text-purple-800">Vacunación</h2><div className="space-y-3">{ESQUEMA_VACUNACION.map((grupo, idx) => (<div key={idx} className="border border-slate-200 rounded-lg overflow-hidden"><div className="bg-purple-50 px-3 py-2 text-sm font-bold text-purple-800 border-b border-purple-100">{grupo.edad}</div><div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3">{grupo.vacunas.map((vacuna, vIdx) => (<div key={vIdx}><label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase">{vacuna}</label><input type="date" className={`border border-slate-200 p-1.5 rounded text-xs w-full focus:ring-1 focus:ring-purple-400 outline-none ${selectedChild.vacunas?.[vacuna] ? 'bg-green-50 border-green-300 text-green-800 font-medium' : 'bg-white'}`} value={selectedChild.vacunas?.[vacuna] || ''} onChange={(e) => handleVaccineChange(vacuna, e.target.value)} /></div>))}</div></div>))}</div></div>)}
                      
                      {activeTab === 'suplementos' && (
                        <div className="space-y-5 animate-fadeIn">
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="text-lg font-bold text-purple-800 flex items-center gap-1.5"><Circle size={18}/> Suplementos</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {esquema.map((etapa, idx) => (
                                    <div key={idx} className={`border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm ${idx === 2 ? 'md:row-span-2' : ''}`}>
                                        <div className={`bg-${etapa.color}-50 p-3 border-b border-${etapa.color}-100 flex justify-between items-center`}>
                                            <div><h3 className={`font-bold text-${etapa.color}-800 text-sm`}>{etapa.titulo}</h3><p className={`text-${etapa.color}-600 text-[10px] font-medium uppercase tracking-wider`}>{etapa.subtitulo}</p></div>
                                            {etapa.hasToggle && (<div className="flex bg-white rounded flex-shrink-0 border border-slate-200"><button onClick={() => setSupplementType6to11('Hierro')} className={`px-2 py-1 text-[10px] font-bold rounded-l ${supplementType6to11 === 'Hierro' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Hierro</button><button onClick={() => setSupplementType6to11('MMN')} className={`px-2 py-1 text-[10px] font-bold rounded-r ${supplementType6to11 === 'MMN' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>MMN</button></div>)}
                                        </div>
                                        <div className="p-3 grid grid-cols-2 gap-3">
                                            {etapa.hitos.map((hito) => {
                                                const record = selectedChild.cronogramaSuplementos?.[hito.id];
                                                const isDone = !!record;
                                                return (
                                                    <button key={hito.id} onClick={() => handleHitoClick(hito)} className={`flex flex-col items-center justify-center p-2.5 rounded-lg border-2 transition-all ${isDone ? `bg-green-50 border-green-400` : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}>
                                                        <div className="text-xs font-bold text-slate-700 mb-1">{hito.label}</div>
                                                        <div className={`mb-1 ${isDone ? 'scale-110 transition-transform' : ''}`}>{renderIcon(hito.icon, isDone)}</div>
                                                        <div className="text-[10px] text-slate-500 text-center leading-tight mb-1">{hito.desc}</div>
                                                        {isDone && (<div className="mt-0.5 flex flex-col items-center"><div className="flex items-center text-[10px] text-green-700 font-bold"><CheckCircle size={10} className="mr-0.5"/> {formatDateLong(record.fecha)}</div>{record.hb && <div className="text-[10px] text-blue-700 font-bold mt-0.5 bg-blue-100 px-1.5 rounded">Hb: {record.hb}</div>}</div>)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                      )}
                      
                      {activeTab === 'citas' && (<div className="space-y-4 animate-fadeIn"><h2 className="text-lg font-bold text-purple-800">Agendar Cita (CRED)</h2><div className="flex gap-2 max-w-sm"><input type="date" className="border border-slate-200 p-2 rounded-lg w-full text-sm outline-none focus:ring-1 focus:ring-purple-400" value={newCita} onChange={(e) => setNewCita(e.target.value)} /><button onClick={handleUpdateCita} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700">Agendar</button></div></div>)}
                  </div>
              </div>
          </div>
      )}

      {/* MODAL REGISTRO CONTROL CRED (PESO/TALLA) */}
      {controlModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-xs animate-fadeIn">
            <h3 className="text-base font-bold text-purple-900 mb-3 border-b border-purple-100 pb-2 flex items-center gap-1.5"><Activity size={18}/> {controlModal.label}</h3>
            <form onSubmit={handleSaveControl} className="space-y-3">
              <div>
                 <label className="block text-xs font-bold text-slate-600 mb-1">Fecha</label>
                 <input type="date" required className="w-full border border-slate-300 p-2 rounded-md focus:ring-1 focus:ring-purple-400 outline-none text-sm" value={controlModal.data.fecha} onChange={(e) => setControlModal({...controlModal, data: { ...controlModal.data, fecha: e.target.value }})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Peso (kg)</label>
                    <input type="number" step="0.01" required placeholder="Ej: 8.5" className="w-full border border-slate-300 p-2 rounded-md focus:ring-1 focus:ring-purple-400 outline-none text-sm" value={controlModal.data.peso} onChange={(e) => setControlModal({...controlModal, data: { ...controlModal.data, peso: e.target.value }})} />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Talla (cm)</label>
                    <input type="number" step="0.1" required placeholder="Ej: 70.5" className="w-full border border-slate-300 p-2 rounded-md focus:ring-1 focus:ring-purple-400 outline-none text-sm" value={controlModal.data.talla} onChange={(e) => setControlModal({...controlModal, data: { ...controlModal.data, talla: e.target.value }})} />
                 </div>
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-600 mb-1">Estado</label>
                 <select required className="w-full border border-slate-300 p-2 rounded-md focus:ring-1 focus:ring-purple-400 outline-none text-sm font-medium text-slate-700" value={controlModal.data.estadoNutricional} onChange={(e) => setControlModal({...controlModal, data: { ...controlModal.data, estadoNutricional: e.target.value }})}>
                    <option>Normal</option><option>Riesgo de Desnutrición</option><option>Desnutrición Leve</option><option>Desnutrición Severa</option><option>Sobrepeso</option><option>Obesidad</option>
                 </select>
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                 <button type="button" onClick={() => setControlModal({ show: false, controlId: null, label: '', data: { fecha: '', peso: '', talla: '', estadoNutricional: 'Normal' } })} className="flex-1 px-3 py-1.5 bg-slate-100 rounded-md text-slate-700 text-sm font-medium hover:bg-slate-200">Cancelar</button>
                 <button type="submit" className="flex-1 px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 shadow-sm">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO HITO SUPLEMENTOS */}
      {hitoModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-xs animate-fadeIn">
            <h3 className="text-base font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">{hitoModal.hito?.label}</h3>
            <div className="space-y-3">
              <div><label className="block text-xs font-bold mb-1 text-slate-600">Fecha</label><input type="date" className="w-full border border-slate-300 p-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-400" value={hitoModal.data.fecha} onChange={(e) => setHitoModal({...hitoModal, data: { ...hitoModal.data, fecha: e.target.value }})} /></div>
              {hitoModal.hito?.reqHb && (<div><label className="block text-xs font-bold mb-1 text-blue-700 flex items-center gap-1"><Droplet size={12}/> Valor Hb</label><input type="number" step="0.1" placeholder="Ej: 11.5" className="w-full border border-slate-300 p-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-400" value={hitoModal.data.hb} onChange={(e) => setHitoModal({...hitoModal, data: { ...hitoModal.data, hb: e.target.value }})} /></div>)}
              <div className="flex gap-2 pt-2"><button onClick={() => setHitoModal({ show: false, hito: null, data: {} })} className="flex-1 px-3 py-1.5 text-sm bg-slate-100 rounded-md text-slate-700 font-medium">Cancelar</button><button onClick={saveHito} className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">Guardar</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ModuloAnemia = ({ children, setChildren, showToast }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterEstado, setFilterEstado] = useState('todos'); 
  const [filterCita, setFilterCita] = useState('todos'); 
  
  const [activeTab, setActiveTab] = useState('tratamiento'); 
  const [newCita, setNewCita] = useState('');
  const [hbControl, setHbControl] = useState({ fecha: new Date().toISOString().split('T')[0], hb: '', tipo: 'Control', resultado: 'Normal', observacion: '' });
  
  const [entregaModal, setEntregaModal] = useState({ show: false, index: null, fecha: '', peso: '', talla: '' });
  const [editHbIndex, setEditHbIndex] = useState(null);
  
  const [altaModal, setAltaModal] = useState(false);
  const [altaForm, setAltaForm] = useState({ fecha: new Date().toISOString().split('T')[0], recuperado: true });
  const [deleteHbModal, setDeleteHbModal] = useState({ show: false, index: null });

  const selectedChild = useMemo(() => children.find(c => c.id === parseInt(selectedId)), [children, selectedId]);

  const patientsWithStatus = useMemo(() => children.map(c => ({...c, citaStatus: getCitaStatus(c.proximaCitaAnemia)})), [children]);

  const filteredPatients = useMemo(() => {
    let list = patientsWithStatus;
    if (searchTerm) {
      list = list.filter(c => (c.nombres || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.apellidos || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.dni || '').includes(searchTerm));
    } else {
      list = list.filter(c => c.anemia || (c.tratamientosAnemiaPrevios && c.tratamientosAnemiaPrevios.length > 0) || (c.historialAnemia && c.historialAnemia.length > 0));
    }
    if (filterEstado === 'activos') list = list.filter(c => c.anemia);
    else if (filterEstado === 'alta') list = list.filter(c => !c.anemia && c.tratamientosAnemiaPrevios?.length > 0);
    if (filterCita !== 'todos') list = list.filter(c => c.citaStatus.status === filterCita);
    return list;
  }, [patientsWithStatus, filterEstado, searchTerm, filterCita]);

  const updateChildData = (updatedFields) => {
      const updatedChildren = children.map(c => c.id === parseInt(selectedId) ? { ...c, ...updatedFields } : c);
      setChildren(updatedChildren);
  };

  const promptEntrega = (index) => {
    if (!selectedChild.tratamientoAnemia) return;
    const currentEntregas = selectedChild.tratamientoAnemia.entregas || [];
    const entregaActual = currentEntregas[index];
    let defaultFecha = new Date().toISOString().split('T')[0];
    let defaultPeso = '';
    let defaultTalla = '';
    if (entregaActual) {
        if (typeof entregaActual === 'string') defaultFecha = entregaActual;
        else { defaultFecha = entregaActual.fecha || defaultFecha; defaultPeso = entregaActual.peso || ''; defaultTalla = entregaActual.talla || ''; }
    }
    setEntregaModal({ show: true, index, fecha: defaultFecha, peso: defaultPeso, talla: defaultTalla });
  };

  const confirmEntrega = () => {
    const { index, fecha, peso, talla } = entregaModal;
    if (!fecha) return;
    const currentEntregas = [...(selectedChild.tratamientoAnemia?.entregas || [])];
    currentEntregas[index] = { fecha, peso, talla };
    updateChildData({ tratamientoAnemia: { ...selectedChild.tratamientoAnemia, entregas: currentEntregas } });
    showToast(`Entrega registrada`, 'success');
    setEntregaModal({ show: false, index: null, fecha: '', peso: '', talla: '' });
  };

  const confirmAlta = () => {
      const pastTreatment = { ...selectedChild.tratamientoAnemia, tipo: selectedChild.tipoAnemia, fechaAlta: altaForm.fecha, recuperado: altaForm.recuperado };
      const prevTreatments = selectedChild.tratamientosAnemiaPrevios || [];
      updateChildData({ anemia: false, tipoAnemia: null, tratamientoAnemia: { inicio: null, entregas: [] }, tratamientosAnemiaPrevios: [...prevTreatments, pastTreatment] });
      setSelectedId(null);
      showToast('Alta registrada', 'success');
      setAltaModal(false);
  };

  const cancelEditHb = () => { setEditHbIndex(null); setHbControl({ fecha: new Date().toISOString().split('T')[0], hb: '', tipo: 'Control', resultado: 'Normal', observacion: '' }); };
  const editHbControl = (displayIndex) => { const realIndex = (selectedChild.historialAnemia.length - 1) - displayIndex; const item = selectedChild.historialAnemia[realIndex]; setHbControl({...item, resultado: item.resultado || 'Normal'}); setEditHbIndex(realIndex); };
  const deleteHbControl = (displayIndex) => { setDeleteHbModal({ show: true, index: displayIndex }); };
  const confirmDeleteHb = () => {
      const realIndex = (selectedChild.historialAnemia.length - 1) - deleteHbModal.index;
      const updatedHistorial = [...selectedChild.historialAnemia];
      updatedHistorial.splice(realIndex, 1);
      updateChildData({ historialAnemia: updatedHistorial });
      showToast('Eliminado', 'info');
      if (editHbIndex === realIndex) cancelEditHb();
      setDeleteHbModal({ show: false, index: null });
  };

  const handleAddHbControl = (e) => {
      e.preventDefault();
      const val = parseFloat(hbControl.hb);
      const manualDiag = hbControl.resultado;
      const isAnemia = manualDiag !== 'Normal';
      const manualTipo = isAnemia ? manualDiag.replace('Anemia ', '') : null;
      if (editHbIndex !== null) {
          const updatedHistorial = [...selectedChild.historialAnemia];
          updatedHistorial[editHbIndex] = { ...hbControl, hb: val };
          updateChildData({ historialAnemia: updatedHistorial });
          showToast('Actualizado', 'success');
          cancelEditHb();
          return;
      }
      const nuevoRegistro = { ...hbControl, hb: val };
      const nuevoHistorial = [...(selectedChild.historialAnemia || []), nuevoRegistro];
      let updates = { hemoglobina: val, historialAnemia: nuevoHistorial };
      if (!selectedChild.anemia && isAnemia) {
          updates.anemia = true; updates.tipoAnemia = manualTipo; updates.tratamientoAnemia = { inicio: hbControl.fecha, entregas: [] };
          showToast(`Anemia detectada. Iniciando.`, 'error');
      } else if (!isAnemia && selectedChild.anemia) {
          showToast(`Hb Normal. Evalúe Alta.`, 'success');
      } else { showToast(`Guardado`, 'info'); }
      updateChildData(updates);
      setHbControl({ fecha: new Date().toISOString().split('T')[0], hb: '', tipo: 'Control', resultado: 'Normal', observacion: '' });
  };

  const handleUpdateCita = () => {
      if(!newCita) return;
      updateChildData({ proximaCitaAnemia: newCita });
      showToast('Cita agendada', 'success');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-5 w-full border border-slate-100">
      <h2 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-1.5"><Droplet className="fill-current" size={18} /> Módulo de Anemia</h2>
      
      {!selectedChild ? (
        <div className="w-full">
           <div className="bg-red-50/50 p-5 rounded-xl shadow-sm text-center mb-5 border border-red-100">
              <div className="relative max-w-xl mx-auto"><Search className="absolute left-3 top-2 text-slate-400" size={16} /><input type="text" placeholder="DNI o Nombres..." className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-red-400 focus:outline-none text-sm bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus /></div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-4 pt-4 border-t border-red-100 justify-center">
                <div className="flex items-center gap-1.5">
                   <span className="text-[11px] font-bold text-red-800 flex items-center uppercase tracking-wider"><User size={12} className="mr-1"/> Estado:</span>
                   <select className="border border-red-200 text-red-800 bg-white rounded-md px-2 py-1 text-xs font-medium outline-none focus:ring-1 focus:ring-red-400 shadow-sm" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}><option value="todos">Todos</option><option value="activos">Activos</option><option value="alta">De Alta</option></select>
                </div>
                <div className="hidden sm:block w-px bg-red-200"></div>
                <div className="flex flex-wrap items-center gap-1.5">
                   <span className="text-[11px] font-bold text-red-800 flex items-center mr-1 uppercase tracking-wider"><Filter size={12} className="mr-1"/> Citas:</span>
                   {[{ id: 'todos', label: 'Todas' }, { id: 'hoy', label: 'Hoy' }, { id: 'proximo', label: 'Próximas' }, { id: 'vencido', label: 'Vencidas' }].map(f => (
                     <button key={f.id} onClick={() => setFilterCita(f.id)} className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${filterCita === f.id ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'}`}>{f.label}</button>
                   ))}
                </div>
              </div>
           </div>
           
           <div className="space-y-2">
             {filteredPatients.length > 0 ? filteredPatients.map(child => {
                const isAlta = !child.anemia && child.tratamientosAnemiaPrevios?.length > 0;
                return (
                 <div key={child.id} className={`bg-white p-3 rounded-lg shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:shadow-md transition-shadow ${isAlta ? 'border-green-200' : child.anemia ? 'border-red-200' : 'border-slate-100'}`}>
                   <div className="flex items-center gap-3 flex-1">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${child.anemia ? 'bg-red-50 text-red-600 border-red-100' : (isAlta ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-600 border-slate-200')}`}>{child.nombres?.[0] || '-'}</div>
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-sm text-slate-800">{child.nombres} {child.apellidos}</h3>
                          {child.anemia ? (
                             <span className="bg-red-50 text-red-700 text-[10px] px-1.5 py-0.5 rounded border border-red-200 font-bold flex items-center"><AlertTriangle size={10} className="mr-1"/> Entr. {(child.tratamientoAnemia?.entregas || []).filter(Boolean).length}/6</span>
                          ) : (isAlta ? (
                             <span className="bg-green-50 text-green-700 text-[10px] px-1.5 py-0.5 rounded border border-green-200 font-bold flex items-center"><CheckCircle size={10} className="mr-1"/> De Alta</span>
                          ) : null)}
                       </div>
                       <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-semibold"><CreditCard size={10} className="text-slate-400"/> {child.dni}</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold ${child.anemia ? 'bg-red-50 text-red-700 border-red-100' : (isAlta ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100')}`}>
                             <Calendar size={10} className="opacity-70"/> {new Date(child.fechaNacimiento + 'T00:00:00').toLocaleDateString('es-PE', {day: '2-digit', month: 'short', year: 'numeric'})}
                             <span className="mx-0.5 opacity-40">|</span>
                             <Clock size={10} className="opacity-70"/> {calculateDetailedAge(child.fechaNacimiento)?.shortFormatted || '-'}
                          </span>
                       </div>
                     </div>
                   </div>
                   
                   <div className={`px-3 py-1.5 rounded-lg border ${child.citaStatus.bg} ${child.citaStatus.border} flex flex-col items-center min-w-[110px] w-full sm:w-auto shrink-0`}>
                      <span className={`text-[10px] font-bold uppercase ${child.citaStatus.color}`}>{child.citaStatus.status === 'sin_cita' ? 'Cita Anemia' : child.citaStatus.label}</span>
                      <span className={`text-xs font-medium ${child.citaStatus.color}`}>{child.citaStatus.status === 'sin_cita' ? 'No programada' : formatDateLong(child.proximaCitaAnemia)}</span>
                   </div>

                   <button onClick={() => { setSelectedId(child.id); setSearchTerm(''); setActiveTab(child.anemia ? 'tratamiento' : (isAlta ? 'tratamientos_previos' : 'historial')); }} className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium flex justify-center items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 ${child.anemia ? 'bg-red-600 text-white hover:bg-red-700' : (isAlta ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700')}`}>
                     {child.anemia ? 'Seguimiento' : (isAlta ? 'Historial' : 'Tamizaje')} <ChevronRight size={16}/>
                   </button>
                 </div>
               )
             }) : <div className="text-center p-6 text-sm text-slate-500">No hay pacientes con estos filtros</div>}
           </div>
        </div>
      ) : (
        <div className="animate-fadeIn">
          <button onClick={() => setSelectedId(null)} className="mb-3 text-slate-600 hover:text-slate-900 flex items-center gap-1 text-xs font-bold bg-white px-3 py-1.5 rounded border border-slate-200 shadow-sm w-fit transition-all hover:bg-slate-50">
              <ChevronLeft size={14}/> Volver
          </button>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row gap-5 items-start mb-5">
              <div className={`w-16 h-16 shrink-0 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-sm bg-gradient-to-br ${selectedChild.sexo === 'Femenino' ? 'from-pink-400 to-pink-500' : 'from-blue-400 to-blue-500'}`}>
                  {selectedChild.nombres?.[0] || '-'}
              </div>
              <div className="flex-1 w-full pt-1">
                  <h2 className="text-xl font-extrabold text-slate-800 leading-tight">{selectedChild.nombres} {selectedChild.apellidos}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-xs text-slate-600"><FileText size={12} className="text-slate-400"/> <span className="font-bold text-slate-700">HC:</span> {selectedChild.historiaClinica || 'S/N'}</span>
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-xs text-slate-600"><User size={12} className="text-slate-400"/> <span className="font-bold text-slate-700">DNI:</span> {selectedChild.dni}</span>
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-xs text-slate-600"><Calendar size={12} className="text-slate-400"/> <span className="font-bold text-slate-700">F. Nac:</span> {new Date(selectedChild.fechaNacimiento + 'T00:00:00').toLocaleDateString('es-PE', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-xs text-slate-600"><Clock size={12} className="text-slate-400"/> <span className="font-bold text-slate-700">Edad:</span> <span className={selectedChild.sexo === 'Femenino' ? 'text-pink-600 font-bold' : 'text-blue-600 font-bold'}>{calculateDetailedAge(selectedChild.fechaNacimiento)?.formatted}</span></span>
                      {selectedChild.anemia && (<span className="px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border-red-200 flex items-center gap-1"><AlertTriangle size={10} className="fill-current"/> Anemia</span>)}
                      {selectedChild.tratamientosAnemiaPrevios?.length > 0 && !selectedChild.anemia && (<span className="px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border-green-200 flex items-center gap-1"><CheckCircle size={10} className="fill-current"/> De Alta</span>)}
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${selectedChild.anemia ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          <Droplet size={10} className="fill-current"/> Hb: {selectedChild.hemoglobina || '-'}
                      </span>
                  </div>
              </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
              {selectedChild.anemia && <button onClick={() => setActiveTab('tratamiento')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'tratamiento' ? 'bg-red-100 text-red-800' : 'text-slate-600 hover:bg-slate-50'}`}>Tratamiento</button>}
              <button onClick={() => setActiveTab('historial')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'historial' ? 'bg-red-100 text-red-800' : 'text-slate-600 hover:bg-slate-50'}`}>Historial Hb</button>
              <button onClick={() => setActiveTab('tratamientos_previos')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${activeTab === 'tratamientos_previos' ? 'bg-red-100 text-red-800' : 'text-slate-600 hover:bg-slate-50'}`}><Archive size={14}/> Altas Previas</button>
              <button onClick={() => setActiveTab('citas')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'citas' ? 'bg-red-100 text-red-800' : 'text-slate-600 hover:bg-slate-50'}`}>Agendar</button>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 min-h-[300px]">
          {activeTab === 'tratamiento' && (
             selectedChild.anemia ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn">
                  <div className="md:col-span-1 space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <h4 className="font-bold text-red-800 text-sm flex items-center gap-1.5 mb-2"><AlertTriangle size={16}/> Activo</h4>
                      <div className="space-y-1.5 text-xs text-red-900">
                        <div className="flex justify-between"><span>Inicio:</span> <span className="font-bold">{formatDateLong(selectedChild.tratamientoAnemia?.inicio)}</span></div>
                        <div className="flex justify-between"><span>Tipo:</span> <span className="font-bold">{selectedChild.tipoAnemia}</span></div>
                      </div>
                    </div>
                    <button onClick={() => { setAltaForm({ fecha: new Date().toISOString().split('T')[0], recuperado: true }); setAltaModal(true); }} className="w-full border-2 border-green-500 text-green-700 font-bold py-1.5 rounded-lg text-sm hover:bg-green-50 transition-colors">Dar de Alta</button>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5"><Circle className="text-blue-500" size={16}/> Esquema 6 Meses</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[...Array(6)].map((_, i) => {
                        const entregado = selectedChild.tratamientoAnemia?.entregas?.[i];
                        const isCompleted = !!entregado;
                        const eFecha = typeof entregado === 'string' ? entregado : entregado?.fecha;
                        const ePeso = typeof entregado === 'object' ? entregado?.peso : null;
                        const eTalla = typeof entregado === 'object' ? entregado?.talla : null;

                        return (
                          <button key={i} onClick={() => promptEntrega(i)} className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${isCompleted ? 'border-green-400 bg-green-50 hover:bg-green-100' : 'border-slate-200 hover:border-blue-300 bg-white shadow-sm'}`}>
                            <span className={`text-[10px] font-bold uppercase mb-1.5 tracking-wider ${isCompleted ? 'text-green-700' : 'text-slate-400'}`}>Entrega {i + 1}</span>
                            {isCompleted ? (
                                <>
                                    <CheckCircle size={24} className="text-green-500 mb-1"/>
                                    <span className="text-[10px] font-bold text-green-800">{formatDateLong(eFecha)}</span>
                                    {(ePeso || eTalla) && (
                                        <span className="text-[9px] text-green-700 mt-1 bg-green-100/50 px-1.5 py-0.5 rounded border border-green-200 font-medium">
                                            {ePeso ? `${ePeso}kg ` : ''}{ePeso && eTalla ? '| ' : ''}{eTalla ? `${eTalla}cm` : ''}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 mb-1 flex items-center justify-center text-slate-400 font-bold text-[10px]">{i + 1}</div>
                                    <span className="text-[10px] text-blue-600 font-bold">Registrar</span>
                                </>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
             ) : (
                <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <CheckCircle size={36} className="mx-auto text-green-400 mb-3"/>
                    <h3 className="text-sm font-bold text-slate-700">Sin Anemia Activa</h3>
                    <p className="text-xs text-slate-500">El paciente no requiere tratamiento.</p>
                </div>
             )
          )}

          {activeTab === 'historial' && (
              <div className="space-y-5 animate-fadeIn">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-1.5"><Activity size={16}/> {editHbIndex !== null ? 'Editar Registro' : 'Nuevo Control Hb'}</h3>
                          {editHbIndex !== null && <button onClick={cancelEditHb} className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Cancelar Edición</button>}
                      </div>
                      <form onSubmit={handleAddHbControl} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 items-end">
                          <div className="md:col-span-1"><label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase">Fecha</label><input type="date" className="w-full border border-slate-300 p-1.5 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" value={hbControl.fecha} onChange={e => setHbControl({...hbControl, fecha: e.target.value})} required/></div>
                          <div className="md:col-span-1"><label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase">Valor Hb</label><input type="number" step="0.1" className="w-full border border-slate-300 p-1.5 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" placeholder="11.5" value={hbControl.hb} onChange={e => setHbControl({...hbControl, hb: e.target.value})} required/></div>
                          <div className="md:col-span-1"><label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase">Tipo</label><select className="w-full border border-slate-300 p-1.5 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" value={hbControl.tipo} onChange={e => setHbControl({...hbControl, tipo: e.target.value})}><option>Tamizaje</option><option>Control</option><option>Diagnóstico</option><option>Alta</option></select></div>
                          <div className="md:col-span-1"><label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase">Diagnóstico</label><select className="w-full border border-slate-300 p-1.5 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400 font-medium text-slate-700" value={hbControl.resultado} onChange={e => setHbControl({...hbControl, resultado: e.target.value})}><option value="Normal">Normal</option><option value="Anemia Leve">Anemia Leve</option><option value="Anemia Moderada">Anemia Moderada</option><option value="Anemia Severa">Anemia Severa</option></select></div>
                          <div className="md:col-span-1"><label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase">Observación</label><input className="w-full border border-slate-300 p-1.5 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" placeholder="Opcional" value={hbControl.observacion} onChange={e => setHbControl({...hbControl, observacion: e.target.value})}/></div>
                          <button className={`text-white px-3 py-1.5 rounded text-sm font-bold md:col-span-1 ${editHbIndex !== null ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{editHbIndex !== null ? 'Actualizar' : 'Guardar'}</button>
                      </form>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left">
                          <thead className="bg-slate-100 text-[10px] uppercase text-slate-500 font-bold tracking-wider"><tr><th className="p-2.5">Fecha</th><th className="p-2.5">Hb</th><th className="p-2.5">Estado</th><th className="p-2.5">Tipo</th><th className="p-2.5">Obs</th><th className="p-2.5 text-center">Acciones</th></tr></thead>
                          <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                              {selectedChild.historialAnemia && selectedChild.historialAnemia.length > 0 ? (
                                  [...selectedChild.historialAnemia].reverse().map((reg, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50">
                                          <td className="p-2.5">{formatDateLong(reg.fecha)}</td>
                                          <td className="p-2.5 font-bold text-blue-700">{reg.hb}</td>
                                          <td className="p-2.5 font-medium">{reg.resultado || (reg.hb < 11 ? 'Anemia' : 'Normal')}</td>
                                          <td className="p-2.5">{reg.tipo}</td>
                                          <td className="p-2.5 text-slate-400 truncate max-w-[100px]">{reg.observacion || '-'}</td>
                                          <td className="p-2.5 text-center">
                                              <div className="flex items-center justify-center gap-1.5">
                                                  <button onClick={() => editHbControl(idx)} className="text-amber-600 hover:bg-amber-100 p-1 rounded" title="Editar"><Edit size={14}/></button>
                                                  <button onClick={() => deleteHbControl(idx)} className="text-red-600 hover:bg-red-100 p-1 rounded" title="Eliminar"><Trash size={14}/></button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))
                              ) : <tr><td colSpan="6" className="p-4 text-center text-slate-400 italic text-xs">Sin registros históricos</td></tr>}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {activeTab === 'tratamientos_previos' && (
             <div className="space-y-4 animate-fadeIn">
               <h3 className="text-sm font-bold text-slate-800">Historial de Tratamientos Pasados</h3>
               {selectedChild.tratamientosAnemiaPrevios?.length > 0 ? (
                  selectedChild.tratamientosAnemiaPrevios.map((trat, idx) => (
                    <div key={idx} className="bg-white border border-green-200 rounded-xl p-4 shadow-sm">
                       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 border-b border-slate-100 pb-2 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">Trat. #{idx + 1}</span>
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{trat.tipo || 'Anemia'}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${trat.recuperado !== false ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                              {trat.recuperado !== false ? 'Recuperado' : 'No Recuperado'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-medium"><span className="text-slate-400">Inicio:</span> {formatDateLong(trat.inicio)}</span>
                            <ChevronRight size={14} className="text-slate-300"/>
                            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 font-medium"><span className="text-slate-400">Alta:</span> {formatDateLong(trat.fechaAlta)}</span>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {[...Array(6)].map((_, i) => {
                             const entrega = trat.entregas?.[i];
                             const eFecha = typeof entrega === 'string' ? entrega : entrega?.fecha;
                             const ePeso = typeof entrega === 'object' ? entrega?.peso : null;
                             return (
                                 <div key={i} className={`p-2 rounded border flex flex-col items-center ${entrega ? 'bg-green-50/50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">E.{i+1}</div>
                                    <div className={`text-xs font-bold text-center ${entrega ? 'text-green-700' : 'text-slate-400'}`}>
                                       {eFecha ? formatDateLong(eFecha) : '-'}
                                    </div>
                                    {ePeso && <div className="text-[9px] text-green-600 mt-0.5 font-medium">{ePeso}kg</div>}
                                 </div>
                             )
                          })}
                       </div>
                    </div>
                  )).reverse()
               ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                     <Archive size={36} className="mx-auto text-slate-300 mb-2" />
                     <p className="text-xs text-slate-500 font-medium">Este paciente no tiene historial de altas previas.</p>
                  </div>
               )}
             </div>
          )}

          {activeTab === 'citas' && (<div className="space-y-4 animate-fadeIn"><h2 className="text-sm font-bold text-purple-800">Agendar Cita</h2><div className="flex gap-2 max-w-sm"><input type="date" className="border border-slate-200 p-1.5 rounded text-sm w-full outline-none focus:ring-1 focus:ring-purple-400" value={newCita} onChange={(e) => setNewCita(e.target.value)} /><button onClick={handleUpdateCita} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700">Agendar</button></div></div>)}
          </div>
        </div>
      )}

      {/* Modal para Registrar/Editar Entrega Anemia */}
      {entregaModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-xs animate-slideDown">
            <h3 className="text-base font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Entrega #{entregaModal.index + 1}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Fecha</label>
                <input type="date" className="w-full border border-slate-300 p-2 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-sm" value={entregaModal.fecha} onChange={(e) => setEntregaModal({...entregaModal, fecha: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Peso (kg)</label>
                    <input type="number" step="0.01" className="w-full border border-slate-300 p-2 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-sm" placeholder="Ej: 10.5" value={entregaModal.peso} onChange={(e) => setEntregaModal({...entregaModal, peso: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Talla (cm)</label>
                    <input type="number" step="0.1" className="w-full border border-slate-300 p-2 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-sm" placeholder="Ej: 75.5" value={entregaModal.talla} onChange={(e) => setEntregaModal({...entregaModal, talla: e.target.value})} />
                 </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => setEntregaModal({ show: false, index: null, fecha: '', peso: '', talla: '' })} className="flex-1 px-3 py-1.5 bg-slate-100 rounded-md text-slate-700 font-medium text-sm">Cancelar</button>
                <button onClick={confirmEntrega} className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 text-sm">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Alta */}
      {altaModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-xs animate-slideDown text-center">
            <CheckCircle className="mx-auto text-green-500 mb-2" size={36} />
            <h3 className="text-base font-bold text-slate-800 mb-1">Dar de Alta</h3>
            <p className="text-xs text-slate-500 mb-4">El tratamiento se moverá al Historial.</p>
            
            <div className="space-y-3 text-left mb-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Fecha de Alta</label>
                <input type="date" className="w-full border border-slate-300 p-1.5 rounded focus:ring-1 focus:ring-green-400 outline-none text-sm" value={altaForm.fecha} onChange={(e) => setAltaForm({...altaForm, fecha: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">¿Recuperado?</label>
                <select className="w-full border border-slate-300 p-1.5 rounded focus:ring-1 focus:ring-green-400 outline-none text-sm font-medium" value={altaForm.recuperado} onChange={(e) => setAltaForm({...altaForm, recuperado: e.target.value === 'true'})}>
                  <option value="true">Sí, Recuperado</option>
                  <option value="false">No (Abandono/Límite)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setAltaModal(false)} className="flex-1 px-3 py-1.5 bg-slate-100 rounded-md text-slate-700 font-medium text-sm">Cancelar</button>
              <button onClick={confirmAlta} className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 text-sm">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación Hb */}
      {deleteHbModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-xs animate-slideDown text-center">
              <AlertTriangle className="mx-auto text-red-500 mb-3" size={36} />
              <h3 className="text-base font-bold text-slate-800 mb-1">¿Eliminar Registro?</h3>
              <p className="text-xs text-slate-500 mb-4">Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteHbModal({show: false, index: null})} className="flex-1 px-3 py-1.5 bg-slate-100 rounded-md text-slate-700 font-medium text-sm">Cancelar</button>
                <button onClick={confirmDeleteHb} className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 text-sm">Eliminar</button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- NUEVO MOTOR DE REPORTES (Formato Atención Integral / Anemia) ---
const Reportes = ({ children, showToast, appConfig }) => {
  const [reportType, setReportType] = useState('diario'); 
  const [moduleType, setModuleType] = useState('cred'); // 'cred', 'anemia'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const safeConfig = appConfig || { nombreCentro: 'Centro de Salud' };

  const reportData = useMemo(() => {
    let rows = [];

    const isDateInPeriod = (dateStr) => {
        if (!dateStr) return false;
        if (reportType === 'diario') return dateStr === selectedDate;
        return dateStr.startsWith(selectedMonth);
    };

    children.forEach(child => {
        let datesMap = {}; 

        const addDate = (d) => {
            if(!datesMap[d]) {
                datesMap[d] = { 
                    peso: '', talla: '', nCred: '', 
                    vacunas: [], hb: '', diagnostico: '', entregaNum: '', alta: '',
                    sf: '', mmn: '', vitA: '',
                    isAnemiaActivity: false, isCredActivity: false
                };
            }
        };

        // 1. CRED
        if (child.cronogramaCred) {
            Object.entries(child.cronogramaCred).forEach(([key, val]) => {
                if (isDateInPeriod(val.fecha)) {
                    addDate(val.fecha);
                    datesMap[val.fecha].peso = val.peso;
                    datesMap[val.fecha].talla = val.talla;
                    const lbl = ESQUEMA_CONTROLES_CRED.flatMap(g => g.controles).find(c => c.id === key)?.label || key;
                    datesMap[val.fecha].nCred = lbl;
                    datesMap[val.fecha].isCredActivity = true;
                }
            });
        }

        // 2. Vacunas
        if (child.vacunas) {
            Object.entries(child.vacunas).forEach(([vacuna, fecha]) => {
                if (isDateInPeriod(fecha)) {
                    addDate(fecha);
                    datesMap[fecha].vacunas.push(vacuna);
                    datesMap[fecha].isCredActivity = true;
                }
            });
        }

        // 3. Suplementos & Hb (CRED module)
        if (child.cronogramaSuplementos) {
            Object.entries(child.cronogramaSuplementos).forEach(([key, val]) => {
                if (isDateInPeriod(val.fecha)) {
                    addDate(val.fecha);
                    if (val.hb) datesMap[val.fecha].hb = val.hb;
                    if (key.toLowerCase().includes('mmn')) datesMap[val.fecha].mmn = 'X';
                    else if (key.toLowerCase().includes('entrega')) datesMap[val.fecha].sf = 'X';
                    datesMap[val.fecha].isCredActivity = true;
                }
            });
        }

        // 4. Anemia Module
        if (child.historialAnemia) {
            child.historialAnemia.forEach(val => {
                if (isDateInPeriod(val.fecha)) {
                    addDate(val.fecha);
                    datesMap[val.fecha].hb = val.hb;
                    if (val.resultado) datesMap[val.fecha].diagnostico = val.resultado;
                    if (val.tipo === 'Alta') datesMap[val.fecha].alta = 'Sí';
                    datesMap[val.fecha].isAnemiaActivity = true;
                }
            });
        }
        
        if (child.tratamientoAnemia?.entregas) {
            child.tratamientoAnemia.entregas.forEach((entrega, idx) => {
                const fecha = typeof entrega === 'string' ? entrega : entrega?.fecha;
                if (fecha && isDateInPeriod(fecha)) {
                    addDate(fecha);
                    datesMap[fecha].sf = `Entr. ${idx+1}`; 
                    datesMap[fecha].entregaNum = `${idx+1}`; 
                    if (typeof entrega === 'object') {
                        if (!datesMap[fecha].peso && entrega.peso) datesMap[fecha].peso = entrega.peso;
                        if (!datesMap[fecha].talla && entrega.talla) datesMap[fecha].talla = entrega.talla;
                    }
                    datesMap[fecha].isAnemiaActivity = true;
                }
            });
        }

        if (child.tratamientosAnemiaPrevios) {
            child.tratamientosAnemiaPrevios.forEach((trat) => {
                if (trat.fechaAlta && isDateInPeriod(trat.fechaAlta)) {
                    addDate(trat.fechaAlta);
                    datesMap[trat.fechaAlta].alta = trat.recuperado ? 'Recuperado' : 'No Recup.';
                    datesMap[trat.fechaAlta].isAnemiaActivity = true;
                }
                if (trat.entregas) {
                   trat.entregas.forEach((entrega, idx) => {
                      const fecha = typeof entrega === 'string' ? entrega : entrega?.fecha;
                      if (fecha && isDateInPeriod(fecha)) {
                         addDate(fecha);
                         datesMap[fecha].sf = `Entr. ${idx+1}`;
                         datesMap[fecha].entregaNum = `${idx+1}`;
                         if (typeof entrega === 'object') {
                            if (!datesMap[fecha].peso && entrega.peso) datesMap[fecha].peso = entrega.peso;
                            if (!datesMap[fecha].talla && entrega.talla) datesMap[fecha].talla = entrega.talla;
                         }
                         datesMap[fecha].isAnemiaActivity = true;
                      }
                   });
                }
            });
        }

        Object.keys(datesMap).forEach(date => {
            const ev = datesMap[date];
            if (moduleType === 'cred' && !ev.isCredActivity) return;
            if (moduleType === 'anemia' && !ev.isAnemiaActivity) return;

            rows.push({ child, date, data: ev });
        });
    });

    return rows.sort((a, b) => {
        if (a.date !== b.date) return new Date(b.date) - new Date(a.date);
        return (a.child.nombres || '').localeCompare(b.child.nombres || '');
    });
  }, [children, reportType, selectedDate, selectedMonth, moduleType]);

  const handlePrint = () => {
    try {
        const printContent = document.getElementById('printable-report-area');
        if(printContent) {
            const isAnemia = moduleType === 'anemia';
            const html = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>Reporte - ${safeConfig.nombreCentro}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 10px; }
                        .text-center { text-align: center; }
                        .title { font-size: 16px; font-weight: bold; color: ${isAnemia ? '#b30000' : '#1a3686'}; text-transform: uppercase; margin: 0 0 5px 0;}
                        .subtitle { font-size: 11px; color: #555; margin: 0 0 15px 0;}
                        table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                        thead { display: table-header-group; }
                        th, td { border: 1px solid #999; padding: 5px 3px; text-align: center; }
                        .header-cred th { background-color: #1a3686 !important; color: #ffffff !important; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .header-anemia th { background-color: #b30000 !important; color: #ffffff !important; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .empty-state { padding: 30px; text-align: center; font-style: italic; color: #666; border: 1px dashed #ccc;}
                    </style>
                </head>
                <body onload="setTimeout(() => window.print(), 800)">
                    ${printContent.innerHTML}
                </body>
                </html>
            `;
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank'; 
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } else {
            window.print();
        }
    } catch (err) {
        window.print(); 
    }
  };

  const handleExportExcel = () => {
      if (reportData.length === 0) {
          if (showToast) showToast('No hay datos para exportar', 'error');
          return;
      }
      
      const isAnemia = moduleType === 'anemia';
      const headerBgColor = isAnemia ? '#b30000' : '#1a3686';

      let tableHtml = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
             <meta charset="UTF-8">
             <style>
                table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11px; }
                th, td { border: 1px solid #000000; padding: 5px; }
                th { background-color: ${headerBgColor}; color: #ffffff; font-weight: bold; text-align: center; vertical-align: middle; }
                td { vertical-align: middle; }
             </style>
          </head>
          <body>
              <table>
                  <thead>
      `;

      if (isAnemia) {
          tableHtml += `
              <tr>
                  <th>Fecha Atención</th>
                  <th>HC</th>
                  <th>DNI</th>
                  <th>Paciente</th>
                  <th>Sexo</th>
                  <th>F. Nacimiento</th>
                  <th>Edad</th>
                  <th>Peso (Kg)</th>
                  <th>Talla (Cm)</th>
                  <th>Hb</th>
                  <th>Diagnóstico</th>
                  <th>Entrega N°</th>
                  <th>Alta</th>
                  <th>Ubicación</th>
              </tr>
          `;
      } else {
          tableHtml += `
              <tr>
                  <th rowspan="2">Fecha Atención</th>
                  <th rowspan="2">HC</th>
                  <th rowspan="2">DNI</th>
                  <th rowspan="2">Paciente</th>
                  <th rowspan="2">Sexo</th>
                  <th rowspan="2">F. Nacimiento</th>
                  <th rowspan="2">Edad</th>
                  <th rowspan="2">Peso (Kg)</th>
                  <th rowspan="2">Talla (Cm)</th>
                  <th rowspan="2">Hb</th>
                  <th rowspan="2">N° CRED</th>
                  <th rowspan="2">Inmunizaciones</th>
                  <th colspan="3">Suplementación</th>
                  <th rowspan="2">Ubicación</th>
              </tr>
              <tr>
                  <th>SF</th>
                  <th>MMN</th>
                  <th>Vit. A</th>
              </tr>
          `;
      }

      tableHtml += `</thead><tbody>`;

      reportData.forEach(ev => {
          const edadFormatted = calculateDetailedAge(ev.child.fechaNacimiento)?.shortFormatted || '-';
          
          if (isAnemia) {
              tableHtml += `
                  <tr>
                      <td style="text-align: center;">${ev.date}</td>
                      <td style="text-align: center;">${ev.child.historiaClinica || '-'}</td>
                      <td style="text-align: center; mso-number-format:'\@';">${ev.child.dni}</td>
                      <td style="font-weight: bold;">${ev.child.nombres} ${ev.child.apellidos}</td>
                      <td style="text-align: center;">${ev.child.sexo === 'Masculino' ? 'M' : 'F'}</td>
                      <td style="text-align: center;">${ev.child.fechaNacimiento}</td>
                      <td style="text-align: center;">${edadFormatted}</td>
                      <td style="text-align: center;">${ev.data.peso || '-'}</td>
                      <td style="text-align: center;">${ev.data.talla || '-'}</td>
                      <td style="text-align: center; font-weight: bold; color: #b30000;">${ev.data.hb || '-'}</td>
                      <td style="text-align: center; font-weight: bold;">${ev.data.diagnostico || '-'}</td>
                      <td style="text-align: center; font-weight: bold;">${ev.data.entregaNum || '-'}</td>
                      <td style="text-align: center; font-weight: bold; color: #166534;">${ev.data.alta || '-'}</td>
                      <td>${ev.child.localidad || ev.child.direccion || '-'}</td>
                  </tr>
              `;
          } else {
               tableHtml += `
                  <tr>
                      <td style="text-align: center;">${ev.date}</td>
                      <td style="text-align: center;">${ev.child.historiaClinica || '-'}</td>
                      <td style="text-align: center; mso-number-format:'\@';">${ev.child.dni}</td>
                      <td style="font-weight: bold;">${ev.child.nombres} ${ev.child.apellidos}</td>
                      <td style="text-align: center;">${ev.child.sexo === 'Masculino' ? 'M' : 'F'}</td>
                      <td style="text-align: center;">${ev.child.fechaNacimiento}</td>
                      <td style="text-align: center;">${edadFormatted}</td>
                      <td style="text-align: center; font-weight: bold; color: #1e40af;">${ev.data.peso || '-'}</td>
                      <td style="text-align: center; font-weight: bold; color: #1e40af;">${ev.data.talla || '-'}</td>
                      <td style="text-align: center; font-weight: bold; color: #b30000;">${ev.data.hb || '-'}</td>
                      <td style="text-align: center;">${ev.data.nCred || '-'}</td>
                      <td>${ev.data.vacunas.join(', ') || '-'}</td>
                      <td style="text-align: center; font-weight: bold;">${ev.data.sf || '-'}</td>
                      <td style="text-align: center; font-weight: bold;">${ev.data.mmn || '-'}</td>
                      <td style="text-align: center; font-weight: bold;">${ev.data.vitA || '-'}</td>
                      <td>${ev.child.localidad || ev.child.direccion || '-'}</td>
                  </tr>
              `;
          }
      });

      tableHtml += `</tbody></table></body></html>`;

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Atencion_${moduleType.toUpperCase()}_${reportType}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 w-full text-sm">
      <div className="print:hidden bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-3">
          <div>
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5"><FileText className="text-blue-600" size={20}/> Centro de Reportes</h2>
             <p className="text-xs text-slate-500">Formatos nominales de Atención Integral o Seguimiento de Anemia</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-sm transition-colors justify-center w-full sm:w-auto">
              <Download size={16} /> Exportar Excel
            </button>
            <button onClick={handlePrint} className={`${moduleType === 'anemia' ? 'bg-[#b30000] hover:bg-red-800' : 'bg-blue-800 hover:bg-blue-900'} text-white px-4 py-2 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-sm transition-colors justify-center w-full sm:w-auto`}>
              <Printer size={16} /> Imprimir
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
             <button onClick={() => setReportType('diario')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${reportType === 'diario' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Diario</button>
             <button onClick={() => setReportType('mensual')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${reportType === 'mensual' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Mensual</button>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
             <button onClick={() => setModuleType('cred')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${moduleType === 'cred' ? 'bg-[#1a3686] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Módulo CRED</button>
             <button onClick={() => setModuleType('anemia')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${moduleType === 'anemia' ? 'bg-[#b30000] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Módulo Anemia</button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500"><Calendar size={16}/></span>
            {reportType === 'diario' ? (
               <input type="date" className="border border-slate-300 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-400" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}/>
            ) : (
               <input type="month" className="border border-slate-300 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-400" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}/>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto w-full">
        <div id="printable-report-area" className="min-w-[900px] p-5 w-full">
            <div className="text-center mb-3">
                <h1 className="title" style={{ color: moduleType === 'anemia' ? '#b30000' : '#1a3686', textTransform: 'uppercase' }}>{(safeConfig.nombreCentro || '').toUpperCase()}</h1>
                <p className="subtitle">
                   REPORTE {reportType === 'diario' ? 'DIARIO' : 'MENSUAL'} DE {moduleType === 'anemia' ? 'SEGUIMIENTO DE ANEMIA' : 'ATENCIÓN CRED'} 
                   ({reportType === 'diario' ? formatDateLong(selectedDate) : selectedMonth})
                </p>
            </div>

            {reportData.length > 0 ? (
                moduleType === 'anemia' ? (
                    <table className="w-full text-[10px] border-collapse border border-slate-300 header-anemia">
                        <thead>
                            <tr className="bg-[#b30000] text-white">
                                <th className="border border-slate-300 p-1.5">Fecha Atención</th>
                                <th className="border border-slate-300 p-1.5">HC</th>
                                <th className="border border-slate-300 p-1.5">DNI</th>
                                <th className="border border-slate-300 p-1.5">Paciente</th>
                                <th className="border border-slate-300 p-1.5 w-8">Sexo</th>
                                <th className="border border-slate-300 p-1.5">F. Nacimiento</th>
                                <th className="border border-slate-300 p-1.5">Edad</th>
                                <th className="border border-slate-300 p-1.5 w-10">Peso (Kg)</th>
                                <th className="border border-slate-300 p-1.5 w-10">Talla (Cm)</th>
                                <th className="border border-slate-300 p-1.5 w-10">Hb</th>
                                <th className="border border-slate-300 p-1.5">Diagnóstico</th>
                                <th className="border border-slate-300 p-1.5 w-14">Entrega N°</th>
                                <th className="border border-slate-300 p-1.5 w-12">Alta</th>
                                <th className="border border-slate-300 p-1.5">Ubicación</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-800">
                            {reportData.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50 border-b border-slate-200">
                                    <td className="border border-slate-300 p-1.5 text-center">{row.date}</td>
                                    <td className="border border-slate-300 p-1.5 text-center">{row.child.historiaClinica || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center">{row.child.dni}</td>
                                    <td className="border border-slate-300 p-1.5 font-bold whitespace-nowrap">{row.child.nombres} {row.child.apellidos}</td>
                                    <td className="border border-slate-300 p-1.5 text-center">{row.child.sexo === 'Masculino' ? 'M' : 'F'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center whitespace-nowrap">{row.child.fechaNacimiento}</td>
                                    <td className="border border-slate-300 p-1.5 text-center whitespace-nowrap">{calculateDetailedAge(row.child.fechaNacimiento)?.shortFormatted || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center">{row.data.peso || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center">{row.data.talla || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center font-bold text-red-700">{row.data.hb || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center font-bold">{row.data.diagnostico || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center font-bold">{row.data.entregaNum || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center font-bold text-green-700">{row.data.alta || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center text-[9px] truncate max-w-[100px]">{row.child.localidad || row.child.direccion || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-[10px] border-collapse border border-slate-300 header-cred">
                        <thead>
                            <tr className="bg-[#1a3686] text-white">
                                <th rowSpan="2" className="border border-slate-300 p-1.5">Fecha Atención</th>
                                <th rowSpan="2" className="border border-slate-300 p-1.5">HC</th>
                                <th rowSpan="2" className="border border-slate-300 p-1.5">DNI</th>
                                <th rowSpan="2" className="border border-slate-300 p-1.5">Paciente</th>
                                <th rowSpan="2" className="border border-slate-300 p-1.5 w-8">Sexo</th>
                                <th rowSpan="2" className="border border-slate-300 p-1.5">F. Nacimiento</th>
                                <th rowSpan="2" className="border border-slate-300 p-1.5">Edad</th>
                                <th rowSpan="2" className="border border-slate-300 p-1.5 w-10">Peso (Kg)</th>
                                <th rowSpan="2" className="border border-slate-300 p-1.5 w-10">Talla (Cm)</th>
                                <th rowSpan="2" className="border border-slate-300 p-1.5 w-10">Hb</th>
                                <th rowSpan="2" className="border border-slate-300 p-1.5">N° CRED</th>
                                <th rowSpan="2" className="border border-slate-300 p-1.5 max-w-[120px]">Inmunizaciones</th>
                                <th colSpan="3" className="border border-slate-300 p-1 border-b-0">Suplementación</th>
                                <th rowSpan="2" className="border border-slate-300 p-1.5">Ubicación</th>
                            </tr>
                            <tr className="bg-[#1a3686] text-white">
                                <th className="border border-slate-300 p-1 w-8">SF</th>
                                <th className="border border-slate-300 p-1 w-8">MMN</th>
                                <th className="border border-slate-300 p-1 w-10">Vit. A</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-800">
                            {reportData.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50 border-b border-slate-200">
                                    <td className="border border-slate-300 p-1.5 text-center">{row.date}</td>
                                    <td className="border border-slate-300 p-1.5 text-center">{row.child.historiaClinica || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center">{row.child.dni}</td>
                                    <td className="border border-slate-300 p-1.5 font-bold whitespace-nowrap">{row.child.nombres} {row.child.apellidos}</td>
                                    <td className="border border-slate-300 p-1.5 text-center">{row.child.sexo === 'Masculino' ? 'M' : 'F'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center whitespace-nowrap">{row.child.fechaNacimiento}</td>
                                    <td className="border border-slate-300 p-1.5 text-center whitespace-nowrap">{calculateDetailedAge(row.child.fechaNacimiento)?.shortFormatted || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center font-bold text-blue-800">{row.data.peso || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center font-bold text-blue-800">{row.data.talla || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center font-bold text-red-600">{row.data.hb || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center text-[9px]">{row.data.nCred || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center text-[9px] max-w-[120px] truncate" title={row.data.vacunas.join(', ')}>{row.data.vacunas.join(', ') || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center font-bold">{row.data.sf || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center font-bold">{row.data.mmn || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center font-bold">{row.data.vitA || '-'}</td>
                                    <td className="border border-slate-300 p-1.5 text-center text-[9px] truncate max-w-[100px]">{row.child.localidad || row.child.direccion || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )
            ) : (
                <div className="empty-state py-10 text-slate-400 border border-dashed border-slate-200 mt-3 rounded-lg w-full text-xs">
                    No se encontraron registros de atención para este periodo.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- NUEVO: MÓDULO DE CONFIGURACIÓN ---
const Configuracion = ({ users, setUsers, appConfig, setAppConfig, children, setChildren, showToast }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [configForm, setConfigForm] = useState(appConfig);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserIndex, setEditingUserIndex] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  
  const defaultUserForm = { 
      nombre: '', usuario: '', password: '', rol: 'user', 
      cargo: '', establecimiento: '', correo: '', telefono: '', 
      permisos: [] 
  };
  const [userForm, setUserForm] = useState(defaultUserForm);

  const MODULOS_DISPONIBLES = [
      { id: 'dashboard', label: 'Estadísticas' },
      { id: 'padron', label: 'Padrón Nominal' },
      { id: 'cred', label: 'Control CRED' },
      { id: 'anemia', label: 'Seguimiento Anemia' },
      { id: 'reportes', label: 'Reportes' },
      { id: 'configuracion', label: 'Configuración' }
  ];

  const handleEditUser = (index) => {
      setEditingUserIndex(index);
      setUserForm(users[index]);
      setShowUserModal(true);
  };

  const handleNewUser = () => {
      setEditingUserIndex(null);
      setUserForm(defaultUserForm);
      setShowUserModal(true);
  };

  const saveUser = (e) => {
      e.preventDefault();
      let updatedUsers = [...users];
      if (editingUserIndex !== null) {
          updatedUsers[editingUserIndex] = { ...userForm, id: users[editingUserIndex].id };
          showToast('Usuario actualizado', 'success');
      } else {
          updatedUsers.push({ ...userForm, id: Date.now() });
          showToast('Nuevo usuario creado', 'success');
      }
      setUsers(updatedUsers);
      setShowUserModal(false);
  };

  const deleteUser = (index) => { setUserToDelete(index); };
  const confirmDeleteUser = () => {
      if (userToDelete !== null) {
          let updatedUsers = [...users];
          updatedUsers.splice(userToDelete, 1);
          setUsers(updatedUsers);
          showToast('Usuario eliminado', 'info');
          setUserToDelete(null);
      }
  };

  const togglePermiso = (modId) => {
      const perms = userForm.permisos || [];
      if (perms.includes(modId)) setUserForm({ ...userForm, permisos: perms.filter(p => p !== modId) });
      else setUserForm({ ...userForm, permisos: [...perms, modId] });
  };

  const handleLogoUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          if (file.size > 2 * 1024 * 1024) { 
              showToast('Imagen muy grande. Máx 2MB.', 'error');
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => setConfigForm(prev => ({ ...prev, logo: reader.result }));
          reader.readAsDataURL(file);
      }
  };

  const handleSaveConfig = () => {
      setAppConfig(configForm);
      showToast('Configuración guardada', 'success');
  };

  const handleExportData = () => {
      const dataToExport = { childrenData: children, usersData: users, appConfigData: appConfig, exportDate: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Respaldo_QaliWawa_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      showToast('Copia descargada', 'success');
  };

  const handleImportData = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const importedData = JSON.parse(event.target.result);
              if (importedData.childrenData) setChildren(importedData.childrenData);
              if (importedData.usersData) setUsers(importedData.usersData);
              if (importedData.appConfigData) setAppConfig(importedData.appConfigData);
              showToast('Datos restaurados', 'success');
          } catch (err) { showToast('Error al leer el archivo', 'error'); }
      };
      reader.readAsText(file);
  };

  const handleClearData = () => { setClearConfirmText(''); setShowClearModal(true); };
  const executeClearData = () => {
      if (clearConfirmText === 'ELIMINAR') { setChildren([]); showToast('Padrón vaciado', 'info'); setShowClearModal(false); }
      else { showToast('Palabra incorrecta', 'error'); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-5 w-full animate-fadeIn text-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5 mb-4"><Settings className="text-slate-600" size={18}/> Panel de Configuración</h2>

        <div className="flex border-b border-slate-200 mb-5 overflow-x-auto text-xs font-bold">
            <button onClick={() => setActiveTab('general')} className={`px-4 py-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>General</button>
            <button onClick={() => setActiveTab('usuarios')} className={`px-4 py-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'usuarios' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Usuarios</button>
            <button onClick={() => setActiveTab('datos')} className={`flex items-center gap-1 px-4 py-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'datos' ? 'border-red-600 text-red-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><AlertTriangle size={14}/> Base de Datos</button>
        </div>

        {activeTab === 'general' && (
            <div className="space-y-5 animate-fadeIn w-full pb-2">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-2 max-w-2xl text-xs">
                    <Info className="text-blue-600 shrink-0" size={16}/>
                    <div><h4 className="font-bold text-blue-800">Configuración Global</h4><p className="text-blue-600">Al guardar, el sistema cambiará de apariencia para todos los usuarios.</p></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="space-y-4">
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Nombre del Centro</label><input type="text" className="w-full border border-slate-300 p-2 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-sm" value={configForm.nombreCentro || ''} onChange={e => setConfigForm({...configForm, nombreCentro: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Subtítulo / Slogan</label><input type="text" className="w-full border border-slate-300 p-2 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-sm" value={configForm.slogan || ''} onChange={e => setConfigForm({...configForm, slogan: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Versión</label><input type="text" className="w-full border border-slate-300 p-2 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-sm" value={configForm.version || ''} onChange={e => setConfigForm({...configForm, version: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Footer</label><input type="text" className="w-full border border-slate-300 p-2 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-sm text-slate-600" value={configForm.footer || ''} onChange={e => setConfigForm({...configForm, footer: e.target.value})} /></div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">Logo Institucional</label>
                        <div className="flex gap-4 items-start">
                            <label className="border border-dashed border-slate-300 rounded-lg p-3 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer h-32 w-32 relative overflow-hidden group shrink-0">
                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                {configForm.logo ? (
                                    <><img src={configForm.logo} alt="Logo" className="w-full h-full object-contain" /><div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-white text-[10px] font-bold flex flex-col items-center gap-1"><Upload size={14}/> Cambiar</span></div></>
                                ) : (
                                    <><ImageIcon size={24} className="text-slate-300 mb-1"/><span className="text-blue-600 font-bold text-[11px] mb-0.5">Subir logo</span><span className="text-[9px] text-slate-400">Max. 2MB</span></>
                                )}
                            </label>
                            {configForm.logo && (<button type="button" onClick={() => setConfigForm({...configForm, logo: null})} className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 mt-1"><Trash2 size={14} /> Quitar</button>)}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                    <button onClick={handleSaveConfig} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-md flex items-center gap-1.5 transition-colors shadow-sm text-sm"><Save size={16}/> Guardar</button>
                </div>
            </div>
        )}

        {activeTab === 'usuarios' && (
            <div className="space-y-4 animate-fadeIn">
                <div className="flex justify-end"><button onClick={handleNewUser} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-1.5 font-medium shadow-sm transition-colors text-sm"><User size={16}/> Nuevo Usuario</button></div>
                <div className="overflow-x-auto rounded border border-slate-200">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase font-bold tracking-wider"><tr><th className="p-3">Nombre</th><th className="p-3">Usuario</th><th className="p-3">Rol</th><th className="p-3 text-center">Acciones</th></tr></thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {users.map((u, i) => (
                                <tr key={u.id || i} className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-800">{u.nombre}</td>
                                    <td className="p-3 text-slate-600">{u.usuario}</td>
                                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.rol === 'admin' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>{u.rol}</span></td>
                                    <td className="p-3 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => handleEditUser(i)} className="text-blue-600 hover:text-blue-800 p-1"><Edit size={16}/></button><button onClick={() => deleteUser(i)} className="text-red-600 hover:text-red-800 p-1" disabled={u.rol === 'admin' && users.filter(usr => usr.rol === 'admin').length === 1}><Trash2 size={16}/></button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showUserModal && (
                    <div className="fixed inset-0 bg-slate-900/60 z-[80] flex justify-center items-start pt-10 p-4 overflow-y-auto">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mb-10 animate-slideDown overflow-hidden">
                            <div className="bg-blue-600 p-3.5 flex justify-between items-center text-white"><h3 className="text-sm font-bold">{editingUserIndex !== null ? 'Editar Usuario' : 'Nuevo Usuario'}</h3><button onClick={() => setShowUserModal(false)} className="hover:bg-blue-700 p-1 rounded-md"><X size={16}/></button></div>
                            <form onSubmit={saveUser} className="p-5 space-y-4">
                                <div><label className="block text-xs font-bold text-slate-600 mb-1">Nombre Completo</label><input required type="text" className="w-full border border-slate-300 p-2 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-sm" value={userForm.nombre} onChange={e => setUserForm({...userForm, nombre: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-xs font-bold text-slate-600 mb-1">Usuario (DNI)</label><input required type="text" className="w-full border border-slate-300 p-2 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-sm" value={userForm.usuario} onChange={e => setUserForm({...userForm, usuario: e.target.value})} /></div>
                                    <div><label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><Lock size={12}/> Contraseña</label><input required type="password" placeholder="Clave" className="w-full border border-slate-300 p-2 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-sm" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} /></div>
                                </div>
                                <div><label className="block text-xs font-bold text-slate-600 mb-1">Rol</label><select className="w-full border border-slate-300 p-2 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-sm" value={userForm.rol} onChange={e => setUserForm({...userForm, rol: e.target.value})}><option value="admin">Administrador</option><option value="user">Usuario Regular</option></select></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-xs font-bold text-slate-600 mb-1">Cargo</label><div className="relative"><Briefcase className="absolute left-2.5 top-2.5 text-slate-400" size={14}/><input className="w-full border border-slate-300 p-2 pl-8 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-sm" placeholder="Enfermera" value={userForm.cargo} onChange={e => setUserForm({...userForm, cargo: e.target.value})} /></div></div>
                                    <div><label className="block text-xs font-bold text-slate-600 mb-1">Establecimiento</label><div className="relative"><Building className="absolute left-2.5 top-2.5 text-slate-400" size={14}/><input className="w-full border border-slate-300 p-2 pl-8 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-sm" placeholder="C.S." value={userForm.establecimiento} onChange={e => setUserForm({...userForm, establecimiento: e.target.value})} /></div></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-xs font-bold text-slate-600 mb-1">Correo</label><div className="relative"><Mail className="absolute left-2.5 top-2.5 text-slate-400" size={14}/><input type="email" className="w-full border border-slate-300 p-2 pl-8 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-sm" placeholder="ejemplo@minsa" value={userForm.correo} onChange={e => setUserForm({...userForm, correo: e.target.value})} /></div></div>
                                    <div><label className="block text-xs font-bold text-slate-600 mb-1">Teléfono</label><div className="relative"><Phone className="absolute left-2.5 top-2.5 text-slate-400" size={14}/><input className="w-full border border-slate-300 p-2 pl-8 rounded-md outline-none focus:ring-1 focus:ring-blue-400 text-sm" placeholder="999 999 999" value={userForm.telefono} onChange={e => setUserForm({...userForm, telefono: e.target.value})} /></div></div>
                                </div>

                                {userForm.rol !== 'admin' && (
                                    <div className="mt-3 border border-slate-200 rounded-md p-3 bg-slate-50">
                                        <h4 className="text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-1 uppercase tracking-wider"><Shield size={12}/> Permisos de acceso</h4>
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                            {MODULOS_DISPONIBLES.map(mod => (
                                                <label key={mod.id} className={`flex items-center gap-2 p-1.5 rounded border cursor-pointer transition-colors ${userForm.permisos?.includes(mod.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                                    <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-400" checked={userForm.permisos?.includes(mod.id)} onChange={() => togglePermiso(mod.id)} />
                                                    <span className={`text-xs font-medium ${userForm.permisos?.includes(mod.id) ? 'text-blue-800' : 'text-slate-600'}`}>{mod.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-3 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 px-4 py-2 bg-slate-100 rounded-md text-slate-700 font-bold hover:bg-slate-200 text-sm">Cancelar</button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 text-sm">{editingUserIndex !== null ? 'Actualizar' : 'Crear'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'datos' && (
            <div className="space-y-5 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <div className="border border-blue-100 bg-blue-50/50 p-5 rounded-lg shadow-sm">
                        <h3 className="font-bold text-blue-800 text-sm mb-1.5 flex items-center gap-1.5"><Download size={16}/> Exportar Datos</h3>
                        <p className="text-xs text-slate-600 mb-4 h-8">Descarga una copia completa (Pacientes, Usuarios y Configuración) en JSON.</p>
                        <button onClick={handleExportData} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md flex justify-center items-center gap-1.5 text-sm transition-colors">
                            <Download size={16}/> Descargar
                        </button>
                    </div>

                    <div className="border border-green-100 bg-green-50/50 p-5 rounded-lg shadow-sm">
                        <h3 className="font-bold text-green-800 text-sm mb-1.5 flex items-center gap-1.5"><Upload size={16}/> Importar Datos</h3>
                        <p className="text-xs text-slate-600 mb-4 h-8">Restaura una copia de seguridad. <strong className="text-green-700">Reemplazará los datos actuales.</strong></p>
                        <label className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-md flex justify-center items-center gap-1.5 text-sm transition-colors cursor-pointer">
                            <Upload size={16}/> Subir .json
                            <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                        </label>
                    </div>
                </div>

                <div className="mt-6 border border-red-200 bg-red-50 p-5 rounded-lg shadow-sm w-full">
                    <h3 className="font-bold text-red-800 text-sm mb-1.5 flex items-center gap-1.5"><AlertTriangle size={16}/> Zona Roja</h3>
                    <div className="bg-red-100/50 p-3 rounded text-[11px] text-red-700 mb-4 border border-red-100">
                        <strong>Crítico:</strong> Esta acción es irreversible. Asegúrate de tener una copia de seguridad.
                    </div>
                    <button onClick={handleClearData} className="bg-white border border-red-500 text-red-600 hover:bg-red-600 hover:text-white font-bold py-2 px-4 rounded-md text-sm transition-colors">
                        Vaciar Padrón
                    </button>
                </div>
            </div>
        )}

        {userToDelete !== null && (
            <div className="fixed inset-0 bg-slate-900/60 z-[90] flex justify-center items-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-slideDown p-5 text-center border border-slate-200">
                    <AlertTriangle className="mx-auto text-red-500 mb-3" size={36} />
                    <h3 className="text-base font-bold text-slate-800 mb-1">¿Eliminar Usuario?</h3>
                    <p className="text-xs text-slate-500 mb-5">Revocarás el acceso para <strong>{users[userToDelete]?.nombre}</strong>.</p>
                    <div className="flex gap-2">
                        <button onClick={() => setUserToDelete(null)} className="flex-1 px-4 py-2 bg-slate-100 rounded-md text-slate-700 font-bold hover:bg-slate-200 text-sm">Cancelar</button>
                        <button onClick={confirmDeleteUser} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 shadow-sm text-sm">Eliminar</button>
                    </div>
                </div>
            </div>
        )}

        {showClearModal && (
            <div className="fixed inset-0 bg-slate-900/80 z-[100] flex justify-center items-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-slideDown overflow-hidden border border-red-200">
                    <div className="bg-red-600 p-3.5 flex justify-between items-center text-white">
                        <h3 className="text-sm font-bold flex items-center gap-1.5"><AlertTriangle size={16}/> Peligro Crítico</h3>
                        <button onClick={() => setShowClearModal(false)} className="hover:bg-red-700 p-1 rounded-md transition-colors"><X size={16}/></button>
                    </div>
                    <div className="p-5 space-y-4">
                        <p className="text-slate-700 text-xs leading-relaxed">Vas a <strong className="text-red-600">ELIMINAR TODOS LOS PACIENTES</strong>. Esta acción es <strong>irreversible</strong>.</p>
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                            <label className="block text-[10px] font-bold text-slate-800 mb-1.5 uppercase tracking-wider text-center">Escribe <span className="text-red-600">ELIMINAR</span></label>
                            <input type="text" className="w-full border border-red-300 rounded p-2 outline-none focus:border-red-500 text-center font-bold tracking-widest text-red-600 bg-white text-sm" value={clearConfirmText} onChange={(e) => setClearConfirmText(e.target.value.toUpperCase())} placeholder="ELIMINAR" autoFocus />
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setShowClearModal(false)} className="flex-1 px-3 py-2 bg-slate-100 rounded-md text-slate-700 font-bold hover:bg-slate-200 transition-colors text-sm">Cancelar</button>
                            <button onClick={executeClearData} disabled={clearConfirmText !== 'ELIMINAR'} className={`flex-1 px-3 py-2 rounded-md font-bold text-white transition-all shadow-sm text-sm ${clearConfirmText === 'ELIMINAR' ? 'bg-red-600 hover:bg-red-700 cursor-pointer' : 'bg-red-300 cursor-not-allowed'}`}>Vaciar</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};


// --- COMPONENTE PRINCIPAL APP ---
const App = () => {
  const [currentUser, setCurrentUser] = useState(null); 
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  const [isMobile, setIsMobile] = useState(false);
  
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [notification, setNotification] = useState(null); 
  const [authChecking, setAuthChecking] = useState(true);

  // Estados Base
  const [children, _setChildren] = useState(() => {
    try {
        const saved = localStorage.getItem('childrenData');
        return saved ? JSON.parse(saved) : initialData;
    } catch(e) { return initialData; }
  });
  const childrenRef = useRef(children);
  useEffect(() => { childrenRef.current = children; }, [children]);

  const [users, _setUsers] = useState(() => {
    try {
        const saved = localStorage.getItem('systemUsers');
        const parsed = saved ? JSON.parse(saved) : null;
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultUsers;
    } catch(e) { return defaultUsers; }
  });
  const usersRef = useRef(users);
  useEffect(() => { usersRef.current = users; }, [users]);

  const [appConfig, _setAppConfig] = useState(() => {
    try {
        const saved = localStorage.getItem('appConfig');
        const parsed = saved ? JSON.parse(saved) : null;
        return (parsed && typeof parsed === 'object') ? parsed : defaultConfig;
    } catch(e) { return defaultConfig; }
  });
  const configRef = useRef(appConfig);
  useEffect(() => { configRef.current = appConfig; }, [appConfig]);


  const showToast = (message, type = 'success') => { setNotification({ message, type }); };

  // --- LÓGICA DE SINCRONIZACIÓN FIREBASE CORREGIDA ---
  useEffect(() => {
    let unsubChildren = () => {};
    let unsubUsers = () => {};
    let unsubConfig = () => {};

    const initSync = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn("Autenticación Anónima no activada en Firebase.");
      }

      const baseRef = collection(db, 'artifacts', appId, 'public', 'data', 'qaliwawa_store');

      unsubChildren = onSnapshot(doc(baseRef, 'children'), (snap) => {
          if (snap.exists() && snap.data().list) {
              _setChildren(snap.data().list);
          } else if (childrenRef.current.length > 0) {
              setDoc(doc(baseRef, 'children'), { list: childrenRef.current }).catch(console.error);
          }
      });

      unsubUsers = onSnapshot(doc(baseRef, 'users'), (snap) => {
          if (snap.exists() && snap.data().list) {
              _setUsers(snap.data().list);
          } else {
              setDoc(doc(baseRef, 'users'), { list: usersRef.current }).catch(console.error);
          }
      });

      unsubConfig = onSnapshot(doc(baseRef, 'appConfig'), (snap) => {
          if (snap.exists() && snap.data().config) {
              _setAppConfig(snap.data().config);
          } else {
              setDoc(doc(baseRef, 'appConfig'), { config: configRef.current }).catch(console.error);
          }
      });

      setAuthChecking(false);
    };

    initSync();

    return () => { unsubChildren(); unsubUsers(); unsubConfig(); };
  }, []);

  // --- WRAPPERS PARA GUARDAR EN FIREBASE ---
  const setChildrenSync = (newVal) => {
      _setChildren(prev => {
          const resolved = typeof newVal === 'function' ? newVal(prev) : newVal;
          if (!authChecking) {
              setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qaliwawa_store', 'children'), { list: resolved })
                .catch(err => showToast('Error al guardar en nube', 'error'));
          }
          return resolved;
      });
  };

  const setUsersSync = (newVal) => {
      _setUsers(prev => {
          const resolved = typeof newVal === 'function' ? newVal(prev) : newVal;
          if (!authChecking) {
              setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qaliwawa_store', 'users'), { list: resolved })
                .catch(err => showToast('Error al guardar en nube', 'error'));
          }
          return resolved;
      });
  };

  const setAppConfigSync = (newVal) => {
      _setAppConfig(prev => {
          const resolved = typeof newVal === 'function' ? newVal(prev) : newVal;
          if (!authChecking) {
              setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qaliwawa_store', 'appConfig'), { config: resolved })
                .catch(err => showToast('Error al guardar en nube', 'error'));
          }
          return resolved;
      });
  };

  useEffect(() => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.maxWidth = '100%';
      rootElement.style.width = '100%';
      rootElement.style.margin = '0';
      rootElement.style.padding = '0';
      rootElement.style.textAlign = 'left';
    }
  }, []);

  useEffect(() => {
    const handleResize = () => { const mobile = window.innerWidth < 768; setIsMobile(mobile); if (mobile) setIsSidebarOpen(false); else setIsSidebarOpen(true); };
    window.addEventListener('resize', handleResize); handleResize(); 
    window.addEventListener('online', () => setIsOnline(true)); 
    window.addEventListener('offline', () => setIsOnline(false));
    return () => { 
        window.removeEventListener('resize', handleResize); 
        window.removeEventListener('online', () => setIsOnline(true)); 
        window.removeEventListener('offline', () => setIsOnline(false)); 
    };
  }, []);

  useEffect(() => { localStorage.setItem('childrenData', JSON.stringify(children)); }, [children]);
  useEffect(() => { localStorage.setItem('systemUsers', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('appConfig', JSON.stringify(appConfig)); }, [appConfig]);

  const allNavItems = useMemo(() => [
      { id: 'dashboard', label: 'Estadísticas', icon: LayoutDashboard, color: 'text-blue-600' }, 
      { id: 'padron', label: 'Padrón Nominal', icon: Users, color: 'text-green-600' }, 
      { id: 'cred', label: 'Control CRED', icon: Activity, color: 'text-purple-600' }, 
      { id: 'anemia', label: 'Seguimiento Anemia', icon: Droplet, color: 'text-red-600' }, 
      { id: 'reportes', label: 'Reportes', icon: FileText, color: 'text-slate-600' },
      { id: 'configuracion', label: 'Configuración', icon: Settings, color: 'text-slate-800' }
  ], []);

  const allowedNavItems = useMemo(() => {
      if (!currentUser) return [];
      if (currentUser.rol === 'admin') return allNavItems;
      return allNavItems.filter(item => (currentUser.permisos || []).includes(item.id));
  }, [currentUser, allNavItems]);

  const handleLogin = (user) => {
      setCurrentUser(user);
      const firstAvailable = user.rol === 'admin' ? 'dashboard' : ((user.permisos && user.permisos.length > 0) ? user.permisos[0] : 'dashboard');
      setActiveModule(firstAvailable);
  };

  const handleLogout = () => {
      setCurrentUser(null);
  };

  if (authChecking) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans text-blue-600" style={{ colorScheme: 'light' }}>
              <Loader2 className="animate-spin mb-3" size={36}/>
              <h2 className="text-base font-bold">Conectando...</h2>
          </div>
      );
  }

  if (!currentUser) {
      return <Login users={users} appConfig={appConfig} onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 w-full overflow-x-hidden font-sans relative print:bg-white text-slate-800" style={{ colorScheme: 'light' }}>
      {notification && (<Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />)}
      
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-all duration-300 ease-in-out print:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative ${isSidebarCollapsed ? 'w-20' : 'w-60'} flex-shrink-0 flex flex-col`}>
        <div className={`p-4 flex ${isSidebarCollapsed ? 'justify-center flex-col gap-3' : 'justify-between'} items-center bg-gradient-to-br from-sky-50 to-blue-100 border-b border-sky-200 text-blue-900 min-h-[64px] shrink-0 transition-all z-10`}>
            {!isSidebarCollapsed && (
                <div className="flex items-center gap-2.5 overflow-hidden w-full">
                    {appConfig?.logo ? (
                        <div className="w-8 h-8 bg-white rounded-md p-0.5 shrink-0 flex items-center justify-center shadow-sm border border-sky-100">
                            <img src={appConfig.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 bg-white rounded-md shrink-0 flex items-center justify-center shadow-sm border border-sky-100">
                            <Activity size={18} className="text-blue-600"/>
                        </div>
                    )}
                    <h1 className="text-sm font-extrabold tracking-tight leading-tight truncate" title={appConfig?.nombreCentro}>{appConfig?.nombreCentro || 'Sistema QaliWawa'}</h1>
                </div>
            )}
            
            {isSidebarCollapsed && (
                appConfig?.logo ? (
                    <div className="w-8 h-8 bg-white rounded-md p-0.5 flex items-center justify-center shadow-sm cursor-pointer hover:bg-slate-50 transition-colors border border-sky-100" onClick={() => setIsSidebarCollapsed(false)}>
                        <img src={appConfig.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                ) : (
                    <button className="w-8 h-8 bg-white rounded-md flex items-center justify-center hover:bg-slate-50 transition-colors border border-sky-100 shadow-sm" onClick={() => setIsSidebarCollapsed(false)}>
                        <Activity size={18} className="text-blue-600"/>
                    </button>
                )
            )}

            {!isSidebarCollapsed && (
                <button className="hidden md:flex hover:bg-blue-200/50 rounded p-1 shrink-0 transition-colors ml-1 text-blue-700" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                    <ChevronLeft size={16} />
                </button>
            )}
            <button className="md:hidden hover:bg-blue-200/50 rounded p-1 transition-colors text-blue-700" onClick={() => setIsSidebarOpen(false)}>
                <X size={20} />
            </button>
        </div>
        
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
            {allowedNavItems.map((item) => { 
                const Icon = item.icon; 
                return (
                    <button key={item.id} onClick={() => { setActiveModule(item.id); if (isMobile) setIsSidebarOpen(false); }} title={isSidebarCollapsed ? item.label : ''} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'} py-2.5 rounded-lg transition-colors duration-200 text-sm ${activeModule === item.id ? 'bg-blue-50 text-blue-700 shadow-sm border-r-4 border-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
                        <Icon size={20} className={activeModule === item.id ? item.color : 'text-slate-400'} />
                        {!isSidebarCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
                    </button>
                ); 
            })}
        </nav>
        
        {!isSidebarCollapsed && (
            <div className="p-4 border-t border-slate-200 bg-white shrink-0 flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {currentUser?.nombre?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate" title={currentUser?.nombre}>{currentUser?.nombre}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider">{currentUser?.rol}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-1.5 text-red-600 bg-red-50 hover:bg-red-100 py-1.5 rounded-md text-xs font-bold transition-colors">
                    <LogOut size={14}/> Cerrar Sesión
                </button>
                <div className="text-[9px] text-center text-slate-400 leading-tight mt-1 border-t border-slate-100 pt-2">
                    {appConfig?.slogan || 'Gestión Integral'}<br/>v{appConfig?.version || '1.0'}
                </div>
            </div>
        )}
      </aside>

      <main className="flex-1 w-full min-w-0 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible print:block bg-slate-50">
        
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm z-10 print:hidden shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-600 hover:text-blue-600 transition-colors">
                    <Menu size={20} />
                </button>
                <div className="flex items-center gap-2 text-slate-800">
                    <span className="font-bold uppercase text-xs tracking-wide text-slate-700">
                        {allowedNavItems.find(n => n.id === activeModule)?.label}
                    </span>
                </div>
            </div>
            
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors shadow-sm ${isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="hidden sm:inline">{isOnline ? 'Sistema en línea' : 'Sin conexión'}</span>
                <span className="sm:hidden">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 w-full print:overflow-visible print:p-0 print:block">
            <div className="w-full max-w-[1400px] mx-auto">
              <ErrorBoundary>
                {activeModule === 'dashboard' && <Dashboard children={children} />}
                {activeModule === 'padron' && <PadronNominal children={children} setChildren={setChildrenSync} showToast={showToast} />}
                {activeModule === 'cred' && <ModuloCRED children={children} setChildren={setChildrenSync} showToast={showToast} />}
                {activeModule === 'anemia' && <ModuloAnemia children={children} setChildren={setChildrenSync} showToast={showToast} />}
                {activeModule === 'reportes' && <Reportes children={children} showToast={showToast} appConfig={appConfig} />}
                {activeModule === 'configuracion' && <Configuracion users={users} setUsers={setUsersSync} appConfig={appConfig} setAppConfig={setAppConfigSync} children={children} setChildren={setChildrenSync} showToast={showToast} />}
              </ErrorBoundary>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
