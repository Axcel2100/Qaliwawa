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

const userFirebaseConfig = {
  apiKey: "AIzaSyD3zDaezsATi3JKNJIkWcXYttXwgy4RVrw",
  authDomain: "qaliwawa-89417.firebaseapp.com",
  projectId: "qaliwawa-89417",
  storageBucket: "qaliwawa-89417.firebasestorage.app",
  messagingSenderId: "1994000104",
  appId: "1:1994000104:web:2e6822a0fd153541036b5d"
};

// Soporte multiplataforma (Vite / Vercel / Canvas)
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
        <div className="p-6 bg-red-50 text-red-700 rounded-lg m-4 border border-red-200 print:hidden">
          <h2 className="text-lg font-bold flex items-center gap-2"><AlertTriangle /> Ocurrió un error en este módulo</h2>
          <p className="text-sm mt-2 font-mono bg-white p-2 rounded max-h-32 overflow-auto">{this.state.error?.toString()}</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-red-600 text-white px-4 py-2 rounded">Recargar aplicación</button>
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
    subtitulo: "Inicio de Suplementación Preventiva",
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
      { id: "2a_hb_entrega", label: "2 AÑOS", desc: "Hb + 1ra Entrega", icon: "drop_plus", reqHb: true },
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
      { id: "3a_hb_entrega", label: "3 AÑOS", desc: "Hb + 1ra Entrega", icon: "drop_plus", reqHb: true },
      { id: "3a1m_entrega", label: "3A 1M", desc: "2da Entrega", icon: "pill" },
      { id: "3a2m_entrega", label: "3A 2M", desc: "3ra Entrega", icon: "pill" },
      { id: "3a3m_hb_fin", label: "3A 3M", desc: "Hb + Término Act.", icon: "drop_check", reqHb: true },
    ]
  },
  {
    titulo: "Etapa 4 Años",
    subtitulo: "Ciclo Final",
    color: "purple",
    hitos: [
      { id: "4a_hb_entrega", label: "4 AÑOS", desc: "Hb + 1ra Entrega", icon: "drop_plus", reqHb: true },
      { id: "4a1m_entrega", label: "4A 1M", desc: "2da Entrega", icon: "pill" },
      { id: "4a2m_entrega", label: "4A 2M", desc: "3ra Entrega", icon: "pill" },
      { id: "4a3m_hb_fin", label: "4A 3M", desc: "Hb + Término Act.", icon: "drop_check", reqHb: true },
    ]
  }
];

