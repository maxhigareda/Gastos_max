import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check, ChevronLeft } from 'lucide-react';
import { INVESTMENT_GOALS, INVESTMENT_PLACES } from '../constants/investments';

export default function InvestmentForm({ onBack, onSubmit, isSubmitting }) {
    const [formData, setFormData] = useState({
        total: '',
        category: '', // Goal
        place: '',
        date: new Date().toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }),
        sheetType: 'investment' // Critical for backend to distinguish
    });

    // Helper to format currency input
    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/[^0-9.]/g, '');
        if ((value.match(/\./g) || []).length > 1) return; // Only one decimal point
        setFormData({ ...formData, total: value });
    };

    const isFormValid = formData.total && formData.category && formData.place;

    const handleSubmit = () => {
        if (!isFormValid) return;
        onSubmit(formData);
    };

    return (
        <div className="flex flex-col h-full bg-neutral-950 p-6">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 -ml-2 text-neutral-400 hover:text-white">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-bold ml-2">Nueva Inversión</h2>
            </div>

            <div className="space-y-6 flex-1">
                {/* Amount */}
                <div className="space-y-2">
                    <label className="text-sm text-neutral-400">¿Cuánto invertiste?</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-neutral-500">$</span>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={formData.total}
                            onChange={handleAmountChange}
                            placeholder="0.00"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 pl-10 text-3xl font-bold text-white placeholder-neutral-700 focus:outline-none focus:ring-2 focus:ring-lime-500/50"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Goal Selector */}
                <div className="space-y-2">
                    <label className="text-sm text-neutral-400">Meta (Categoría)</label>
                    <div className="grid grid-cols-2 gap-2">
                        {INVESTMENT_GOALS.map((goal) => (
                            <button
                                key={goal.id}
                                onClick={() => setFormData({ ...formData, category: goal.label })}
                                className={`
                                    p-3 rounded-xl border text-sm font-medium transition-all text-left
                                    ${formData.category === goal.label
                                        ? 'bg-lime-500/20 border-lime-500 text-lime-400'
                                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'}
                                `}
                            >
                                {goal.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Place Selector */}
                <div className="space-y-2">
                    <label className="text-sm text-neutral-400">Lugar de Inversión</label>
                    <div className="flex flex-wrap gap-2">
                        {INVESTMENT_PLACES.map((place) => (
                            <button
                                key={place.id}
                                onClick={() => setFormData({ ...formData, place: place.label })}
                                className={`
                                    px-4 py-2 rounded-full border text-sm font-medium transition-all
                                    ${formData.place === place.label
                                        ? 'bg-lime-500/20 border-lime-500 text-lime-400'
                                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'}
                                `}
                            >
                                {place.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className={`
                    w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center border mt-4
                    ${!isFormValid || isSubmitting
                        ? 'bg-neutral-800 border-transparent text-neutral-500 cursor-not-allowed'
                        : 'bg-transparent border-lime-500 text-lime-400 shadow-lg shadow-lime-900/20'} 
                    transition-all duration-200
                `}
            >
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Registrar Inversión'}
            </motion.button>
        </div>
    );
}
