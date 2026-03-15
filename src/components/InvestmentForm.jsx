import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, ChevronLeft, Plus, Pencil, X } from 'lucide-react';
import { INVESTMENT_PLACES } from '../constants/investments';

export default function InvestmentForm({ onBack, onSubmit, isSubmitting, availableGoals = [] }) {
    const [formData, setFormData] = useState({
        total: '',
        category: '', // Goal
        place: '',
        date: new Date().toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric' // Changed format to work with standard fields
        }),
        sheetType: 'investment' // Critical for backend to distinguish
    });

    const [customPlaces, setCustomPlaces] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('CUSTOM_INVESTMENT_PLACES') || '[]');
        } catch {
            return [];
        }
    });

    const [isEditingPlaces, setIsEditingPlaces] = useState(false);
    const [isAddingPlace, setIsAddingPlace] = useState(false);
    const [newPlaceName, setNewPlaceName] = useState('');

    useEffect(() => {
        localStorage.setItem('CUSTOM_INVESTMENT_PLACES', JSON.stringify(customPlaces));
    }, [customPlaces]);

    const allPlaces = [...INVESTMENT_PLACES, ...customPlaces];

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

    const handleAddPlace = () => {
        if (newPlaceName.trim()) {
            const newPlace = { id: `custom_${Date.now()}`, label: newPlaceName.trim() };
            setCustomPlaces([...customPlaces, newPlace]);
            setFormData({ ...formData, place: newPlace.label });
            setNewPlaceName('');
            setIsAddingPlace(false);
        }
    };

    const handleDeletePlace = (id, e) => {
        e.stopPropagation();
        const placeToDelete = customPlaces.find(p => p.id === id);
        setCustomPlaces(customPlaces.filter(p => p.id !== id));
        if (formData.place === placeToDelete?.label) {
            setFormData({ ...formData, place: '' });
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-950 p-6">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-bold ml-2">Nueva Inversión</h2>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pb-4">
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
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 pl-10 text-3xl font-bold text-white placeholder-neutral-700 focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Goal Selector */}
                <div className="space-y-2">
                    <label className="text-sm text-neutral-400">Meta (Categoría)</label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                        {availableGoals.map((goal) => (
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
                <div className="space-y-3 pt-2 border-t border-neutral-800/50">
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-neutral-400">Lugar de Inversión</label>
                        {customPlaces.length > 0 && !isAddingPlace && (
                            <button 
                                onClick={() => setIsEditingPlaces(!isEditingPlaces)}
                                className={`p-1.5 rounded-lg transition-colors flex items-center justify-center
                                    ${isEditingPlaces 
                                        ? 'bg-neutral-800 text-white' 
                                        : 'text-neutral-500 hover:text-white hover:bg-neutral-900'}`}
                                aria-label="Editar lugares personalizados"
                            >
                                <Pencil size={14} />
                            </button>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {allPlaces.map((place) => {
                            const isCustom = place.id.startsWith('custom_');
                            const isSelected = formData.place === place.label;
                            
                            return (
                                <div key={place.id} className="relative group">
                                    <button
                                        onClick={() => {
                                            if (!isEditingPlaces) setFormData({ ...formData, place: place.label });
                                        }}
                                        disabled={isEditingPlaces && !isCustom}
                                        className={`
                                            px-4 py-2 rounded-full border text-sm font-medium transition-all flex items-center justify-center
                                            ${isSelected && !isEditingPlaces
                                                ? 'bg-lime-500/20 border-lime-500 text-lime-400'
                                                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'}
                                            ${isEditingPlaces && !isCustom ? 'opacity-30 cursor-not-allowed border-transparent' : ''}
                                            ${isEditingPlaces && isCustom ? 'border-red-500/50 bg-red-500/10 text-red-200 pl-3 pr-2' : ''}
                                        `}
                                    >
                                        <span className={isEditingPlaces && isCustom ? 'mr-1' : ''}>{place.label}</span>
                                        
                                        {isEditingPlaces && isCustom && (
                                            <div 
                                                onClick={(e) => handleDeletePlace(place.id, e)}
                                                className="ml-1 -mr-1 p-1 rounded-full text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                                            >
                                                <X size={14} />
                                            </div>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                        
                        {!isEditingPlaces && !isAddingPlace && (
                            <button
                                onClick={() => setIsAddingPlace(true)}
                                className="px-4 py-2 rounded-full border border-dashed border-neutral-700 bg-neutral-900/40 text-neutral-400 hover:border-neutral-500 hover:text-white text-sm font-medium transition-all flex items-center gap-1.5"
                            >
                                <Plus size={14} /> Nuevo
                            </button>
                        )}
                    </div>
                    
                    <AnimatePresence>
                        {isAddingPlace && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="flex items-center gap-2 overflow-hidden"
                            >
                                <input
                                    type="text"
                                    value={newPlaceName}
                                    onChange={(e) => setNewPlaceName(e.target.value)}
                                    placeholder="Nombre del lugar..."
                                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-lime-500 transition-colors"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddPlace();
                                        if (e.key === 'Escape') setIsAddingPlace(false);
                                    }}
                                />
                                <button 
                                    onClick={handleAddPlace}
                                    disabled={!newPlaceName.trim()}
                                    className="p-2.5 bg-lime-500 text-black rounded-xl disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-500 transition-all hover:bg-lime-400"
                                >
                                    <Check size={18} />
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsAddingPlace(false);
                                        setNewPlaceName('');
                                    }}
                                    className="p-2.5 bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white rounded-xl transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Submit Button */}
            <motion.button
                whileTap={(!isFormValid || isSubmitting || isEditingPlaces) ? {} : { scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting || isEditingPlaces}
                className={`
                    w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center border mt-4 shrink-0
                    ${(!isFormValid || isSubmitting || isEditingPlaces)
                        ? 'bg-neutral-800 border-transparent text-neutral-500 cursor-not-allowed'
                        : 'bg-transparent border-lime-500 text-lime-400 shadow-lg shadow-lime-900/20 hover:bg-lime-500/10'} 
                    transition-all duration-200
                `}
            >
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Registrar Inversión'}
            </motion.button>
        </div>
    );
}
