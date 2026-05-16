import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Calendar, 
  List, 
  Bell, 
  User, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Stethoscope,
  Umbrella,
  FileText,
  Thermometer,
  Clock
} from 'lucide-react';
import { db, auth } from './lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { initOneSignal, loginToOneSignal, requestNotificationPermission } from './lib/onesignal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, parseISO, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from './lib/utils';
import { WORKERS, REASONS, type Absence, type AbsenceType, type AbsenceReason } from './types';

// Components
const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-1 flex items-center justify-center gap-2 py-3 transition-all relative overflow-hidden",
      active ? "text-white" : "text-gray-400 hover:text-gray-200"
    )}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium text-sm">{label}</span>
    {active && (
      <motion.div
        layoutId="tab-underline"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
      />
    )}
  </button>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'registrar' | 'calendario' | 'ausencias'>('registrar');
  const [currentUser, setCurrentUser] = useState<string>(WORKERS[5]); // Default to Javi as in screenshot
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  useEffect(() => {
    initOneSignal();
    
    // Check if we already asked
    const asked = localStorage.getItem('onesignal_asked');
    if (!asked) {
      setTimeout(() => setShowNotifPrompt(true), 3000);
    }
  }, []);

  useEffect(() => {
    loginToOneSignal(currentUser);
  }, [currentUser]);

  useEffect(() => {
    const q = query(collection(db, 'absences'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: (doc.data().startDate as Timestamp).toDate().toISOString(),
        endDate: (doc.data().endDate as Timestamp).toDate().toISOString(),
        createdAt: (doc.data().createdAt as Timestamp).toDate().toISOString(),
      } as Absence));
      setAbsences(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'absences');
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans overflow-x-hidden pb-10">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        {/* Notification Prompt Banner */}
        <AnimatePresence>
          {showNotifPrompt && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="absolute top-full left-0 right-0 bg-blue-600 text-white px-6 py-3 flex items-center justify-between z-40 overflow-hidden shadow-lg"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-100" />
                <p className="text-xs font-bold tracking-tight">¿Quieres recibir avisos cuando alguien pida vacaciones?</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={async () => {
                    await requestNotificationPermission();
                    setShowNotifPrompt(false);
                    localStorage.setItem('onesignal_asked', 'true');
                  }}
                  className="bg-white text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-colors"
                >
                  Activar
                </button>
                <button 
                  onClick={() => {
                    setShowNotifPrompt(false);
                    localStorage.setItem('onesignal_asked', 'true');
                  }}
                  className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-400 transition-colors"
                >
                  Luego
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Asistencia<span className="text-blue-600">Pro</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-full">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 bg-red-500 border-2 border-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold">2</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 bg-white p-1 pr-3 rounded-full border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold uppercase shadow-inner">
                {currentUser[0]}
              </div>
              <span className="text-sm font-semibold text-gray-700 hidden sm:inline">{currentUser}</span>
              <ChevronLeft className={cn("w-4 h-4 text-gray-400 transition-transform", showUserMenu ? "-rotate-90" : "rotate-0")} />
            </button>
            
            <AnimatePresence>
              {showUserMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl p-1 z-50 overflow-hidden ring-1 ring-black/5"
                >
                  <p className="px-3 py-2 text-[10px] uppercase font-bold text-gray-400 tracking-wider">Cambiar Usuario</p>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {WORKERS.map(worker => (
                      <button
                        key={worker}
                        onClick={() => {
                          setCurrentUser(worker);
                          setShowUserMenu(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-between group",
                          currentUser === worker ? "bg-blue-50 text-blue-600 font-bold" : "hover:bg-gray-50 text-gray-600"
                        )}
                      >
                        {worker}
                        {currentUser === worker && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                      </button>
                    ))}
                  </div>
                  {currentUser === 'Javi' && (
                    <div className="border-t border-gray-100 mt-1 p-1">
                      <button 
                        onClick={async () => {
                          if (!confirm('¿Quieres importar el historial de la aplicación antigua?')) return;
                          setShowUserMenu(false);
                          try {
                            const { migrateHistory } = await import('./lib/migration');
                            await migrateHistory();
                            alert('Migración completada con éxito');
                          } catch (err) {
                            console.error(err);
                            alert('Error durante la migración. Revisa la consola.');
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-[10px] font-black text-blue-600 hover:bg-blue-50 transition-colors uppercase tracking-wider flex items-center gap-2"
                      >
                        <Plus className="w-3 h-3" />
                        Migrar Historial Antiguo
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Nav Tabs */}
      <div className="max-w-md mx-auto mt-6 px-4">
        <nav className="bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-2xl flex border border-gray-200/50 shadow-sm">
          <button 
            onClick={() => setActiveTab('registrar')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              activeTab === 'registrar' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva Ausencia
          </button>
          <button 
            onClick={() => setActiveTab('calendario')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              activeTab === 'calendario' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            Panel Diario
          </button>
          <button 
            onClick={() => setActiveTab('ausencias')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              activeTab === 'ausencias' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <List className="w-3.5 h-3.5" />
            Historial
          </button>
        </nav>
      </div>

      {/* Content */}
      <main className="p-4 sm:p-6 pb-24 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'registrar' && (
              <RegisterTab currentUser={currentUser} />
            )}
            {activeTab === 'calendario' && (
              <CalendarTab absences={absences} />
            )}
            {activeTab === 'ausencias' && (
              <AbsencesTab absences={absences} currentUser={currentUser} onTabChange={setActiveTab} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// Shareable helper functions
const getWorkerColor = (name: string) => {
  switch (name) {
    case 'Ana': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case 'Eva': return 'text-rose-600 bg-rose-50 border-rose-100';
    case 'Fabi': return 'text-cyan-600 bg-cyan-50 border-cyan-100';
    case 'Aroa': return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'Azahara': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    case 'Javi': return 'text-blue-600 bg-blue-50 border-blue-100';
    default: return 'text-gray-600 bg-gray-50 border-gray-100';
  }
};

const getWorkerDotColor = (name: string) => {
  switch (name) {
    case 'Ana': return 'bg-emerald-500';
    case 'Eva': return 'bg-rose-500';
    case 'Fabi': return 'bg-cyan-500';
    case 'Aroa': return 'bg-amber-500';
    case 'Azahara': return 'bg-indigo-500';
    case 'Javi': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

const getReasonIcon = (r: AbsenceReason) => {
  switch (r) {
    case 'Vacaciones': return <Umbrella className="w-6 h-6" />;
    case 'Asuntos propios': return <FileText className="w-6 h-6" />;
    case 'Médico': return <Stethoscope className="w-5 h-5" />;
    case 'Baja': return <Thermometer className="w-6 h-6" />;
    case 'Permiso': return <Clock className="w-6 h-6" />;
  }
};

const getReasonColor = (r: AbsenceReason) => {
  switch (r) {
    case 'Vacaciones': return 'text-blue-600';
    case 'Asuntos propios': return 'text-gray-600';
    case 'Médico': return 'text-red-600';
    case 'Baja': return 'text-purple-600';
    case 'Permiso': return 'text-amber-600';
  }
};

const getReasonBg = (r: AbsenceReason) => {
  switch (r) {
    case 'Vacaciones': return 'bg-blue-50 border-blue-100';
    case 'Asuntos propios': return 'bg-gray-50 border-gray-100';
    case 'Médico': return 'bg-red-50 border-red-100';
    case 'Baja': return 'bg-purple-50 border-purple-100';
    case 'Permiso': return 'bg-amber-50 border-amber-100';
  }
};

const getReasonBorder = (r: AbsenceReason) => {
  switch (r) {
    case 'Vacaciones': return 'border-blue-500';
    case 'Asuntos propios': return 'border-gray-500';
    case 'Médico': return 'border-red-500';
    case 'Baja': return 'border-purple-500';
    case 'Permiso': return 'border-amber-500';
  }
};

function RegisterTab({ currentUser }: { currentUser: string }) {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [type, setType] = useState<AbsenceType>('completa');
  const [reason, setReason] = useState<AbsenceReason>('Vacaciones');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'absences'), {
        userId: currentUser.toLowerCase(),
        userName: currentUser,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        type,
        reason,
        createdAt: Timestamp.now()
      });
      alert('Ausencia guardada correctamente');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'absences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto mt-4">
      <div className="flex flex-col gap-1 mb-8">
        <h2 className="text-2xl font-black tracking-tight text-gray-900">Generar Ausencia</h2>
        <p className="text-sm font-medium text-gray-400">Registrando como <span className="text-blue-600 font-bold">{currentUser}</span></p>
      </div>

      <div className="space-y-8">
        {/* Motivo */}
        <section className="space-y-4">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Motivo de la ausencia</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {REASONS.map(r => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={cn(
                  "p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300",
                  reason === r 
                    ? cn("scale-[1.03] shadow-md border-transparent", getReasonBg(r)) 
                    : "bg-white border-gray-100 hover:border-gray-200 text-gray-400"
                )}
              >
                <div className={cn("text-2xl", reason === r ? "animate-bounce-slow" : "grayscale opacity-50")}>
                  {r === 'Vacaciones' && '✈️'}
                  {r === 'Asuntos propios' && '🏠'}
                  {r === 'Médico' && '🩺'}
                  {r === 'Baja' && '🩹'}
                  {r === 'Permiso' && '📝'}
                </div>
                <span className={cn("text-[12px] font-bold tracking-tight", reason === r ? getReasonColor(r) : "text-gray-500")}>
                  {r}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Tipo */}
        <section className="space-y-4">
          <div className="flex p-1 bg-gray-100 rounded-xl max-w-xs mx-auto">
            <button 
              onClick={() => setType('completa')}
              className={cn(
                "flex-1 py-2.5 text-xs font-black rounded-lg transition-all",
                type === 'completa' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Completa
            </button>
            <button 
              onClick={() => setType('parcial')}
              className={cn(
                "flex-1 py-2.5 text-xs font-black rounded-lg transition-all",
                type === 'parcial' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Parcial
            </button>
          </div>
        </section>

        {/* Fechas */}
        <section className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block ml-1">Desde</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block ml-1">Hasta</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </section>

        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4.5 rounded-2xl shadow-xl shadow-blue-200/50 active:scale-[0.98] transition-all mt-4 text-sm uppercase tracking-widest"
        >
          {loading ? 'Solicitando...' : 'Solicitar Ausencia'}
        </button>
      </div>
    </div>
  );
}

function CalendarTab({ absences }: { absences: Absence[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="space-y-8 mt-4">
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl border border-gray-100 shadow-sm">
        <button onClick={prevMonth} className="p-2.5 hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all border border-transparent hover:border-gray-100"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="text-xl font-black capitalize tracking-tight text-gray-900">{format(currentDate, 'MMMM yyyy', { locale: es })}</h2>
        <button onClick={nextMonth} className="p-2.5 hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all border border-transparent hover:border-gray-100"><ChevronRight className="w-5 h-5" /></button>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-3 overflow-hidden">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
            <div key={day} className="text-center text-[10px] font-black text-gray-300 py-3 tracking-[2px]">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {days.map((day, i) => {
            const isSelectedMonth = day.getMonth() === currentDate.getMonth();
            const dayAbsences = absences.filter(abs => 
              isWithinInterval(day, { 
                start: new Date(abs.startDate), 
                end: new Date(abs.endDate) 
              })
            );
            const activeWorkers = WORKERS.filter(w => !dayAbsences.some(abs => abs.userName === w));
            const isToday = isSameDay(day, new Date());

            return (
              <div 
                key={i} 
                className={cn(
                  "min-h-[140px] border rounded-2xl p-2.5 flex flex-col gap-1.5 transition-all",
                  !isSelectedMonth ? "opacity-20 pointer-events-none grayscale" : "bg-gray-50/30",
                  isToday ? "border-blue-500 bg-blue-50/30 scale-[1.02] z-10 shadow-lg shadow-blue-50" : "border-gray-50 hover:border-gray-200"
                )}
              >
                <div className={cn(
                  "text-[10px] font-black ml-auto p-1.5 px-2.5 rounded-lg",
                  isToday ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-400"
                )}>
                  {format(day, 'd')}
                </div>
                
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1 mt-1">
                  {WORKERS.map(worker => {
                    const absence = dayAbsences.find(a => a.userName === worker);
                    const isPartial = absence?.type === 'parcial';
                    const isComplete = absence?.type === 'completa';

                    return (
                      <div 
                        key={worker}
                        className={cn(
                          "text-[9px] px-2 py-0.5 rounded-lg flex items-center gap-1.5 font-bold transition-all truncate h-5 border",
                          isComplete 
                            ? "bg-transparent border-dotted border-gray-200" 
                            : isPartial
                              ? cn("border-dashed opacity-60", getWorkerColor(worker))
                              : cn("shadow-sm border-solid", getWorkerColor(worker))
                        )}
                      >
                        {!isComplete && (
                          <>
                            <div className={cn("w-1 h-1 rounded-full shrink-0", isPartial ? "opacity-50" : "", getWorkerDotColor(worker))} />
                            <span className={cn("truncate", isPartial && "opacity-80")}>{worker}</span>
                            {isPartial && <span className="ml-auto text-[7px] font-black opacity-50 uppercase tracking-tighter">PARC</span>}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className={cn(
                  "mt-auto pt-2 border-t text-center text-[11px] font-black",
                  activeWorkers.length > 0 ? "text-blue-600 border-blue-50" : "text-gray-300 border-gray-100"
                )}>
                  {activeWorkers.length}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AbsencesTab({ absences, currentUser, onTabChange }: { absences: Absence[], currentUser: string, onTabChange: (tab: 'registrar' | 'calendario' | 'ausencias') => void }) {
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  const filteredAbsences = filter === 'mine' 
    ? absences.filter(a => a.userName === currentUser)
    : absences;

  const myAbsences = absences.filter(a => a.userName === currentUser);
  const totalDays = myAbsences.reduce((acc, curr) => {
    const diff = Math.ceil((new Date(curr.endDate).getTime() - new Date(curr.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return acc + diff;
  }, 0);

  return (
    <div className="space-y-8 mt-4">
      {/* Summary Card */}
      <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-xl shadow-gray-100 relative overflow-hidden flex flex-col sm:flex-row items-center gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-2xl font-black text-white shadow-2xl shadow-blue-200 ring-4 ring-blue-50">
            {currentUser[0]}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-lg border border-gray-50">
            <User className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left relative z-10">
          <h3 className="text-2xl font-black tracking-tight text-gray-900">Historial de {currentUser}</h3>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">
              <List className="w-3.5 h-3.5" />
              {myAbsences.length} registros
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-xs font-bold text-blue-600">
              <Calendar className="w-3.5 h-3.5" />
              {totalDays} días totales
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 shrink-0 relative z-10">
           {REASONS.map(r => {
            const count = myAbsences.filter(a => a.reason === r).length;
            if (count === 0) return null;
            return (
              <div key={r} className={cn("px-3 py-2 rounded-xl border flex items-center gap-2", getReasonBg(r))}>
                <span className={cn("text-[10px] font-black uppercase", getReasonColor(r))}>{r[0]}{r[1]}{r[2]} · {count}d</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-gray-300 uppercase tracking-[2px]">Registros Recientes</h3>
        <div className="bg-gray-100 p-1 rounded-xl flex">
          <button 
            onClick={() => setFilter('all')}
            className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black transition-all", filter === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400")}
          >
            TODOS
          </button>
          <button 
            onClick={() => setFilter('mine')}
            className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black transition-all", filter === 'mine' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400")}
          >
            MÍOS
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredAbsences.map((abs) => {
          const start = new Date(abs.startDate);
          const end = new Date(abs.endDate);
          const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const isOneDay = isSameDay(start, end);

          return (
            <motion.div 
              layout
              key={abs.id}
              className={cn(
                "bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-5 transition-all hover:shadow-xl hover:shadow-gray-100 hover:scale-[1.01] group relative border-l-[6px]",
                getReasonBorder(abs.reason)
              )}
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-lg font-black text-gray-400 border border-gray-100 shrink-0 group-hover:bg-white group-hover:border-blue-100 transition-colors">
                {abs.userName[0]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <h4 className="font-black text-gray-900 text-lg tracking-tight">{abs.userName}</h4>
                  <div className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-lg uppercase tracking-wider scale-90 sm:scale-100">Aprobado</div>
                </div>
                
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {abs.reason === 'Vacaciones' && '✈️'}
                      {abs.reason === 'Asuntos propios' && '🏠'}
                      {abs.reason === 'Médico' && '🩺'}
                      {abs.reason === 'Baja' && '🩹'}
                      {abs.reason === 'Permiso' && '📝'}
                    </span>
                    <span className="text-xs font-bold text-gray-500">{abs.reason}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {isOneDay 
                      ? format(start, "d 'de' MMMM", { locale: es })
                      : `${format(start, 'd MMM', { locale: es })} – ${format(end, 'd MMM', { locale: es })}`
                    }
                  </div>

                  <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider", getReasonBg(abs.reason))}>
                    {diffDays} {diffDays === 1 ? 'DÍA' : 'DÍAS'}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredAbsences.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold text-lg">No hay registros para mostrar</p>
            <button onClick={() => onTabChange('registrar')} className="mt-4 text-blue-600 font-black text-sm uppercase tracking-widest hover:underline px-6 py-2">Comenzar →</button>
          </div>
        )}
      </div>
{/* BOTÓN DE MIGRACIÓN DE HISTORIAL DE CLAUDE */}
<div style={{ margin: '20px', padding: '15px', border: '1px dashed #2196F3', borderRadius: '8px', backgroundColor: '#e3f2fd', textAlign: 'center' }}>
  <p style={{ marginTop: 0, color: '#0d47a1', fontWeight: 'bold', fontFamily: 'sans-serif' }}>Migración desde App Anterior</p>
  <input 
    type="file" 
    id="importarFile" 
    style={{ display: 'none' }} 
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function() {
        try {
          const datosViejos = JSON.parse(reader.result as string);
          localStorage.clear();
          for (const clave in datosViejos) {
            localStorage.setItem(clave, datosViejos[clave]);
          }
          alert("¡Migración exitosa! Se han restaurado tus datos. La app se reiniciará.");
          window.location.reload();
        } catch (err) {
          alert("Error al leer el archivo .json");
        }
      };
      reader.readAsText(file);
    }}
  />
  <button 
    onClick={() => document.getElementById('importarFile')?.click()} 
    style={{ padding: '10px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
  >
    ⬆️ Importar copia 'historial_claude.json'
  </button>
</div>

    </div>
  );
}