const ESQUEMA_CONTROLES_CRED = [
  {
    titulo: "Recién Nacido (0 a 28 días)",
    subtitulo: "Intervalo mínimo de 7 días",
    color: "teal",
    controles: [
      { id: "rn_1", label: "1° Control", desc: "< 7 días" },
      { id: "rn_2", label: "2° Control", desc: "7 a 14 días" },
      { id: "rn_3", label: "3° Control", desc: "14 a 21 días" }
    ]
  },
  {
    titulo: "Niños Menores de 1 Año",
    subtitulo: "Controles Mensuales y Bimensuales",
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
    subtitulo: "Controles Trimestrales y Semestrales",
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
  return { years, months, days, totalMonths, formatted: `${years} años, ${months} meses, ${days} días`, shortFormatted: `${years}a ${months}m ${days}d` };
};

const formatDateLong = (dateString) => {
  if (!dateString) return '-';
  const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
  return new Date(dateString).toLocaleDateString('es-PE', options);
};

const getCitaStatus = (dateStr) => {
    if (!dateStr) return { status: 'sin_cita', label: 'Sin Cita', color: 'text-gray-400', bg: 'bg-gray-100', border: 'border-gray-200' };
    const today = new Date();
    today.setHours(0,0,0,0);
    const cita = new Date(dateStr + 'T00:00:00');
    const diffTime = cita - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: 'vencido', label: `Vencido hace ${Math.abs(diffDays)} días`, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
    if (diffDays === 0) return { status: 'hoy', label: 'HOY', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
    if (diffDays > 0 && diffDays <= 30) return { status: 'proximo', label: `Faltan ${diffDays} días`, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { status: 'futuro', label: `En ${diffDays} días`, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
};

// --- COMPONENTES AUXILIARES ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  const bgColors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
  return (
    <div className={`fixed top-4 right-4 z-[100] ${bgColors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slideDown print:hidden`}>
      {type === 'success' && <CheckCircle size={20} />} {type === 'error' && <AlertTriangle size={20} />} {type === 'info' && <Info size={20} />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded-full p-1"><X size={16}/></button>
    </div>
  );
};

const CustomEdadTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 border border-purple-100 shadow-xl rounded-lg z-50 min-w-[200px]">
                <p className="font-bold text-purple-800 mb-2 border-b border-purple-100 pb-1">
                    {data.name}: {data.value} paciente(s)
                </p>
                {data.childrenList && data.childrenList.length > 0 ? (
                    <ul className="text-[11px] text-gray-600 space-y-1 max-h-48 overflow-y-auto">
                        {data.childrenList.map((c, i) => (
                            <li key={i} className="flex justify-between gap-3 border-b border-gray-50 pb-1">
                                <span className="truncate max-w-[120px]" title={c.nombres}>{c.nombres}</span>
                                <span className="font-bold text-purple-600 whitespace-nowrap">{c.edadCorta}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-[10px] text-gray-400 italic">No hay pacientes en este grupo hoy</p>
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
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4 font-sans animate-fadeIn">
      <div className="bg-white w-full max-w-[420px] rounded-2xl shadow-xl overflow-hidden border border-gray-200">
         <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-8 py-10 text-center text-white relative">
             <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white/20 to-transparent" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
             <div className="relative z-10">
                 <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner border border-white/20 overflow-hidden p-1">
                    {safeConfig.logo ? (
                        <img src={safeConfig.logo} alt="Logo" className="w-full h-full object-contain rounded-full bg-white" />
                    ) : (
                        <Activity size={44} className="text-white"/>
                    )}
                 </div>
                 <h1 className="text-2xl font-bold tracking-tight mb-1">{safeConfig.nombreCentro}</h1>
                 <p className="text-blue-100 text-sm font-medium">{safeConfig.slogan}</p>
             </div>
         </div>

         <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
               {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 border border-red-100 animate-slideDown">
                     <AlertTriangle size={16} /> {error}
                  </div>
               )}
               
               <div>
                   <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Usuario / DNI</label>
                   <div className="relative">
                       <User className="absolute left-3.5 top-3 text-gray-400" size={18}/>
                       <input 
                          type="text" 
                          placeholder="Ingrese su usuario" 
                          className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-gray-700 font-medium" 
                          value={username} 
                          onChange={e => setUsername(e.target.value)} 
                          required 
                          autoFocus
                       />
                   </div>
               </div>
               
               <div>
                   <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Contraseña</label>
                   <div className="relative">
                       <Lock className="absolute left-3.5 top-3 text-gray-400" size={18}/>
                       <input 
                          type="password" 
                          placeholder="••••••••" 
                          className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-gray-700 font-medium tracking-widest" 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                          required
                       />
                   </div>
               </div>
               
               <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 mt-2">
                   Iniciar Sesión <ChevronRight size={18}/>
               </button>
            </form>
         </div>
      </div>
      <div className="mt-8 text-center text-xs text-gray-400 space-y-1">
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
      { name: 'Desnutrición', value: desnutricion, color: '#EF4444' },
      { name: 'S.Peso/Obes.', value: sobrepeso, color: '#F59E0B' },
    ];
    const anemiaData = [
      { name: 'Sin Anemia', value: total - anemiaCases, color: '#3B82F6' },
      { name: 'Con Anemia', value: anemiaCases, color: '#EF4444' },
    ];

    const ageGroups = { 
        'RN': { count: 0, list: [] }, 
        '< 1 Año': { count: 0, list: [] }, 
        '1 Año': { count: 0, list: [] }, 
        '2 Años': { count: 0, list: [] }, 
        '3 Años': { count: 0, list: [] }, 
        '4 Años': { count: 0, list: [] }, 
        '5+ Años': { count: 0, list: [] } 
    };
    
    const anemiaPorEdad = {
      'RN': { name: 'RN', 'Con Anemia': 0, 'Sin Anemia': 0 },
      '1-5 Meses': { name: '1-5 M', 'Con Anemia': 0, 'Sin Anemia': 0 },
      '6-11 Meses': { name: '6-11 M', 'Con Anemia': 0, 'Sin Anemia': 0 },
      '1 Año': { name: '1 Año', 'Con Anemia': 0, 'Sin Anemia': 0 },
      '2 Años': { name: '2 Años', 'Con Anemia': 0, 'Sin Anemia': 0 },
      '3 Años': { name: '3 Años', 'Con Anemia': 0, 'Sin Anemia': 0 },
      '4 Años': { name: '4 Años', 'Con Anemia': 0, 'Sin Anemia': 0 }
    };

    filteredChildren.forEach(c => {
       const age = calculateDetailedAge(c.fechaNacimiento);
       if (!age) return;
       
       let groupKey = '';
       if (age.totalMonths === 0 && age.days <= 28) groupKey = 'RN';
       else if (age.totalMonths < 12) groupKey = '< 1 Año';
       else if (age.totalMonths >= 12 && age.totalMonths < 24) groupKey = '1 Año';
       else if (age.totalMonths >= 24 && age.totalMonths < 36) groupKey = '2 Años';
       else if (age.totalMonths >= 36 && age.totalMonths < 48) groupKey = '3 Años';
       else if (age.totalMonths >= 48 && age.totalMonths < 60) groupKey = '4 Años';
       else groupKey = '5+ Años';

       ageGroups[groupKey].count++;
       ageGroups[groupKey].list.push({
           nombres: `${c.nombres} ${c.apellidos}`,
           edadCorta: age.shortFormatted
       });

       let groupAnemia = '';
       if (age.totalMonths === 0 && age.days <= 28) groupAnemia = 'RN';
       else if (age.totalMonths < 6) groupAnemia = '1-5 Meses';
       else if (age.totalMonths >= 6 && age.totalMonths < 12) groupAnemia = '6-11 Meses';
       else if (age.totalMonths >= 12 && age.totalMonths < 24) groupAnemia = '1 Año';
       else if (age.totalMonths >= 24 && age.totalMonths < 36) groupAnemia = '2 Años';
       else if (age.totalMonths >= 36 && age.totalMonths < 48) groupAnemia = '3 Años';
       else if (age.totalMonths >= 48 && age.totalMonths < 60) groupAnemia = '4 Años';

       if (groupAnemia) {
           if (c.anemia) anemiaPorEdad[groupAnemia]['Con Anemia']++;
           else anemiaPorEdad[groupAnemia]['Sin Anemia']++;
       }
    });

    const edadData = Object.keys(ageGroups)
        .filter(k => k !== '5+ Años' || ageGroups[k].count > 0) 
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
    <div className="space-y-6 animate-fadeIn w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Estadísticas y Monitoreo</h2>
          <p className="text-sm text-gray-500">Visualiza la situación de salud de tu población</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto bg-gray-50 p-2 rounded-lg border border-gray-200">
           <span className="text-sm font-bold text-gray-600 flex items-center shrink-0"><MapPin size={18} className="mr-1 text-gray-400"/> Sector / Localidad:</span>
           <select
              className="w-full md:w-48 bg-white border border-gray-300 text-gray-800 rounded-md px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
              value={selectedLocalidad}
              onChange={(e) => setSelectedLocalidad(e.target.value)}
           >
             {localidades.map(loc => <option key={loc} value={loc}>{loc}</option>)}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow"><div><p className="text-sm text-gray-500 font-medium">Total Niños ({selectedLocalidad})</p><p className="text-3xl font-bold text-blue-600">{stats.total}</p></div><Users className="w-12 h-12 text-blue-100 bg-blue-600 rounded-full p-2.5" /></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow"><div><p className="text-sm text-gray-500 font-medium">Casos de Anemia</p><p className="text-3xl font-bold text-red-600">{stats.anemiaCases}</p></div><Droplet className="w-12 h-12 text-red-100 bg-red-600 rounded-full p-2.5" /></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow"><div><p className="text-sm text-gray-500 font-medium">Nutrición Normal</p><p className="text-3xl font-bold text-green-600">{stats.nutricionData[0].value}</p></div><Activity className="w-12 h-12 text-green-100 bg-green-600 rounded-full p-2.5" /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-[360px] lg:col-span-1 flex flex-col">
           <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2"><Users size={20} className="text-purple-600"/> Población por Grupo Etario</h3>
           <p className="text-xs text-gray-400 mb-4 mt-1">* Pasa el mouse sobre las barras para ver a los pacientes agrupados por su edad hoy.</p>
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={stats.edadData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} />
               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
               <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
               <Tooltip content={<CustomEdadTooltip />} cursor={{fill: '#F3F4F6'}} />
               <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} maxBarSize={60}>
                 {stats.edadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-[360px] lg:col-span-1 flex flex-col">
            <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2"><Activity size={20} className="text-green-600"/> Estado Nutricional</h3>
            <p className="text-xs text-transparent mb-4 mt-1">Espaciador</p>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.nutricionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10}/>
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}}/>
                    <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                        {stats.nutricionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-96 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><Droplet size={20} className="text-red-600"/> Prevalencia de Anemia por Meses y Edades</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.anemiaPorEdadData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10}/>
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}}/>
                    <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="Con Anemia" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="Sin Anemia" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
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
  const confirmDelete = () => { if (childToDelete) { setChildren(prev => prev.filter(c => c.id !== childToDelete.id)); setChildToDelete(null); showToast('Paciente eliminado correctamente', 'success'); } };
  const handleEdit = (child) => { setNewChild(child); setIsEditing(true); const ageDetails = calculateDetailedAge(child.fechaNacimiento); setCurrentAgeDisplay(ageDetails ? ageDetails.formatted : ''); setShowForm(true); };
  const handleView = (child) => { setViewChild(child); setModalPosition({ x: 0, y: 0 }); setShowViewModal(true); };
  const handleNew = () => { setNewChild({ nombres: '', apellidos: '', dni: '', historiaClinica: '', fechaNacimiento: '', sexo: 'Masculino', seguro: 'SIS', responsable: '', telefono: '', direccion: '', departamento: 'Lima', provincia: 'Lima', distrito: '', localidad: '' }); setCurrentAgeDisplay(''); setIsEditing(false); setShowForm(true); };
  const handleInputChange = (e) => { const { name, value } = e.target; setNewChild(prev => ({ ...prev, [name]: value })); if (name === 'fechaNacimiento') { const ageDetails = calculateDetailedAge(value); setCurrentAgeDisplay(ageDetails ? ageDetails.formatted : ''); } };
  const handleAdd = (e) => { 
    e.preventDefault(); 
    if (isEditing) { 
      setChildren(prev => prev.map(c => c.id === newChild.id ? newChild : c)); 
      showToast('Datos actualizados correctamente', 'success'); 
    } else { 
      const child = { 
        ...newChild, 
        id: Date.now(), 
        anemia: false, 
        hemoglobina: 0, 
        estadoNutricional: 'Pendiente', 
        controles: [], 
        vacunas: {}, 
        cronogramaSuplementos: {}, 
        cronogramaCred: {}, 
        suplementos: [], 
        proximaCita: '', 
        proximaCitaAnemia: '', 
        tratamientoAnemia: { inicio: null, entregas: [] }, 
        historialAnemia: [], 
        tratamientosAnemiaPrevios: [] 
      }; 
      setChildren(prev => [...prev, child]); 
      showToast('Nuevo paciente registrado', 'success'); 
    } 
    setShowForm(false); 
  };
  
  const filtered = children.filter(c => 
    (c.nombres || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.dni || '').includes(searchTerm)
  );

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">Padrón Nominal</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64"><Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input type="text" placeholder="Buscar por DNI o Nombre" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Nuevo Paciente</button>
        </div>
      </div>
      {childToDelete && (<div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4"><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm"><div className="flex flex-col items-center text-center"><h3 className="text-lg font-bold mb-2">¿Eliminar?</h3><p className="mb-4">Se borrará a {childToDelete.nombres}</p><div className="flex gap-2"><button onClick={() => setChildToDelete(null)} className="px-4 py-2 bg-gray-100 rounded">Cancelar</button><button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded">Eliminar</button></div></div></div></div>)}
      
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 overflow-y-auto pb-10">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl m-4 animate-slideDown overflow-hidden">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold">{isEditing ? 'Editar Paciente' : 'Registrar Nuevo Paciente'}</h3>
              <button onClick={() => setShowForm(false)} className="hover:bg-blue-700 p-1 rounded-full transition-colors"><X/></button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-8 bg-gray-50/50">
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-blue-700 font-bold border-b pb-2"><User size={20} /> Datos Personales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 font-semibold mb-1">N° Historia Clínica</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                      <input name="historiaClinica" placeholder="Ej. HC-12345" className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={newChild.historiaClinica} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-semibold mb-1">DNI / CNV *</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                      <input name="dni" placeholder="8 dígitos" className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={newChild.dni} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 font-semibold mb-1">Nombres y Apellidos *</label>
                    <div className="grid grid-cols-2 gap-4">
                      <input name="nombres" placeholder="Nombres" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={newChild.nombres} onChange={handleInputChange} required />
                      <input name="apellidos" placeholder="Apellidos" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={newChild.apellidos} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-semibold mb-1">Fecha de Nacimiento *</label>
                    <input type="date" name="fechaNacimiento" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white text-gray-700 mb-1" value={newChild.fechaNacimiento} onChange={handleInputChange} required />
                    {currentAgeDisplay && (<span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block">Edad: {currentAgeDisplay}</span>)}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-semibold mb-1">Sexo</label>
                    <select name="sexo" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white text-gray-700" value={newChild.sexo} onChange={handleInputChange}><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option></select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 font-semibold mb-1">Seguro</label>
                    <select name="seguro" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white text-gray-700" value={newChild.seguro} onChange={handleInputChange}><option value="SIS">SIS</option><option value="EsSalud">EsSalud</option><option value="Privado">Privado</option><option value="Ninguno">Ninguno</option></select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="flex items-center gap-2 text-blue-700 font-bold border-b pb-2"><MapPin size={20} /> Ubicación y Contacto</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-xs text-gray-500 font-semibold mb-1">Responsable</label><input name="responsable" placeholder="Padre/Madre/Apoderado" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={newChild.responsable} onChange={handleInputChange} /></div>
                  <div><label className="block text-xs text-gray-500 font-semibold mb-1">Teléfono</label><div className="relative"><Phone className="absolute left-3 top-2.5 text-gray-400" size={16}/><input name="telefono" placeholder="999-999-999" className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={newChild.telefono} onChange={handleInputChange} /></div></div>
                  <div className="md:col-span-2"><label className="block text-xs text-gray-500 font-semibold mb-1">Dirección Actual</label><input name="direccion" placeholder="Av/Jr/Calle # - Referencia" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={newChild.direccion} onChange={handleInputChange} /></div>
                  <div><label className="block text-xs text-gray-500 font-semibold mb-1">Departamento</label><input name="departamento" placeholder="Lima" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={newChild.departamento} onChange={handleInputChange} /></div>
                  <div><label className="block text-xs text-gray-500 font-semibold mb-1">Provincia</label><input name="provincia" placeholder="Lima" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={newChild.provincia} onChange={handleInputChange} /></div>
                  <div><label className="block text-xs text-gray-500 font-semibold mb-1">Distrito</label><input name="distrito" placeholder="Distrito" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={newChild.distrito} onChange={handleInputChange} /></div>
                  <div><label className="block text-xs text-gray-500 font-semibold mb-1">Localidad / C.P.</label><input name="localidad" placeholder="AA.HH. / Urb." className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={newChild.localidad} onChange={handleInputChange} /></div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t gap-3 mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm flex items-center gap-2 transition-colors"><Save size={18}/> Guardar Paciente</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showViewModal && viewChild && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]" style={{ transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`, transition: isDragging ? 'none' : 'transform 0.1s' }}>
              <div className="bg-blue-600 p-4 flex justify-between items-center text-white cursor-move select-none rounded-t-xl" onMouseDown={handleMouseDown}><h3 className="text-lg font-bold flex items-center gap-2"><Move size={18} className="opacity-70"/> Ficha Digital del Paciente</h3><button onClick={() => setShowViewModal(false)} className="hover:bg-blue-700 p-1 rounded-full cursor-pointer" onMouseDown={(e) => e.stopPropagation()}><X size={20}/></button></div>
              <div className="p-6 overflow-y-auto">
                <div className="flex items-center gap-4 mb-6"><div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><User size={32} /></div><div><h2 className="text-xl font-bold text-gray-800">{viewChild.nombres} {viewChild.apellidos}</h2><div className="flex gap-2 mt-1"><span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">DNI: {viewChild.dni}</span><span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded">{viewChild.historiaClinica || 'S/N'}</span></div></div></div>
                <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm"><h4 className="text-blue-700 font-bold flex items-center gap-2 mb-3"><Activity size={18}/> Información Básica</h4><div className="grid grid-cols-2 gap-y-4 gap-x-8"><div><p className="text-xs text-gray-500 uppercase font-semibold">Fecha de Nacimiento</p><p className="text-gray-800 font-medium">{formatDateLong(viewChild.fechaNacimiento)}</p></div><div><p className="text-xs text-gray-500 uppercase font-semibold">Sexo</p><p className="text-gray-800 font-medium">{viewChild.sexo}</p></div><div><p className="text-xs text-gray-500 uppercase font-semibold">Seguro</p><p className="text-gray-800 font-medium">{viewChild.seguro}</p></div><div><p className="text-xs text-gray-500 uppercase font-semibold">Edad Actual</p><p className="text-gray-800 font-bold text-lg">{calculateDetailedAge(viewChild.fechaNacimiento)?.shortFormatted || '-'}</p></div></div></div>
                <div className="bg-white border rounded-lg p-4 shadow-sm"><h4 className="text-blue-700 font-bold flex items-center gap-2 mb-3"><MapPin size={18}/> Ubicación y Contacto</h4><div className="grid grid-cols-2 gap-y-4 gap-x-8"><div className="col-span-2"><p className="text-xs text-gray-500 uppercase font-semibold">Dirección</p><p className="text-gray-800 font-medium">{viewChild.direccion}</p></div><div><p className="text-xs text-gray-500 uppercase font-semibold">Localidad / C.P.</p><p className="text-gray-800 font-medium">{viewChild.localidad || '-'}</p></div><div><p className="text-xs text-gray-500 uppercase font-semibold">Distrito</p><p className="text-gray-800 font-medium">{viewChild.distrito || '-'}</p></div><div><p className="text-xs text-gray-500 uppercase font-semibold">Departamento</p><p className="text-gray-800 font-medium">{viewChild.departamento || '-'}</p></div><div><p className="text-xs text-gray-500 uppercase font-semibold">Provincia</p><p className="text-gray-800 font-medium">{viewChild.provincia || '-'}</p></div><div><p className="text-xs text-gray-500 uppercase font-semibold">Responsable</p><p className="text-gray-800 font-medium">{viewChild.responsable || '-'}</p></div><div><p className="text-xs text-gray-500 uppercase font-semibold">Teléfono</p><p className="text-gray-800 font-medium">{viewChild.telefono || '-'}</p></div></div></div>
              </div>
              <div className="bg-gray-50 p-4 border-t flex justify-end rounded-b-xl"><button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium">Cerrar Ficha</button></div>
           </div>
        </div>
      )}

      <div className="space-y-3">
         {filtered.length > 0 ? filtered.map(child => (
              <div key={child.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fadeIn hover:shadow-md transition-shadow">
                 <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                       {child.nombres?.[0] || '-'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                         <h3 className="font-bold text-gray-800">{child.nombres} {child.apellidos}</h3>
                         {child.anemia && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold flex items-center"><Droplet size={10} className="mr-1 fill-current"/> Anemia</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 text-[11px] font-semibold">
                            <CreditCard size={12} className="text-gray-400"/> {child.dni}
                         </span>
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 text-[11px] font-semibold">
                            <FileText size={12} className="text-gray-400"/> {child.historiaClinica || 'Sin HC'}
                         </span>
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-blue-100 bg-blue-50 text-blue-700 text-[11px] font-bold shadow-sm">
                            <Calendar size={12} className="text-blue-500"/> {new Date(child.fechaNacimiento + 'T00:00:00').toLocaleDateString('es-PE', {day: '2-digit', month: 'short', year: 'numeric'})}
                            <span className="mx-0.5 text-blue-300">|</span>
                            <Clock size={12} className="text-blue-500"/> {calculateDetailedAge(child.fechaNacimiento)?.shortFormatted || '-'}
                         </span>
                      </div>
                    </div>
                 </div>
                 
                 <div className="flex justify-center items-center gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                    <button onClick={() => handleView(child)} className="flex-1 sm:flex-none flex justify-center items-center p-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Ver Ficha">
                      <Eye size={18} />
                    </button>
                    <button onClick={() => handleEdit(child)} className="flex-1 sm:flex-none flex justify-center items-center p-2.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors" title="Editar">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => initiateDelete(child)} className="flex-1 sm:flex-none flex justify-center items-center p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Eliminar">
                      <Trash size={18} />
                    </button>
                 </div>
              </div>
            )) : (
              <div className="text-center p-12 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100">
                 No se encontraron pacientes en el padrón.
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
      const updatedChildren = children.map(c => {
          if (c.id === parseInt(selectedId)) {
              return { ...c, ...updatedFields };
          }
          return c;
      });
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

    updateChildData({ 
        cronogramaCred: updatedCronogramaCred,
        estadoNutricional: status, 
        controles: updatedControlesList
    });
    
    setControlModal({ show: false, controlId: null, label: '', data: { fecha: '', peso: '', talla: '', estadoNutricional: 'Normal' } });
    showToast(`Control CRED (${controlModal.label}) registrado exitosamente`, 'success');
  };

  const handleVaccineChange = (vaccineName, date) => {
      const updatedVacunas = { ...(selectedChild.vacunas || {}), [vaccineName]: date };
      updateChildData({ vacunas: updatedVacunas });
      showToast('Vacuna actualizada', 'success');
  };

  const handleUpdateCita = () => {
      if(!newCita) return;
      updateChildData({ proximaCita: newCita });
      showToast('Próxima cita CRED agendada', 'success'); 
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
    showToast('Registro guardado', 'success');
  };

  const renderIcon = (type, done) => {
    const colorClass = done ? "text-white" : (type.includes("drop") ? "text-red-500" : "text-orange-500");
    if (type === "drop") return <Droplet size={18} className={colorClass} fill={done ? "currentColor" : "none"} />;
    if (type === "drop_plus") return <div className="relative"><Droplet size={18} className={colorClass} /><Plus size={10} className={`absolute -right-1 -top-1 ${colorClass}`} strokeWidth={4} /></div>;
    if (type === "drop_check") return <div className="relative"><Droplet size={18} className={colorClass} /><Check size={10} className={`absolute -right-1 -top-1 ${colorClass}`} strokeWidth={4} /></div>;
    if (type === "pill") return <Circle size={18} className={colorClass} />;
    return <Circle size={18} className={colorClass} />;
  };

  const esquema = GENERAR_ESQUEMA_SUPLEMENTOS(supplementType6to11);

  return (
    <div className="space-y-6 w-full">
      {!selectedChild ? (
         <div className="w-full">
           <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Control CRED y Seguimiento</h2>
              <div className="relative max-w-xl"><Search className="absolute left-4 top-3 text-gray-400" size={20} /><input type="text" placeholder="Buscar por DNI o Nombres..." className="w-full pl-12 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t"><span className="text-sm font-bold text-gray-500 flex items-center mr-2"><Filter size={16} className="mr-1"/> Filtros:</span>{[{ id: 'todos', label: 'Todos' }, { id: 'hoy', label: 'Citas Hoy' }, { id: 'proximo', label: 'Próximos' }, { id: 'vencido', label: 'Vencidos' }, { id: 'sin_cita', label: 'Sin Cita' }].map(f => (<button key={f.id} onClick={() => setFilterCita(f.id)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterCita === f.id ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f.label}</button>))}</div>
           </div>
           <div className="space-y-3">
               {filteredPatients.length > 0 ? filteredPatients.map(child => (
                    <div key={child.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center gap-4 animate-fadeIn hover:shadow-md">
                       <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-lg shrink-0">{child.nombres?.[0] || '-'}</div>
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                               <h3 className="font-bold text-gray-800">{child.nombres} {child.apellidos}</h3>
                               {child.anemia && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold flex items-center"><Droplet size={10} className="mr-1 fill-current"/> Anemia</span>}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                               <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 text-[11px] font-semibold"><CreditCard size={12} className="text-gray-400"/> {child.dni}</span>
                               <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 text-[11px] font-semibold"><FileText size={12} className="text-gray-400"/> {child.historiaClinica || 'Sin HC'}</span>
                               <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-purple-100 bg-purple-50 text-purple-700 text-[11px] font-bold shadow-sm">
                                  <Calendar size={12} className="text-purple-500"/> {new Date(child.fechaNacimiento + 'T00:00:00').toLocaleDateString('es-PE', {day: '2-digit', month: 'short', year: 'numeric'})}
                                  <span className="mx-0.5 text-purple-300">|</span>
                                  <Clock size={12} className="text-purple-500"/> {calculateDetailedAge(child.fechaNacimiento)?.shortFormatted || '-'}
                               </span>
                            </div>
                          </div>
                       </div>
                       <div className={`px-4 py-2 rounded-lg border ${child.citaStatus.bg} ${child.citaStatus.border} flex flex-col items-center min-w-[140px] shrink-0`}><span className={`text-xs font-bold uppercase ${child.citaStatus.color} mb-0.5`}>{child.citaStatus.status === 'sin_cita' ? 'Cita CRED' : child.citaStatus.label}</span><span className={`text-sm font-medium ${child.citaStatus.color}`}>{child.citaStatus.status === 'sin_cita' ? 'No programada' : formatDateLong(child.proximaCita)}</span></div>
                       <button onClick={() => setSelectedId(child.id)} className="bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 shrink-0">Atender <ChevronRight size={18}/></button>
                    </div>
                  )) : <div className="text-center p-12 text-gray-500">No se encontraron pacientes.</div>}
           </div>
         </div>
      ) : (
          <div className="flex flex-col gap-6 animate-fadeIn">
              <button onClick={() => setSelectedId(null)} className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 rounded-lg border shadow-sm w-fit transition-all hover:shadow-md"><ChevronLeft size={18}/> Volver a la lista</button>
              <div className="bg-white rounded-2xl shadow-sm border p-5 flex flex-col md:flex-row gap-6 items-start relative overflow-hidden">
                  <div className={`w-20 h-20 shrink-0 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-md bg-gradient-to-br ${selectedChild.sexo === 'Femenino' ? 'from-pink-400 to-pink-600' : 'from-blue-400 to-blue-600'}`}>
                      {selectedChild.nombres?.[0] || '-'}
                  </div>
                  <div className="flex-1 w-full pt-1">
                      <h2 className="text-2xl font-extrabold text-gray-800 leading-tight">{selectedChild.nombres} {selectedChild.apellidos}</h2>
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><FileText size={15} className="text-gray-400"/> <span className="font-bold text-gray-700">HC:</span> {selectedChild.historiaClinica || 'S/N'}</span>
                          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><User size={15} className="text-gray-400"/> <span className="font-bold text-gray-700">DNI:</span> {selectedChild.dni}</span>
                          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><Calendar size={15} className="text-gray-400"/> <span className="font-bold text-gray-700">F. Nac:</span> {new Date(selectedChild.fechaNacimiento + 'T00:00:00').toLocaleDateString('es-PE', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><Clock size={15} className="text-gray-400"/> <span className="font-bold text-gray-700">Edad:</span> <span className={selectedChild.sexo === 'Femenino' ? 'text-pink-600 font-bold' : 'text-blue-600 font-bold'}>{calculateDetailedAge(selectedChild.fechaNacimiento)?.formatted}</span></span>
                          <span className={`px-2.5 py-0.5 rounded-md border text-xs font-bold uppercase tracking-wider ${selectedChild.sexo === 'Femenino' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{selectedChild.seguro}</span>
                          {selectedChild.anemia && (<span className="px-2.5 py-0.5 rounded-md border text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700 border-red-200 flex items-center gap-1"><AlertTriangle size={10} className="fill-current"/> Anemia</span>)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-500 font-medium"><MapPin size={16} className="text-gray-400" />{selectedChild.direccion} {selectedChild.distrito ? `- ${selectedChild.distrito}` : ''}</div>
                  </div>
                  <div className="hidden md:block text-right border-l pl-6 py-1 min-w-[160px] mr-12">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Apoderado</p>
                      <p className="font-bold text-gray-800 text-sm mb-1">{selectedChild.responsable}</p>
                      <p className={`font-bold text-base ${selectedChild.sexo === 'Femenino' ? 'text-pink-500' : 'text-blue-500'}`}><Phone size={14} className="inline mr-1"/>{selectedChild.telefono}</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-wrap gap-2 bg-white p-2 rounded-lg shadow-sm">
                      {[{ id: 'crecimiento', label: 'Controles', icon: Activity }, { id: 'vacunas', label: 'Vacunas', icon: Plus }, { id: 'suplementos', label: 'Suplementos', icon: Circle }, { id: 'citas', label: 'Citas', icon: Calendar }].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><tab.icon size={18}/> {tab.label}</button>))}
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm min-h-[400px]">
                      
                      {activeTab === 'crecimiento' && (
                        <div className="space-y-8 animate-fadeIn">
                            <div className="flex items-center gap-2 mb-4 border-b pb-4">
                                <h2 className="text-xl font-bold text-purple-700 flex items-center gap-2"><Activity size={20}/> Esquema de Controles CRED</h2>
                                <p className="text-sm text-gray-500 ml-auto hidden md:block">Haz clic en los cuadros para registrar medidas físicas (Peso/Talla)</p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-6">
                                {ESQUEMA_CONTROLES_CRED.map((grupo, idx) => (
                                    <div key={idx} className="border rounded-xl overflow-hidden shadow-sm bg-white">
                                        <div className={`bg-${grupo.color}-50 p-4 border-b border-${grupo.color}-100`}>
                                            <h3 className={`font-bold text-${grupo.color}-800 text-lg flex items-center gap-2`}><CheckCircle size={18}/> {grupo.titulo}</h3>
                                            <p className={`text-${grupo.color}-600 text-sm`}>{grupo.subtitulo}</p>
                                        </div>
                                        <div className="p-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {grupo.controles.map((control) => {
                                                const record = selectedChild.cronogramaCred?.[control.id];
                                                const isDone = !!record;
                                                return (
                                                    <button 
                                                        key={control.id} 
                                                        onClick={() => setControlModal({ show: true, controlId: control.id, label: control.label, data: { fecha: record?.fecha || new Date().toISOString().split('T')[0], peso: record?.peso || '', talla: record?.talla || '', estadoNutricional: record?.estadoNutricional || 'Normal' } })} 
                                                        className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all group ${isDone ? `bg-green-50 border-green-500 hover:bg-green-100` : 'bg-white border-gray-200 hover:border-purple-300'}`}
                                                    >
                                                        <div className={`text-sm font-bold mb-1 ${isDone ? 'text-green-800' : 'text-gray-700 group-hover:text-purple-700'}`}>{control.label}</div>
                                                        <div className="text-xs text-gray-500 text-center mb-2">{control.desc}</div>
                                                        {isDone ? (
                                                            <div className="flex flex-col items-center w-full bg-white p-1.5 rounded border border-green-200">
                                                                <span className="text-[10px] text-green-700 font-bold block mb-1">{formatDateLong(record.fecha)}</span>
                                                                <div className="flex gap-2 text-xs font-medium text-gray-600"><span>P: {record.peso}kg</span><span>T: {record.talla}cm</span></div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-500 group-hover:border-purple-200 transition-colors">
                                                                <Plus size={16} />
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

                      {activeTab === 'vacunas' && (<div className="space-y-6 animate-fadeIn"><h2 className="text-xl font-bold text-purple-700">Vacunación</h2><div className="space-y-4">{ESQUEMA_VACUNACION.map((grupo, idx) => (<div key={idx} className="border rounded"><div className="bg-purple-50 px-4 py-2 font-bold text-purple-800">{grupo.edad}</div><div className="p-4 grid grid-cols-2 gap-4">{grupo.vacunas.map((vacuna, vIdx) => (<div key={vIdx}><label className="text-sm block mb-1">{vacuna}</label><input type="date" className={`border p-2 rounded text-sm w-full ${selectedChild.vacunas?.[vacuna] ? 'bg-green-50 border-green-200' : ''}`} value={selectedChild.vacunas?.[vacuna] || ''} onChange={(e) => handleVaccineChange(vacuna, e.target.value)} /></div>))}</div></div>))}</div></div>)}
                      {activeTab === 'suplementos' && (
                        <div className="space-y-8 animate-fadeIn">
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="text-xl font-bold text-purple-700 flex items-center gap-2"><Circle size={20}/> Cronograma de Suplementos</h2>
                                <p className="text-sm text-gray-500 ml-auto hidden md:block">Haga clic en los círculos para registrar la atención</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {esquema.map((etapa, idx) => (
                                    <div key={idx} className={`border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white ${idx === 2 ? 'md:row-span-2' : ''}`}>
                                        <div className={`bg-${etapa.color}-50 p-4 border-b border-${etapa.color}-100 flex justify-between items-start`}>
                                            <div><h3 className={`font-bold text-${etapa.color}-800 text-lg`}>{etapa.titulo}</h3><p className={`text-${etapa.color}-600 text-sm`}>{etapa.subtitulo}</p></div>
                                            {etapa.hasToggle && (<div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm"><button onClick={() => setSupplementType6to11('Hierro')} className={`px-2 py-1 text-xs font-bold rounded ${supplementType6to11 === 'Hierro' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Hierro</button><button onClick={() => setSupplementType6to11('MMN')} className={`px-2 py-1 text-xs font-bold rounded ${supplementType6to11 === 'MMN' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>MMN</button></div>)}
                                        </div>
                                        <div className="p-4 grid grid-cols-2 gap-4">
                                            {etapa.hitos.map((hito) => {
                                                const record = selectedChild.cronogramaSuplementos?.[hito.id];
                                                const isDone = !!record;
                                                return (
                                                    <button key={hito.id} onClick={() => handleHitoClick(hito)} className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${isDone ? `bg-green-50 border-green-500` : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                                        <div className="text-sm font-bold text-gray-600 mb-1">{hito.label}</div>
                                                        <div className={`mb-1 ${isDone ? 'scale-110 transition-transform' : ''}`}>{renderIcon(hito.icon, isDone)}</div>
                                                        <div className="text-xs text-gray-500 text-center leading-tight">{hito.desc}</div>
                                                        {isDone && (<div className="mt-1 flex flex-col items-center"><div className="flex items-center text-xs text-green-700 font-bold"><CheckCircle size={10} className="mr-1"/> {formatDateLong(record.fecha)}</div>{record.hb && <div className="text-xs text-blue-600 font-bold">Hb: {record.hb}</div>}</div>)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                      )}
                      {activeTab === 'citas' && (<div className="space-y-6 animate-fadeIn"><h2 className="text-xl font-bold text-purple-700">Agendar Cita (Control CRED)</h2><div className="flex gap-2 max-w-md"><input type="date" className="border p-2 rounded w-full" value={newCita} onChange={(e) => setNewCita(e.target.value)} /><button onClick={handleUpdateCita} className="bg-blue-600 text-white px-4 py-2 rounded">Agendar CRED</button></div></div>)}
                  </div>
              </div>
          </div>
      )}

      {/* MODAL REGISTRO CONTROL CRED (PESO/TALLA) */}
      {controlModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm animate-fadeIn">
            <h3 className="text-lg font-bold text-purple-900 mb-4 border-b border-purple-100 pb-2 flex items-center gap-2"><Activity size={20}/> Registrar {controlModal.label}</h3>
            <form onSubmit={handleSaveControl} className="space-y-4">
              <div>
                 <label className="block text-sm font-medium mb-1 text-gray-700">Fecha de Atención</label>
                 <input type="date" required className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-purple-500 outline-none" value={controlModal.data.fecha} onChange={(e) => setControlModal({...controlModal, data: { ...controlModal.data, fecha: e.target.value }})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Peso (kg)</label>
                    <input type="number" step="0.01" required placeholder="Ej: 8.5" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-purple-500 outline-none" value={controlModal.data.peso} onChange={(e) => setControlModal({...controlModal, data: { ...controlModal.data, peso: e.target.value }})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Talla (cm)</label>
                    <input type="number" step="0.1" required placeholder="Ej: 70.5" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-purple-500 outline-none" value={controlModal.data.talla} onChange={(e) => setControlModal({...controlModal, data: { ...controlModal.data, talla: e.target.value }})} />
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-medium mb-1 text-gray-700">Estado Nutricional</label>
                 <select required className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-purple-500 outline-none font-medium text-gray-700" value={controlModal.data.estadoNutricional} onChange={(e) => setControlModal({...controlModal, data: { ...controlModal.data, estadoNutricional: e.target.value }})}>
                    <option value="Normal">Normal</option>
                    <option value="Riesgo de Desnutrición">Riesgo de Desnutrición</option>
                    <option value="Desnutrición Leve">Desnutrición Leve</option>
                    <option value="Desnutrición Severa">Desnutrición Severa</option>
                    <option value="Sobrepeso">Sobrepeso</option>
                    <option value="Obesidad">Obesidad</option>
                 </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                 <button type="button" onClick={() => setControlModal({ show: false, controlId: null, label: '', data: { fecha: '', peso: '', talla: '', estadoNutricional: 'Normal' } })} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium hover:bg-gray-200">Cancelar</button>
                 <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 shadow-sm">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO HITO SUPLEMENTOS */}
      {hitoModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Registrar Suplemento - {hitoModal.hito?.label}</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Fecha de Atención</label><input type="date" className="w-full border p-2 rounded" value={hitoModal.data.fecha} onChange={(e) => setHitoModal({...hitoModal, data: { ...hitoModal.data, fecha: e.target.value }})} /></div>
              {hitoModal.hito?.reqHb && (<div><label className="block text-sm font-medium mb-1 text-blue-700 flex items-center gap-1"><Droplet size={14}/> Valor Hemoglobina (Hb)</label><input type="number" step="0.1" placeholder="Ej: 11.5" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={hitoModal.data.hb} onChange={(e) => setHitoModal({...hitoModal, data: { ...hitoModal.data, hb: e.target.value }})} /></div>)}
              <div className="flex gap-3 pt-2"><button onClick={() => setHitoModal({ show: false, hito: null, data: {} })} className="flex-1 px-4 py-2 bg-gray-100 rounded text-gray-700">Cancelar</button><button onClick={saveHito} className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Guardar</button></div>
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
      list = list.filter(c => 
        (c.nombres || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.apellidos || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.dni || '').includes(searchTerm)
      );
    } else {
      list = list.filter(c => 
        c.anemia || 
        (c.tratamientosAnemiaPrevios && c.tratamientosAnemiaPrevios.length > 0) || 
        (c.historialAnemia && c.historialAnemia.length > 0) 
      );
    }

    if (filterEstado === 'activos') {
      list = list.filter(c => c.anemia);
    } else if (filterEstado === 'alta') {
      list = list.filter(c => !c.anemia && c.tratamientosAnemiaPrevios?.length > 0);
    }

    if (filterCita !== 'todos') {
      list = list.filter(c => c.citaStatus.status === filterCita);
    }
    
    return list;
  }, [patientsWithStatus, filterEstado, searchTerm, filterCita]);

  const updateChildData = (updatedFields) => {
      const updatedChildren = children.map(c => {
          if (c.id === parseInt(selectedId)) {
              return { ...c, ...updatedFields };
          }
          return c;
      });
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
        if (typeof entregaActual === 'string') {
            defaultFecha = entregaActual;
        } else {
            defaultFecha = entregaActual.fecha || defaultFecha;
            defaultPeso = entregaActual.peso || '';
            defaultTalla = entregaActual.talla || '';
        }
    }
    
    setEntregaModal({ 
        show: true, 
        index, 
        fecha: defaultFecha,
        peso: defaultPeso,
        talla: defaultTalla
    });
  };

  const confirmEntrega = () => {
    const { index, fecha, peso, talla } = entregaModal;
    if (!fecha) return;

    const currentEntregas = [...(selectedChild.tratamientoAnemia?.entregas || [])];
    
    currentEntregas[index] = { fecha, peso, talla };
    
    updateChildData({ 
      tratamientoAnemia: { ...selectedChild.tratamientoAnemia, entregas: currentEntregas } 
    });
    showToast(`Entrega #${index + 1} registrada/actualizada`, 'success');
    setEntregaModal({ show: false, index: null, fecha: '', peso: '', talla: '' });
  };

  const confirmAlta = () => {
      const pastTreatment = {
          ...selectedChild.tratamientoAnemia,
          tipo: selectedChild.tipoAnemia,
          fechaAlta: altaForm.fecha,
          recuperado: altaForm.recuperado
      };
      const prevTreatments = selectedChild.tratamientosAnemiaPrevios || [];

      updateChildData({ 
          anemia: false, 
          tipoAnemia: null, 
          tratamientoAnemia: { inicio: null, entregas: [] },
          tratamientosAnemiaPrevios: [...prevTreatments, pastTreatment] 
      });
      
      setSelectedId(null);
      showToast('Paciente dado de alta y guardado en historial', 'success');
      setAltaModal(false);
  };

  const cancelEditHb = () => {
      setEditHbIndex(null);
      setHbControl({ fecha: new Date().toISOString().split('T')[0], hb: '', tipo: 'Control', resultado: 'Normal', observacion: '' });
  };

  const editHbControl = (displayIndex) => {
      const realIndex = (selectedChild.historialAnemia.length - 1) - displayIndex;
      const item = selectedChild.historialAnemia[realIndex];
      setHbControl({...item, resultado: item.resultado || 'Normal'});
      setEditHbIndex(realIndex);
  };

  const deleteHbControl = (displayIndex) => {
      setDeleteHbModal({ show: true, index: displayIndex });
  };

  const confirmDeleteHb = () => {
      const realIndex = (selectedChild.historialAnemia.length - 1) - deleteHbModal.index;
      const updatedHistorial = [...selectedChild.historialAnemia];
      updatedHistorial.splice(realIndex, 1);
      updateChildData({ historialAnemia: updatedHistorial });
      showToast('Registro eliminado', 'info');
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
          showToast('Registro actualizado', 'success');
          cancelEditHb();
          return;
      }

      const nuevoRegistro = { ...hbControl, hb: val };
      const nuevoHistorial = [...(selectedChild.historialAnemia || []), nuevoRegistro];
      
      let updates = { hemoglobina: val, historialAnemia: nuevoHistorial };
      
      if (!selectedChild.anemia && isAnemia) {
          updates.anemia = true;
          updates.tipoAnemia = manualTipo;
          updates.tratamientoAnemia = { inicio: hbControl.fecha, entregas: [] };
          showToast(`Diagnóstico: ${manualDiag}. Tratamiento iniciado (0/6).`, 'error');
      } else if (!isAnemia && selectedChild.anemia) {
          showToast(`Diagnóstico: ${manualDiag}. Considere dar de alta.`, 'success');
      } else {
          showToast(`Registro guardado: ${manualDiag}`, 'info');
      }

      updateChildData(updates);
      setHbControl({ fecha: new Date().toISOString().split('T')[0], hb: '', tipo: 'Control', resultado: 'Normal', observacion: '' });
  };

  const handleUpdateCita = () => {
      if(!newCita) return;
      updateChildData({ proximaCitaAnemia: newCita });
      showToast('Próxima cita de Anemia agendada', 'success');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 w-full">
      <h2 className="text-2xl font-bold text-red-700 mb-6 flex items-center gap-2"><Droplet className="fill-current" /> Seguimiento de Anemia</h2>
      
      {!selectedChild ? (
        <div className="w-full">
           <div className="bg-red-50 p-8 rounded-xl shadow-sm text-center mb-6 border border-red-100">
              <h3 className="text-xl font-bold text-red-800 mb-2">Buscador de Pacientes</h3>
              <div className="relative max-w-xl mx-auto"><Search className="absolute left-4 top-3.5 text-gray-400" size={20} /><input type="text" placeholder="Buscar por DNI o Nombres..." className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus /></div>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 mt-5 pt-5 border-t border-red-200 justify-center">
                <div className="flex items-center gap-2">
                   <span className="text-sm font-bold text-red-800 flex items-center"><User size={16} className="mr-1"/> Estado:</span>
                   <select 
                      className="border border-red-200 text-red-800 bg-white rounded-full px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500 shadow-sm cursor-pointer" 
                      value={filterEstado} 
                      onChange={(e) => setFilterEstado(e.target.value)}
                   >
                     <option value="todos">Todos los Pacientes</option>
                     <option value="activos">En Tratamiento (Activos)</option>
                     <option value="alta">Pacientes de Alta</option>
                   </select>
                </div>
                
                <div className="hidden sm:block w-px bg-red-200"></div>

                <div className="flex flex-wrap items-center gap-2">
                   <span className="text-sm font-bold text-red-800 flex items-center mr-1"><Filter size={16} className="mr-1"/> Citas:</span>
                   {[{ id: 'todos', label: 'Todas' }, { id: 'hoy', label: 'Hoy' }, { id: 'proximo', label: 'Próximas' }, { id: 'vencido', label: 'Vencidas' }].map(f => (
                     <button key={f.id} onClick={() => setFilterCita(f.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filterCita === f.id ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-red-700 border border-red-200 hover:bg-red-100'}`}>
                       {f.label}
                     </button>
                   ))}
                </div>
              </div>
           </div>
           
           <div className="space-y-3">
             {filteredPatients.length > 0 ? filteredPatients.map(child => {
                const isAlta = !child.anemia && child.tratamientosAnemiaPrevios?.length > 0;
                return (
                 <div key={child.id} className={`bg-white p-4 rounded-lg shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fadeIn hover:shadow-md transition-shadow ${isAlta ? 'border-green-200' : child.anemia ? 'border-red-200' : 'border-gray-100'}`}>
                   <div className="flex items-center gap-4 flex-1">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${child.anemia ? 'bg-red-100 text-red-600' : (isAlta ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600')}`}>{child.nombres?.[0] || '-'}</div>
                     <div>
                       <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-bold text-gray-800">{child.nombres} {child.apellidos}</h3>
                          {child.anemia ? (
                             <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold flex items-center"><AlertTriangle size={10} className="mr-1"/> Entrega: {(child.tratamientoAnemia?.entregas || []).filter(Boolean).length}/6</span>
                          ) : (isAlta ? (
                             <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center"><CheckCircle size={10} className="mr-1"/> De Alta</span>
                          ) : null)}
                       </div>
                       <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 text-[11px] font-semibold"><CreditCard size={12} className="text-gray-400"/> {child.dni}</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 text-[11px] font-semibold"><FileText size={12} className="text-gray-400"/> {child.historiaClinica || 'Sin HC'}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-bold shadow-sm ${child.anemia ? 'bg-red-50 text-red-700 border-red-100' : (isAlta ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100')}`}>
                             <Calendar size={12} className="opacity-70"/> {new Date(child.fechaNacimiento + 'T00:00:00').toLocaleDateString('es-PE', {day: '2-digit', month: 'short', year: 'numeric'})}
                             <span className="mx-0.5 opacity-40">|</span>
                             <Clock size={12} className="opacity-70"/> {calculateDetailedAge(child.fechaNacimiento)?.shortFormatted || '-'}
                          </span>
                       </div>
                     </div>
                   </div>
                   
                   <div className={`px-4 py-2 rounded-lg border ${child.citaStatus.bg} ${child.citaStatus.border} flex flex-col items-center min-w-[140px] w-full sm:w-auto shrink-0`}>
                      <span className={`text-xs font-bold uppercase ${child.citaStatus.color} mb-0.5`}>{child.citaStatus.status === 'sin_cita' ? 'Cita Anemia' : child.citaStatus.label}</span>
                      <span className={`text-sm font-medium ${child.citaStatus.color}`}>{child.citaStatus.status === 'sin_cita' ? 'No programada' : formatDateLong(child.proximaCitaAnemia)}</span>
                   </div>

                   <button onClick={() => { setSelectedId(child.id); setSearchTerm(''); setActiveTab(child.anemia ? 'tratamiento' : (isAlta ? 'tratamientos_previos' : 'historial')); }} className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium flex justify-center items-center gap-2 shadow-sm whitespace-nowrap shrink-0 ${child.anemia ? 'bg-red-600 text-white hover:bg-red-700' : (isAlta ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700')}`}>
                     {child.anemia ? 'Seguimiento' : (isAlta ? 'Ver Historial' : 'Tamizaje')} <ChevronRight size={18}/>
                   </button>
                 </div>
               )
             }) : <div className="text-center p-8 text-gray-500">No se encontraron pacientes con los filtros actuales</div>}
           </div>
        </div>
      ) : (
        <div className="animate-fadeIn">
          <button onClick={() => setSelectedId(null)} className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 rounded-lg border shadow-sm w-fit transition-all hover:shadow-md">
              <ChevronLeft size={18}/> Volver a la lista
          </button>
          <div className="bg-white rounded-2xl shadow-sm border p-5 flex flex-col md:flex-row gap-6 items-start relative overflow-hidden mb-6">
              <div className={`w-20 h-20 shrink-0 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-md bg-gradient-to-br ${selectedChild.sexo === 'Femenino' ? 'from-pink-400 to-pink-600' : 'from-blue-400 to-blue-600'}`}>
                  {selectedChild.nombres?.[0] || '-'}
              </div>
              <div className="flex-1 w-full pt-1">
                  <h2 className="text-2xl font-extrabold text-gray-800 leading-tight">{selectedChild.nombres} {selectedChild.apellidos}</h2>
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><FileText size={15} className="text-gray-400"/> <span className="font-bold text-gray-700">HC:</span> {selectedChild.historiaClinica || 'S/N'}</span>
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><User size={15} className="text-gray-400"/> <span className="font-bold text-gray-700">DNI:</span> {selectedChild.dni}</span>
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><Calendar size={15} className="text-gray-400"/> <span className="font-bold text-gray-700">F. Nac:</span> {new Date(selectedChild.fechaNacimiento + 'T00:00:00').toLocaleDateString('es-PE', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><Clock size={15} className="text-gray-400"/> <span className="font-bold text-gray-700">Edad:</span> <span className={selectedChild.sexo === 'Femenino' ? 'text-pink-600 font-bold' : 'text-blue-600 font-bold'}>{calculateDetailedAge(selectedChild.fechaNacimiento)?.formatted}</span></span>
                      <span className={`px-2.5 py-0.5 rounded-md border text-xs font-bold uppercase tracking-wider ${selectedChild.sexo === 'Femenino' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{selectedChild.seguro}</span>
                      {selectedChild.anemia && (<span className="px-2.5 py-0.5 rounded-md border text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700 border-red-200 flex items-center gap-1"><AlertTriangle size={10} className="fill-current"/> Anemia</span>)}
                      {selectedChild.tratamientosAnemiaPrevios?.length > 0 && !selectedChild.anemia && (<span className="px-2.5 py-0.5 rounded-md border text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700 border-green-200 flex items-center gap-1"><CheckCircle size={10} className="fill-current"/> De Alta</span>)}
                      <span className={`px-2.5 py-0.5 rounded-md border text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${selectedChild.anemia ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          <Droplet size={10} className="fill-current"/> Hb Actual: {selectedChild.hemoglobina || '-'}
                      </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-500 font-medium"><MapPin size={16} className="text-gray-400" />{selectedChild.direccion} {selectedChild.distrito ? `- ${selectedChild.distrito}` : ''}</div>
              </div>
              <div className="hidden md:block text-right border-l pl-6 py-1 min-w-[160px] mr-12">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Apoderado</p>
                  <p className="font-bold text-gray-800 text-sm mb-1">{selectedChild.responsable}</p>
                  <p className={`font-bold text-base ${selectedChild.sexo === 'Femenino' ? 'text-pink-500' : 'text-blue-500'}`}><Phone size={14} className="inline mr-1"/>{selectedChild.telefono}</p>
              </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
              {selectedChild.anemia && <button onClick={() => setActiveTab('tratamiento')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'tratamiento' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Tratamiento</button>}
              <button onClick={() => setActiveTab('historial')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'historial' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Historial Hb</button>
              <button onClick={() => setActiveTab('tratamientos_previos')} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'tratamientos_previos' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Archive size={16}/> Historial Altas</button>
              <button onClick={() => setActiveTab('citas')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'citas' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Citas</button>
          </div>

          {activeTab === 'tratamiento' && (
             selectedChild.anemia ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                  <div className="md:col-span-1 space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <h4 className="font-bold text-red-800 flex items-center gap-2 mb-2"><AlertTriangle size={18}/> Tratamiento Activo</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Inicio:</span> <span className="font-medium">{formatDateLong(selectedChild.tratamientoAnemia?.inicio)}</span></div>
                        <div className="flex justify-between"><span>Tipo:</span> <span className="font-medium">{selectedChild.tipoAnemia}</span></div>
                      </div>
                    </div>
                    <button onClick={() => { setAltaForm({ fecha: new Date().toISOString().split('T')[0], recuperado: true }); setAltaModal(true); }} className="w-full border-2 border-green-600 text-green-700 font-bold py-2 rounded-lg hover:bg-green-50 transition-colors">Dar de Alta (Manual)</button>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Circle className="text-blue-600" size={20}/> Esquema de 6 Meses</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {[...Array(6)].map((_, i) => {
                        const entregado = selectedChild.tratamientoAnemia?.entregas?.[i];
                        const isCompleted = !!entregado;
                        // COMPATIBILIDAD CON DATOS VIEJOS
                        const eFecha = typeof entregado === 'string' ? entregado : entregado?.fecha;
                        const ePeso = typeof entregado === 'object' ? entregado?.peso : null;
                        const eTalla = typeof entregado === 'object' ? entregado?.talla : null;

                        return (
                          <button key={i} onClick={() => promptEntrega(i)} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${isCompleted ? 'border-green-500 bg-green-50 hover:bg-green-100' : 'border-gray-200 hover:border-blue-300 bg-white'}`}>
                            <span className={`text-xs font-bold uppercase mb-2 ${isCompleted ? 'text-green-700' : 'text-gray-400'}`}>Entrega {i + 1}</span>
                            {isCompleted ? (
                                <>
                                    <CheckCircle size={32} className="text-green-500 mb-1"/>
                                    <span className="text-xs font-bold text-green-700">{formatDateLong(eFecha)}</span>
                                    {(ePeso || eTalla) && (
                                        <span className="text-[10px] text-green-600 mt-1 bg-green-100 px-2 py-0.5 rounded-full font-semibold">
                                            {ePeso ? `${ePeso}kg ` : ''}{ePeso && eTalla ? '- ' : ''}{eTalla ? `${eTalla}cm` : ''}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 mb-1 flex items-center justify-center text-gray-300 font-bold">{i + 1}</div>
                                    <span className="text-xs text-blue-600 font-medium">Registrar</span>
                                </>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
             ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4"/>
                    <h3 className="text-xl font-bold text-gray-700">Sin Anemia Activa</h3>
                    <p className="text-gray-500 mb-4">Este paciente no requiere tratamiento actualmente.</p>
                </div>
             )
          )}

          {activeTab === 'historial' && (
              <div className="space-y-6 animate-fadeIn">
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-gray-700 flex items-center gap-2"><Activity size={18}/> {editHbIndex !== null ? 'Editar Registro' : 'Registrar Nuevo Control de Hb'}</h3>
                          {editHbIndex !== null && <button onClick={cancelEditHb} className="text-xs text-red-600 underline">Cancelar Edición</button>}
                      </div>
                      <form onSubmit={handleAddHbControl} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
                          <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">Fecha</label><input type="date" className="w-full border p-2 rounded" value={hbControl.fecha} onChange={e => setHbControl({...hbControl, fecha: e.target.value})} required/></div>
                          <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">Valor Hb</label><input type="number" step="0.1" className="w-full border p-2 rounded" placeholder="11.5" value={hbControl.hb} onChange={e => setHbControl({...hbControl, hb: e.target.value})} required/></div>
                          <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label><select className="w-full border p-2 rounded" value={hbControl.tipo} onChange={e => setHbControl({...hbControl, tipo: e.target.value})}><option>Tamizaje</option><option>Control</option><option>Diagnóstico</option><option>Alta</option></select></div>
                          <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">Diagnóstico</label><select className="w-full border p-2 rounded font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500" value={hbControl.resultado} onChange={e => setHbControl({...hbControl, resultado: e.target.value})}><option value="Normal">Normal</option><option value="Anemia Leve">Anemia Leve</option><option value="Anemia Moderada">Anemia Moderada</option><option value="Anemia Severa">Anemia Severa</option></select></div>
                          <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">Observación</label><input className="w-full border p-2 rounded" placeholder="Opcional" value={hbControl.observacion} onChange={e => setHbControl({...hbControl, observacion: e.target.value})}/></div>
                          <button className={`text-white px-4 py-2 rounded font-medium h-[42px] w-full md:col-span-1 ${editHbIndex !== null ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{editHbIndex !== null ? 'Actualizar' : 'Guardar'}</button>
                      </form>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-left">
                          <thead className="bg-gray-100 text-xs uppercase text-gray-600"><tr><th className="p-3">Fecha</th><th className="p-3">Hb</th><th className="p-3">Estado</th><th className="p-3">Tipo</th><th className="p-3">Obs</th><th className="p-3 text-center">Acciones</th></tr></thead>
                          <tbody className="text-sm divide-y">
                              {selectedChild.historialAnemia && selectedChild.historialAnemia.length > 0 ? (
                                  [...selectedChild.historialAnemia].reverse().map((reg, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                          <td className="p-3">{formatDateLong(reg.fecha)}</td>
                                          <td className="p-3 font-bold">{reg.hb}</td>
                                          <td className="p-3">{reg.resultado || (reg.hb < 11 ? 'Anemia' : 'Normal')}</td>
                                          <td className="p-3">{reg.tipo}</td>
                                          <td className="p-3 text-gray-500">{reg.observacion || '-'}</td>
                                          <td className="p-3 text-center">
                                              <div className="flex items-center justify-center gap-2">
                                                  <button onClick={() => editHbControl(idx)} className="text-amber-600 hover:bg-amber-50 p-1 rounded" title="Editar"><Edit size={16}/></button>
                                                  <button onClick={() => deleteHbControl(idx)} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Eliminar"><Trash size={16}/></button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))
                              ) : <tr><td colSpan="6" className="p-4 text-center text-gray-400">Sin registros históricos</td></tr>}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {activeTab === 'tratamientos_previos' && (
             <div className="space-y-4 animate-fadeIn">
               <h3 className="text-xl font-bold text-gray-800">Historial de Tratamientos Pasados</h3>
               {selectedChild.tratamientosAnemiaPrevios?.length > 0 ? (
                  selectedChild.tratamientosAnemiaPrevios.map((trat, idx) => (
                    <div key={idx} className="bg-white border-2 border-green-100 rounded-xl p-5 shadow-sm">
                       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 border-b border-gray-100 pb-3 gap-2">
                          <div>
                            <span className="font-bold text-gray-800 text-lg">Tratamiento #{idx + 1}</span>
                            <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold uppercase">{trat.tipo || 'Anemia'}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold uppercase ${trat.recuperado !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {trat.recuperado !== false ? 'Recuperado' : 'No Recuperado'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium"><span className="text-gray-400">Inicio:</span> {formatDateLong(trat.inicio)}</span>
                            <ChevronRight size={16} className="text-gray-300"/>
                            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium"><span className="text-gray-400">Alta:</span> {formatDateLong(trat.fechaAlta)}</span>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                          {[...Array(6)].map((_, i) => {
                             const entrega = trat.entregas?.[i];
                             const eFecha = typeof entrega === 'string' ? entrega : entrega?.fecha;
                             const ePeso = typeof entrega === 'object' ? entrega?.peso : null;
                             return (
                                 <div key={i} className={`p-3 rounded-lg border flex flex-col items-center ${entrega ? 'bg-green-50/50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Entr. {i+1}</div>
                                    <div className={`text-sm font-bold text-center ${entrega ? 'text-green-700' : 'text-gray-400'}`}>
                                       {eFecha ? formatDateLong(eFecha) : '-'}
                                    </div>
                                    {ePeso && <div className="text-[10px] text-green-600 mt-0.5 font-semibold">{ePeso}kg</div>}
                                 </div>
                             )
                          })}
                       </div>
                    </div>
                  )).reverse()
               ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                     <Archive size={48} className="mx-auto text-gray-300 mb-3" />
                     <h4 className="text-lg font-bold text-gray-600">Sin Tratamientos Anteriores</h4>
                     <p className="text-gray-500">Este paciente no tiene historial de altas previas.</p>
                  </div>
               )}
             </div>
          )}

          {activeTab === 'citas' && (<div className="space-y-6 animate-fadeIn"><h2 className="text-xl font-bold text-purple-700">Agendar Cita (Anemia)</h2><div className="flex gap-2 max-w-md"><input type="date" className="border p-2 rounded w-full" value={newCita} onChange={(e) => setNewCita(e.target.value)} /><button onClick={handleUpdateCita} className="bg-blue-600 text-white px-4 py-2 rounded">Agendar Anemia</button></div></div>)}
        </div>
      )}

      {/* Modal para Registrar/Editar Entrega */}
      {entregaModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm animate-slideDown">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Registrar/Editar Entrega #{entregaModal.index + 1}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de Entrega</label>
                <input 
                  type="date" 
                  className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-green-500" 
                  value={entregaModal.fecha} 
                  onChange={(e) => setEntregaModal({...entregaModal, fecha: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2 border-t pt-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Peso (kg) <span className="text-gray-400 font-normal text-[10px] block leading-tight">(Opcional)</span></label>
                    <input type="number" step="0.01" className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: 10.5" value={entregaModal.peso} onChange={(e) => setEntregaModal({...entregaModal, peso: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Talla (cm) <span className="text-gray-400 font-normal text-[10px] block leading-tight">(Opcional)</span></label>
                    <input type="number" step="0.1" className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: 75.5" value={entregaModal.talla} onChange={(e) => setEntregaModal({...entregaModal, talla: e.target.value})} />
                 </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setEntregaModal({ show: false, index: null, fecha: '', peso: '', talla: '' })} className="flex-1 px-4 py-2 bg-gray-100 rounded text-gray-700 font-medium">Cancelar</button>
                <button onClick={confirmEntrega} className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Alta */}
      {altaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm animate-slideDown">
            <div className="text-center mb-4">
              <CheckCircle className="mx-auto text-green-500 mb-2" size={48} />
              <h3 className="text-lg font-bold text-gray-900">Dar de Alta</h3>
              <p className="text-gray-600 text-sm">El tratamiento actual se moverá al <strong>Historial</strong>.</p>
            </div>
            
            <div className="space-y-4 text-left mb-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Fecha de Alta</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-green-500 outline-none" 
                  value={altaForm.fecha} 
                  onChange={(e) => setAltaForm({...altaForm, fecha: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">¿Paciente Recuperado?</label>
                <select 
                  className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-green-500 outline-none font-medium" 
                  value={altaForm.recuperado} 
                  onChange={(e) => setAltaForm({...altaForm, recuperado: e.target.value === 'true'})}
                >
                  <option value="true">Sí, Recuperado</option>
                  <option value="false">No (Abandono, Límite de Edad, etc.)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setAltaModal(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium hover:bg-gray-200">Cancelar</button>
              <button onClick={confirmAlta} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Confirmar Alta</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación Hb */}
      {deleteHbModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm animate-slideDown">
            <div className="text-center">
              <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
              <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar Registro?</h3>
              <p className="text-gray-600 mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteHbModal({show: false, index: null})} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium hover:bg-gray-200">Cancelar</button>
                <button onClick={confirmDeleteHb} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Eliminar</button>
              </div>
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
                    <title>Reporte de Atención - ${safeConfig.nombreCentro}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 10px; }
                        .text-center { text-align: center; }
                        .title { font-size: 18px; font-weight: bold; color: ${isAnemia ? '#b30000' : '#1a3686'}; text-transform: uppercase; margin: 0 0 5px 0;}
                        .subtitle { font-size: 12px; color: #555; margin: 0 0 20px 0;}
                        table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                        thead { display: table-header-group; }
                        th, td { border: 1px solid #999; padding: 6px 4px; text-align: center; }
                        .header-cred th { background-color: #1a3686 !important; color: #ffffff !important; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .header-anemia th { background-color: #b30000 !important; color: #ffffff !important; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .empty-state { padding: 40px; text-align: center; font-style: italic; color: #666; border: 1px dashed #ccc;}
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
                table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
                th, td { border: 1px solid #000000; padding: 6px; }
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
    <div className="space-y-6 w-full">
      <div className="print:hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
          <div>
             <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-blue-600"/> Centro de Reportes</h2>
             <p className="text-sm text-gray-500">Formatos nominales de Atención Integral o Seguimiento de Anemia</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors justify-center w-full sm:w-auto">
              <Download size={18} /> Exportar Excel
            </button>
            <button onClick={handlePrint} className={`${moduleType === 'anemia' ? 'bg-[#b30000] hover:bg-red-800' : 'bg-blue-800 hover:bg-blue-900'} text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors justify-center w-full sm:w-auto`}>
              <Printer size={18} /> Imprimir Formato
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
             <button onClick={() => setReportType('diario')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${reportType === 'diario' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>Diario</button>
             <button onClick={() => setReportType('mensual')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${reportType === 'mensual' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>Mensual</button>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
             <button onClick={() => setModuleType('cred')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${moduleType === 'cred' ? 'bg-[#1a3686] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Módulo CRED</button>
             <button onClick={() => setModuleType('anemia')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${moduleType === 'anemia' ? 'bg-[#b30000] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Módulo Anemia</button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-600"><Calendar size={18}/></span>
            {reportType === 'diario' ? (
               <input type="date" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}/>
            ) : (
               <input type="month" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}/>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto w-full">
        <div id="printable-report-area" className="min-w-[1000px] p-6 w-full">
            <div className="text-center mb-4">
                <h1 className="title" style={{ color: moduleType === 'anemia' ? '#b30000' : '#1a3686', textTransform: 'uppercase' }}>{(safeConfig.nombreCentro || '').toUpperCase()}</h1>
                <p className="subtitle">
                   REPORTE {reportType === 'diario' ? 'DIARIO' : 'MENSUAL'} DE {moduleType === 'anemia' ? 'SEGUIMIENTO DE ANEMIA' : 'ATENCIÓN CRED'} 
                   ({reportType === 'diario' ? formatDateLong(selectedDate) : selectedMonth})
                </p>
            </div>

            {reportData.length > 0 ? (
                moduleType === 'anemia' ? (
                    <table className="w-full text-[11px] border-collapse border border-gray-300 header-anemia">
                        <thead>
                            <tr className="bg-[#b30000] text-white">
                                <th className="border border-gray-300 p-2">Fecha Atención</th>
                                <th className="border border-gray-300 p-2">HC</th>
                                <th className="border border-gray-300 p-2">DNI</th>
                                <th className="border border-gray-300 p-2">Paciente</th>
                                <th className="border border-gray-300 p-2 w-8">Sexo</th>
                                <th className="border border-gray-300 p-2">F. Nacimiento</th>
                                <th className="border border-gray-300 p-2">Edad</th>
                                <th className="border border-gray-300 p-2 w-12">Peso (Kg)</th>
                                <th className="border border-gray-300 p-2 w-12">Talla (Cm)</th>
                                <th className="border border-gray-300 p-2 w-12">Hb</th>
                                <th className="border border-gray-300 p-2">Diagnóstico</th>
                                <th className="border border-gray-300 p-2 w-16">Entrega N°</th>
                                <th className="border border-gray-300 p-2 w-16">Alta</th>
                                <th className="border border-gray-300 p-2">Ubicación</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-800">
                            {reportData.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50 border-b border-gray-200">
                                    <td className="border border-gray-300 p-2 text-center">{row.date}</td>
                                    <td className="border border-gray-300 p-2 text-center">{row.child.historiaClinica || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center">{row.child.dni}</td>
                                    <td className="border border-gray-300 p-2 font-bold whitespace-nowrap">{row.child.nombres} {row.child.apellidos}</td>
                                    <td className="border border-gray-300 p-2 text-center">{row.child.sexo === 'Masculino' ? 'M' : 'F'}</td>
                                    <td className="border border-gray-300 p-2 text-center whitespace-nowrap">{row.child.fechaNacimiento}</td>
                                    <td className="border border-gray-300 p-2 text-center whitespace-nowrap">{calculateDetailedAge(row.child.fechaNacimiento)?.shortFormatted || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center">{row.data.peso || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center">{row.data.talla || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center font-bold text-red-700">{row.data.hb || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center font-bold">{row.data.diagnostico || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center font-bold">{row.data.entregaNum || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center font-bold text-green-700">{row.data.alta || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center text-[10px] truncate max-w-[120px]">{row.child.localidad || row.child.direccion || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-[11px] border-collapse border border-gray-300 header-cred">
                        <thead>
                            <tr className="bg-[#1a3686] text-white">
                                <th rowSpan="2" className="border border-gray-300 p-2">Fecha Atención</th>
                                <th rowSpan="2" className="border border-gray-300 p-2">HC</th>
                                <th rowSpan="2" className="border border-gray-300 p-2">DNI</th>
                                <th rowSpan="2" className="border border-gray-300 p-2">Paciente</th>
                                <th rowSpan="2" className="border border-gray-300 p-2 w-8">Sexo</th>
                                <th rowSpan="2" className="border border-gray-300 p-2">F. Nacimiento</th>
                                <th rowSpan="2" className="border border-gray-300 p-2">Edad</th>
                                <th rowSpan="2" className="border border-gray-300 p-2 w-10">Peso (Kg)</th>
                                <th rowSpan="2" className="border border-gray-300 p-2 w-10">Talla (Cm)</th>
                                <th rowSpan="2" className="border border-gray-300 p-2 w-10">Hb</th>
                                <th rowSpan="2" className="border border-gray-300 p-2">N° CRED</th>
                                <th rowSpan="2" className="border border-gray-300 p-2 max-w-[150px]">Inmunizaciones</th>
                                <th colSpan="3" className="border border-gray-300 p-1 border-b-0">Suplementación</th>
                                <th rowSpan="2" className="border border-gray-300 p-2">Ubicación</th>
                            </tr>
                            <tr className="bg-[#1a3686] text-white">
                                <th className="border border-gray-300 p-1 w-10">SF</th>
                                <th className="border border-gray-300 p-1 w-10">MMN</th>
                                <th className="border border-gray-300 p-1 w-12">Vit. A</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-800">
                            {reportData.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50 border-b border-gray-200">
                                    <td className="border border-gray-300 p-2 text-center">{row.date}</td>
                                    <td className="border border-gray-300 p-2 text-center">{row.child.historiaClinica || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center">{row.child.dni}</td>
                                    <td className="border border-gray-300 p-2 font-bold whitespace-nowrap">{row.child.nombres} {row.child.apellidos}</td>
                                    <td className="border border-gray-300 p-2 text-center">{row.child.sexo === 'Masculino' ? 'M' : 'F'}</td>
                                    <td className="border border-gray-300 p-2 text-center whitespace-nowrap">{row.child.fechaNacimiento}</td>
                                    <td className="border border-gray-300 p-2 text-center whitespace-nowrap">{calculateDetailedAge(row.child.fechaNacimiento)?.shortFormatted || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center font-bold text-blue-800">{row.data.peso || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center font-bold text-blue-800">{row.data.talla || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center font-bold text-red-600">{row.data.hb || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center text-[10px]">{row.data.nCred || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center text-[10px] max-w-[150px] truncate" title={row.data.vacunas.join(', ')}>{row.data.vacunas.join(', ') || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center font-bold">{row.data.sf || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center font-bold">{row.data.mmn || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center font-bold">{row.data.vitA || '-'}</td>
                                    <td className="border border-gray-300 p-2 text-center text-[10px] truncate max-w-[120px]">{row.child.localidad || row.child.direccion || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )
            ) : (
                <div className="empty-state py-12 text-gray-400 border-2 border-dashed border-gray-200 mt-4 rounded-lg w-full">
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

  const deleteUser = (index) => {
      setUserToDelete(index);
  };

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
      if (perms.includes(modId)) {
          setUserForm({ ...userForm, permisos: perms.filter(p => p !== modId) });
      } else {
          setUserForm({ ...userForm, permisos: [...perms, modId] });
      }
  };

  const handleLogoUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          if (file.size > 2 * 1024 * 1024) { 
              showToast('La imagen es demasiado grande. Máximo 2MB.', 'error');
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              setConfigForm(prev => ({ ...prev, logo: reader.result }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveConfig = () => {
      setAppConfig(configForm);
      showToast('Configuración general actualizada', 'success');
  };

  const handleExportData = () => {
      const dataToExport = {
          childrenData: children,
          usersData: users,
          appConfigData: appConfig,
          exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Respaldo_QaliWawa_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Copia de seguridad descargada', 'success');
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
              showToast('Datos restaurados correctamente', 'success');
          } catch (err) {
              showToast('Error al leer el archivo JSON de respaldo', 'error');
          }
      };
      reader.readAsText(file);
  };

  const handleClearData = () => {
      setClearConfirmText('');
      setShowClearModal(true);
  };

  const executeClearData = () => {
      if (clearConfirmText === 'ELIMINAR') {
          setChildren([]);
          showToast('Base de datos de pacientes formateada', 'info');
          setShowClearModal(false);
      } else {
          showToast('La palabra de confirmación no coincide', 'error');
      }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 lg:p-8 w-full animate-fadeIn">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
            <Settings className="text-gray-600"/> Panel de Configuración
        </h2>

        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto text-sm font-medium">
            <button onClick={() => setActiveTab('general')} className={`px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Configuración General</button>
            <button onClick={() => setActiveTab('usuarios')} className={`px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'usuarios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Gestión de Usuarios</button>
            <button onClick={() => setActiveTab('datos')} className={`flex items-center gap-1 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'datos' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><AlertTriangle size={14}/> Zona de Gestión de Datos</button>
        </div>

        {activeTab === 'general' && (
            <div className="space-y-6 animate-fadeIn w-full pb-4">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3 max-w-3xl">
                    <Info className="text-blue-600 mt-0.5 shrink-0" size={20}/>
                    <div>
                        <h4 className="font-bold text-blue-800">Zona de Configuración Global</h4>
                        <p className="text-sm text-blue-600">Al modificar los datos y guardar, el sistema cambiará de apariencia para todos los usuarios. El logo subido se mostrará en el login y en el menú.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Centro / Sistema</label>
                            <input type="text" className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={configForm.nombreCentro || ''} onChange={e => setConfigForm({...configForm, nombreCentro: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Subtítulo / Slogan</label>
                            <input type="text" className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={configForm.slogan || ''} onChange={e => setConfigForm({...configForm, slogan: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Versión</label>
                            <input type="text" className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={configForm.version || ''} onChange={e => setConfigForm({...configForm, version: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Derechos Reservados (Footer)</label>
                            <input type="text" className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-600" value={configForm.footer || ''} onChange={e => setConfigForm({...configForm, footer: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Logo Institucional</label>
                        <div className="flex gap-4 items-start">
                            <label className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer h-40 w-40 relative overflow-hidden group shrink-0">
                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                {configForm.logo ? (
                                    <>
                                        <img src={configForm.logo} alt="Logo" className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-bold flex flex-col items-center gap-1"><Upload size={18}/> Cambiar</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon size={32} className="text-gray-300 mb-2"/>
                                        <span className="text-blue-600 font-bold text-sm mb-1 flex items-center gap-1"><Upload size={14}/> Subir logo</span>
                                        <span className="text-[10px] text-gray-400">Max. 2MB</span>
                                    </>
                                )}
                            </label>
                            {configForm.logo && (
                                <button type="button" onClick={() => setConfigForm({...configForm, logo: null})} className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1 mt-2">
                                    <Trash2 size={16} /> Quitar Logo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end border-t pt-6">
                    <button onClick={handleSaveConfig} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                        <Save size={18}/> Guardar Configuración
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'usuarios' && (
            <div className="space-y-4 animate-fadeIn">
                <div className="flex justify-end">
                    <button onClick={handleNewUser} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors">
                        <User size={18}/> Nuevo Usuario
                    </button>
                </div>
                
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                            <tr>
                                <th className="p-4">Nombre</th>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-sm">
                            {users.map((u, i) => (
                                <tr key={u.id || i} className="hover:bg-gray-50">
                                    <td className="p-4 font-bold text-gray-800">{u.nombre}</td>
                                    <td className="p-4 text-gray-600">{u.usuario}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.rol === 'admin' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                            {u.rol}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <button onClick={() => handleEditUser(i)} className="text-blue-600 hover:text-blue-800"><Edit size={18}/></button>
                                            <button onClick={() => deleteUser(i)} className="text-red-600 hover:text-red-800" disabled={u.rol === 'admin' && users.filter(usr => usr.rol === 'admin').length === 1} title={u.rol === 'admin' && users.filter(usr => usr.rol === 'admin').length === 1 ? 'No puedes borrar al último admin' : ''}><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showUserModal && (
                    <div className="fixed inset-0 bg-black/50 z-[80] flex justify-center items-start pt-10 p-4 overflow-y-auto">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mb-10 animate-slideDown overflow-hidden">
                            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                                <h3 className="text-lg font-bold">{editingUserIndex !== null ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                                <button onClick={() => setShowUserModal(false)} className="hover:bg-blue-700 p-1 rounded-full"><X/></button>
                            </div>
                            <form onSubmit={saveUser} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Nombre Completo</label>
                                    <input required type="text" className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={userForm.nombre} onChange={e => setUserForm({...userForm, nombre: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Usuario (DNI)</label>
                                        <input required type="text" className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={userForm.usuario} onChange={e => setUserForm({...userForm, usuario: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1"><Lock size={12}/> Contraseña</label>
                                        <input required type="password" placeholder="Ingrese contraseña" className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Rol</label>
                                    <select className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={userForm.rol} onChange={e => setUserForm({...userForm, rol: e.target.value})}>
                                        <option value="admin">Administrador (Acceso Total)</option>
                                        <option value="user">Usuario (Limitado)</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Cargo / Puesto</label>
                                        <div className="relative"><Briefcase className="absolute left-3 top-3 text-gray-400" size={14}/><input className="w-full border p-2.5 pl-8 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. Enfermera" value={userForm.cargo} onChange={e => setUserForm({...userForm, cargo: e.target.value})} /></div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Establecimiento</label>
                                        <div className="relative"><Building className="absolute left-3 top-3 text-gray-400" size={14}/><input className="w-full border p-2.5 pl-8 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. C.S. QaliWawa" value={userForm.establecimiento} onChange={e => setUserForm({...userForm, establecimiento: e.target.value})} /></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Correo Electrónico</label>
                                        <div className="relative"><Mail className="absolute left-3 top-3 text-gray-400" size={14}/><input type="email" className="w-full border p-2.5 pl-8 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="ejemplo@minsa.gob.pe" value={userForm.correo} onChange={e => setUserForm({...userForm, correo: e.target.value})} /></div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Teléfono</label>
                                        <div className="relative"><Phone className="absolute left-3 top-3 text-gray-400" size={14}/><input className="w-full border p-2.5 pl-8 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="999 999 999" value={userForm.telefono} onChange={e => setUserForm({...userForm, telefono: e.target.value})} /></div>
                                    </div>
                                </div>

                                {userForm.rol !== 'admin' && (
                                    <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1 uppercase tracking-wider"><Shield size={14}/> Permisos de acceso a módulos</h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                            {MODULOS_DISPONIBLES.map(mod => (
                                                <label key={mod.id} className={`flex items-center gap-3 p-2 rounded border cursor-pointer transition-colors ${userForm.permisos?.includes(mod.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                        checked={userForm.permisos?.includes(mod.id)}
                                                        onChange={() => togglePermiso(mod.id)}
                                                    />
                                                    <span className={`text-sm font-medium ${userForm.permisos?.includes(mod.id) ? 'text-blue-800' : 'text-gray-600'}`}>{mod.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t">
                                    <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg text-gray-700 font-bold hover:bg-gray-200">Cancelar</button>
                                    <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">{editingUserIndex !== null ? 'Guardar Cambios' : 'Crear Usuario'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'datos' && (
            <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="border border-blue-100 bg-blue-50/30 p-6 rounded-xl shadow-sm">
                        <h3 className="font-bold text-blue-800 text-lg mb-2 flex items-center gap-2"><Download size={20}/> Exportar Datos</h3>
                        <p className="text-sm text-gray-600 mb-6 h-10">Descarga una copia completa de la base de datos actual (Pacientes, Usuarios y Configuración) en formato JSON.</p>
                        <button onClick={handleExportData} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors">
                            <Download size={18}/> Descargar Respaldo
                        </button>
                    </div>

                    <div className="border border-green-100 bg-green-50/30 p-6 rounded-xl shadow-sm">
                        <h3 className="font-bold text-green-800 text-lg mb-2 flex items-center gap-2"><Upload size={20}/> Importar Datos</h3>
                        <p className="text-sm text-gray-600 mb-6 h-10">Restaura una copia de seguridad previa. <strong className="text-green-700">Esta acción reemplazará todos los datos actuales del sistema.</strong></p>
                        <label className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors cursor-pointer">
                            <Upload size={18}/> Subir Archivo .json
                            <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                        </label>
                    </div>
                </div>

                <div className="mt-8 border border-red-200 bg-red-50 p-6 rounded-xl shadow-sm w-full">
                    <h3 className="font-bold text-red-800 text-lg mb-2 flex items-center gap-2"><AlertTriangle size={20}/> Zona Roja (Eliminación de Datos)</h3>
                    <div className="bg-red-100/50 p-4 rounded-lg text-sm text-red-700 mb-6 border border-red-100">
                        <strong>Advertencia Crítica:</strong> Las acciones realizadas en esta sección son irreversibles. Por favor, asegúrese de haber realizado una copia de seguridad antes de proceder a eliminar información masiva.
                    </div>
                    <button onClick={handleClearData} className="bg-white border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-bold py-2.5 px-6 rounded-lg transition-colors">
                        Vaciar Padrón de Pacientes
                    </button>
                </div>
            </div>
        )}

        {/* NUEVO MODAL DE CONFIRMACIÓN: ELIMINAR USUARIO */}
        {userToDelete !== null && (
            <div className="fixed inset-0 bg-black/60 z-[90] flex justify-center items-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-slideDown p-6 text-center border border-gray-200">
                    <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar Usuario?</h3>
                    <p className="text-gray-600 mb-6">Se revocará el acceso para <strong>{users[userToDelete]?.nombre}</strong> permanentemente.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setUserToDelete(null)} className="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg text-gray-700 font-bold hover:bg-gray-200">Cancelar</button>
                        <button onClick={confirmDeleteUser} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm">Eliminar</button>
                    </div>
                </div>
            </div>
        )}

        {/* NUEVO MODAL DE ALTA SEGURIDAD: ZONA ROJA */}
        {showClearModal && (
            <div className="fixed inset-0 bg-black/80 z-[100] flex justify-center items-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-slideDown overflow-hidden border border-red-200">
                    <div className="bg-red-600 p-4 flex justify-between items-center text-white">
                        <h3 className="text-lg font-bold flex items-center gap-2"><AlertTriangle size={20}/> Peligro Crítico</h3>
                        <button onClick={() => setShowClearModal(false)} className="hover:bg-red-700 p-1 rounded-full transition-colors"><X size={20}/></button>
                    </div>
                    <div className="p-6 space-y-5">
                        <p className="text-gray-700 text-sm leading-relaxed">Estás a punto de <strong className="text-red-600">ELIMINAR TODOS LOS PACIENTES</strong> del padrón nominal, incluyendo su historial clínico, vacunas y controles CRED. Esta acción es <strong>irreversible</strong> si no has descargado una copia de seguridad.</p>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <label className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wider text-center">Escribe <span className="text-red-600 font-black">ELIMINAR</span> para confirmar</label>
                            <input 
                                type="text" 
                                className="w-full border-2 border-red-300 rounded-lg p-3 outline-none focus:border-red-600 text-center font-black tracking-widest text-red-600 bg-white"
                                value={clearConfirmText}
                                onChange={(e) => setClearConfirmText(e.target.value.toUpperCase())}
                                placeholder="ELIMINAR"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowClearModal(false)} className="flex-1 px-4 py-3 bg-gray-100 rounded-lg text-gray-700 font-bold hover:bg-gray-200 transition-colors">Cancelar</button>
                            <button 
                                onClick={executeClearData} 
                                disabled={clearConfirmText !== 'ELIMINAR'}
                                className={`flex-1 px-4 py-3 rounded-lg font-bold text-white transition-all shadow-sm ${clearConfirmText === 'ELIMINAR' ? 'bg-red-600 hover:bg-red-700 cursor-pointer' : 'bg-red-300 cursor-not-allowed'}`}
                            >
                                Vaciar Datos
                            </button>
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
  const [children, _setChildren] = useState(initialData);
  const [users, _setUsers] = useState(defaultUsers);
  const [appConfig, _setAppConfig] = useState(defaultConfig);

  const showToast = (message, type = 'success') => { setNotification({ message, type }); };

  // --- LÓGICA DE SINCRONIZACIÓN FIREBASE ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
        setAuthChecking(false);
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (userRecord) => {
      if (userRecord) {
        // Suscribirse a los datos en tiempo real una vez autenticado
        const baseRef = collection(db, 'artifacts', appId, 'public', 'data', 'qaliwawa_store');

        const unsubChildren = onSnapshot(doc(baseRef, 'children'), (snap) => {
            if (snap.exists() && snap.data().list) _setChildren(snap.data().list);
            else setDoc(doc(baseRef, 'children'), { list: initialData }).catch(console.error);
        });

        const unsubUsers = onSnapshot(doc(baseRef, 'users'), (snap) => {
            if (snap.exists() && snap.data().list) _setUsers(snap.data().list);
            else setDoc(doc(baseRef, 'users'), { list: defaultUsers }).catch(console.error);
        });

        const unsubConfig = onSnapshot(doc(baseRef, 'appConfig'), (snap) => {
            if (snap.exists() && snap.data().config) _setAppConfig(snap.data().config);
            else setDoc(doc(baseRef, 'appConfig'), { config: defaultConfig }).catch(console.error);
        });

        setAuthChecking(false);

        return () => { unsubChildren(); unsubUsers(); unsubConfig(); };
      } else {
        setAuthChecking(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // --- WRAPPERS PARA GUARDAR EN FIREBASE ---
  const setChildrenSync = (newVal) => {
      _setChildren(prev => {
          const resolved = typeof newVal === 'function' ? newVal(prev) : newVal;
          if (!authChecking) {
              setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qaliwawa_store', 'children'), { list: resolved }).catch(console.error);
          }
          return resolved;
      });
  };

  const setUsersSync = (newVal) => {
      _setUsers(prev => {
          const resolved = typeof newVal === 'function' ? newVal(prev) : newVal;
          if (!authChecking) {
              setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qaliwawa_store', 'users'), { list: resolved }).catch(console.error);
          }
          return resolved;
      });
  };

  const setAppConfigSync = (newVal) => {
      _setAppConfig(prev => {
          const resolved = typeof newVal === 'function' ? newVal(prev) : newVal;
          if (!authChecking) {
              setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qaliwawa_store', 'appConfig'), { config: resolved }).catch(console.error);
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

  const allNavItems = useMemo(() => [
      { id: 'dashboard', label: 'Estadísticas', icon: LayoutDashboard, color: 'text-blue-600' }, 
      { id: 'padron', label: 'Padrón Nominal', icon: Users, color: 'text-green-600' }, 
      { id: 'cred', label: 'Control CRED', icon: Activity, color: 'text-purple-600' }, 
      { id: 'anemia', label: 'Seguimiento Anemia', icon: Droplet, color: 'text-red-600' }, 
      { id: 'reportes', label: 'Reportes', icon: FileText, color: 'text-gray-600' },
      { id: 'configuracion', label: 'Configuración', icon: Settings, color: 'text-gray-800' }
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
          <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center font-sans text-blue-600">
              <Loader2 className="animate-spin mb-4" size={48}/>
              <h2 className="text-xl font-bold">Conectando con la nube...</h2>
          </div>
      );
  }

  if (!currentUser) {
      return <Login users={users} appConfig={appConfig} onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 w-full overflow-x-hidden font-sans relative print:bg-white">
      {notification && (<Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />)}
      
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-all duration-300 ease-in-out print:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative ${isSidebarCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 flex flex-col`}>
        <div className={`p-4 flex ${isSidebarCollapsed ? 'justify-center flex-col gap-3' : 'justify-between'} items-center bg-gradient-to-r from-blue-700 to-blue-600 text-white min-h-[72px] shrink-0 transition-all shadow-md z-10`}>
            {!isSidebarCollapsed && (
                <div className="flex items-center gap-3 overflow-hidden w-full">
                    {appConfig?.logo ? (
                        <div className="w-10 h-10 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center shadow-sm">
                            <img src={appConfig.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-white/20 rounded-lg shrink-0 flex items-center justify-center shadow-inner border border-white/30">
                            <Activity size={24} className="text-white"/>
                        </div>
                    )}
                    <h1 className="text-base font-extrabold tracking-tight leading-tight truncate" title={appConfig?.nombreCentro}>{appConfig?.nombreCentro || 'Sistema QaliWawa'}</h1>
                </div>
            )}
            
            {isSidebarCollapsed && (
                appConfig?.logo ? (
                    <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center shadow-sm cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setIsSidebarCollapsed(false)}>
                        <img src={appConfig.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                ) : (
                    <button className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30" onClick={() => setIsSidebarCollapsed(false)}>
                        <Activity size={24} className="text-white"/>
                    </button>
                )
            )}

            {!isSidebarCollapsed && (
                <button className="hidden md:flex hover:bg-white/20 rounded-md p-1.5 shrink-0 transition-colors ml-2" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                    <ChevronLeft size={20} />
                </button>
            )}
            <button className="md:hidden hover:bg-white/20 rounded-md p-1.5 transition-colors" onClick={() => setIsSidebarOpen(false)}>
                <X size={24} />
            </button>
        </div>
        
        <nav className="p-2 space-y-2 flex-1 overflow-y-auto">
            {allowedNavItems.map((item) => { 
                const Icon = item.icon; 
                return (
                    <button key={item.id} onClick={() => { setActiveModule(item.id); if (isMobile) setIsSidebarOpen(false); }} title={isSidebarCollapsed ? item.label : ''} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors duration-200 ${activeModule === item.id ? 'bg-blue-50 text-blue-700 shadow-sm border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <Icon size={24} className={activeModule === item.id ? item.color : 'text-gray-400'} />
                        {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap overflow-hidden">{item.label}</span>}
                    </button>
                ); 
            })}
        </nav>
        
        {!isSidebarCollapsed && (
            <div className="p-4 border-t bg-gray-50 shrink-0 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                        {currentUser?.nombre?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-gray-800 truncate" title={currentUser?.nombre}>{currentUser?.nombre}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{currentUser?.rol}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 py-1.5 rounded-md text-sm font-bold transition-colors">
                    <LogOut size={16}/> Cerrar Sesión
                </button>
                <div className="text-[10px] text-center text-gray-400 leading-tight mt-2 border-t pt-2">
                    {appConfig?.slogan || 'Gestión Integral'}<br/>v{appConfig?.version || '1.0'}
                </div>
            </div>
        )}
      </aside>

      <main className="flex-1 w-full min-w-0 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible print:block bg-gray-50">
        
        <header className="bg-white border-b px-4 md:px-8 py-4 flex items-center justify-between shadow-sm z-10 print:hidden shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-600 hover:text-blue-600 transition-colors">
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-2 text-gray-800">
                    <span className="font-bold uppercase text-sm tracking-wide text-gray-700">
                        {allowedNavItems.find(n => n.id === activeModule)?.label}
                    </span>
                </div>
            </div>
            
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors shadow-sm ${isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="hidden sm:inline">{isOnline ? 'Sistema en línea' : 'Sin conexión'}</span>
                <span className="sm:hidden">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full print:overflow-visible print:p-0 print:block">
            <div className="w-full">
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