import { useState } from 'react';
import GroupSelector from './components/GroupSelector';
import TypeSelector from './components/TypeSelector';
import ExpenseForm from './components/ExpenseForm';
import SuccessView from './components/SuccessView';
import { submitExpense } from './services/api';
import { GROUPS } from './constants/categories';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
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
        // Reload or just continue with new url
        window.location.reload(); // Simple reload to apply
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
      {/* Header */}
      {!showSuccess && (
        <header className="p-6 pt-8 pb-2">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">
            {step === 1 ? 'Hola, ¿qué gastaste hoy?' : 'Registro de Gasto'}
          </h1>
          {step === 1 && <p className="text-neutral-500">Selecciona una categoría</p>}
        </header>
      )}

      {/* Main Content Area with Transitions */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
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
        </AnimatePresence>
      </div>

      {showSuccess && <SuccessView onReset={resetFlow} />}

      {/* Configuration Hint (Hidden if URL exists) */}
      {!API_URL && step === 1 && (
        <div className="p-4 text-center">
          <button
            onClick={() => {
              const url = prompt("URL del Script de Google Apps:");
              if (url) {
                localStorage.setItem('EXPENSE_API_URL', url);
                window.location.reload();
              }
            }}
            className="text-xs text-neutral-600 underline"
          >
            Configurar API URL
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
