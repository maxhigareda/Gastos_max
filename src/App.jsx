import { useState } from 'react';
import GroupSelector from './components/GroupSelector';
import TypeSelector from './components/TypeSelector';
import ExpenseForm from './components/ExpenseForm';
import SuccessView from './components/SuccessView';
import SummaryView from './components/SummaryView';
import InvestmentView from './components/InvestmentView';
import { submitExpense } from './services/api';
import { GROUPS } from './constants/categories';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, BarChart2, TrendingUp } from 'lucide-react';

function App() {
  const [view, setView] = useState('entry'); // 'entry' | 'summary' | 'investment'
  const [step, setStep] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // NOTE: In a real deploy, user would set this. For now we use a prompt or placeholder.
  // We will ask the user for this URL.
  const API_URL = localStorage.getItem('EXPENSE_API_URL') || '';

  const handleGroupSelect = (groupId) => {
    setSelectedGroup(groupId);
    setStep(2);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setStep(3);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedGroup(null);
    } else if (step === 3) {
      setStep(2);
      setSelectedType(null);
    }
  };

  const handleSubmit = async (formData) => {
    if (!API_URL) {
      const url = prompt("Por favor ingresa la URL de tu Web App de Google Script:");
      if (url) {
        localStorage.setItem('EXPENSE_API_URL', url);
        window.location.reload();
        return;
      } else {
        alert("Necesitas la URL para guardar los datos.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await submitExpense(formData, API_URL);
      setShowSuccess(true);
    } catch (error) {
      alert("Error al guardar: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFlow = () => {
    setShowSuccess(false);
    setStep(1);
    setSelectedGroup(null);
    setSelectedType(null);
  };

  const currentGroup = GROUPS.find(g => g.id === selectedGroup);

  return (
    <div className="min-h-screen bg-neutral-950 text-white max-w-md mx-auto relative overflow-hidden flex flex-col">

      {/* View Toggle / Header */}
      {!showSuccess && step === 1 && (
        <div className="p-4 pt-6 flex justify-center pb-2">
          <div className="flex bg-neutral-900 rounded-full p-1 border border-white/5 relative z-10 shrink-0">
            <button
              onClick={() => setView('entry')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${view === 'entry' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              <Plus size={14} /> Capturar
            </button>
            <button
              onClick={() => setView('summary')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${view === 'summary' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              <BarChart2 size={14} /> Resumen
            </button>
            <button
              onClick={() => setView('investment')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${view === 'investment' ? 'bg-lime-400 text-black shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              <TrendingUp size={14} /> Inversión
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">

          {view === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <SummaryView onBack={() => setView('entry')} />
            </motion.div>
          )}

          {view === 'investment' && (
            <motion.div
              key="investment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <InvestmentView />
            </motion.div>
          )}

          {view === 'entry' && (
            // ENTRY VIEW Logic
            <>
              {/* Context Header for Steps */}
              {!showSuccess && view === 'entry' && (
                <header className="px-6 pb-2">
                  <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">
                    {step === 1 ? 'Hola, ¿qué gastaste hoy?' : (step === 2 ? currentGroup?.label : 'Detalle')}
                  </h1>
                  {step === 1 && <p className="text-neutral-500">Selecciona una categoría</p>}
                </header>
              )}

              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full overflow-y-auto"
                >
                  <GroupSelector onSelect={handleGroupSelect} />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <TypeSelector
                    groupId={selectedGroup}
                    onBack={handleBack}
                    onSelect={handleTypeSelect}
                  />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="h-full"
                >
                  <ExpenseForm
                    group={currentGroup}
                    type={selectedType}
                    onBack={handleBack}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                  />
                </motion.div>
              )}
            </>
          )}

        </AnimatePresence>
      </div>

      {showSuccess && <SuccessView onReset={resetFlow} />}

      {/* Helper for URL - Show on 'entry' step 1 */}
      {view === 'entry' && step === 1 && (
        <div className="p-4 text-center">
          <button
            onClick={() => {
              const currentUrl = localStorage.getItem('EXPENSE_API_URL') || '';
              const url = prompt("URL del Script de Google Apps:", currentUrl);
              if (url) {
                localStorage.setItem('EXPENSE_API_URL', url);
                window.location.reload();
              }
            }}
            className="text-xs text-neutral-600 underline hover:text-neutral-400 transition-colors"
          >
            {API_URL ? 'Cambiar URL de Conexión' : 'Configurar API URL'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
