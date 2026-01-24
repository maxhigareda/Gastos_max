import React, { useState, useEffect } from 'react';
import { CARD_OPTIONS, DEFAULT_DESCRIPTIONS } from '../constants/categories'; // Import table
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function ExpenseForm({ group, type, onBack, onSubmit, isSubmitting }) {
    // Initial state with auto-filled description if available
    const [formData, setFormData] = useState({
        description: DEFAULT_DESCRIPTIONS[type] || '', // Auto-fill here
        total: '',
        card: CARD_OPTIONS[0]
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.total) return;

        onSubmit({
            ...formData,
            group: group.label,
            type: type,
            // Format date as dd/MM/yyyy
            date: new Date().toLocaleDateString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
        });
    };

    return (
        <div className="flex flex-col h-full relative">
            <div className="flex items-center p-4 border-b border-white/10">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-white/10" disabled={isSubmitting}>
                    <ArrowLeft className="text-white" />
                </button>
                <div className="ml-2">
                    <h2 className="text-sm text-neutral-400">{group.label} &gt; {type}</h2>
                    <h1 className="text-lg font-bold text-white">Detalles del Gasto</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">

                {/* Total Input */}
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Monto Total</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-white font-light">$</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            required
                            autoFocus
                            value={formData.total}
                            onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-10 pr-4 text-3xl font-bold text-white placeholder-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                </div>

                {/* Description Input */}
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Descripción</label>
                    <input
                        type="text"
                        placeholder="¿Qué compraste?"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        onFocus={(e) => e.target.select()} // Select all on focus for easy replacement
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-lg text-white placeholder-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                {/* Card Selector */}
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Tarjeta / Método de Pago</label>
                    <div className="grid grid-cols-2 gap-2">
                        {CARD_OPTIONS.map((card) => (
                            <button
                                key={card}
                                type="button"
                                onClick={() => setFormData({ ...formData, card })}
                                className={`
                  p-3 rounded-xl border text-sm font-medium transition-all
                  ${formData.card === card
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-750'}
                `}
                            >
                                {card}
                            </button>
                        ))}
                    </div>
                </div>
            </form>

            {/* Floating Submit Button */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.total}
                    className={`
            w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center border
            ${!formData.total || isSubmitting
                            ? 'bg-neutral-800 border-transparent text-neutral-500 cursor-not-allowed'
                            : 'bg-transparent border-white text-white shadow-lg shadow-white/5'} 
            transition-all duration-200
          `}
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Enviar Gasto'}
                </motion.button>
            </div>
        </div>
    );
}
