import React, { useState, useEffect, useMemo } from 'react';
import { getExpenses, submitExpense } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, TrendingUp, Target, Wallet, Pencil, Save, X } from 'lucide-react';
import { INVESTMENT_GOALS } from '../constants/investments';
import InvestmentForm from './InvestmentForm';

export default function InvestmentView() {
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for editing goals
    const [editingGoal, setEditingGoal] = useState(null); // ID of goal being edited
    const [tempTarget, setTempTarget] = useState('');
    const [customTargets, setCustomTargets] = useState({});

    const API_URL = localStorage.getItem('EXPENSE_API_URL') || '';

    useEffect(() => {
        fetchData();
        // Load custom targets from local storage
        const savedTargets = localStorage.getItem('INVESTMENT_TARGETS');
        if (savedTargets) {
            setCustomTargets(JSON.parse(savedTargets));
        }
    }, []);

    const fetchData = async () => {
        if (!API_URL) return;
        setLoading(true);
        try {
            // Fetch investments specifically
            const data = await getExpenses(API_URL, 'investment');
            setInvestments(data);
        } catch (error) {
            console.error("Failed to fetch investments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddInvestment = async (formData) => {
        setIsSubmitting(true);
        try {
            await submitExpense(formData, API_URL);
            await fetchData(); // Refresh data
            setShowForm(false);
        } catch (error) {
            alert("Error al guardar inversión: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditStart = (goal) => {
        setEditingGoal(goal.id || goal.label); // Fallback to label if ID generic
        setTempTarget(goal.target.toString());
    };

    const handleEditSave = (goalLabel) => {
        const newTarget = parseFloat(tempTarget);
        if (isNaN(newTarget)) {
            alert("Por favor ingresa un número válido");
            return;
        }

        const newCustomTargets = { ...customTargets, [goalLabel]: newTarget };
        setCustomTargets(newCustomTargets);
        localStorage.setItem('INVESTMENT_TARGETS', JSON.stringify(newCustomTargets));
        setEditingGoal(null);
    };

    const stats = useMemo(() => {
        let grandTotal = 0;
        const goalStats = {};

        // 1. Initialize with predefined goals (and apply custom targets)
        INVESTMENT_GOALS.forEach(g => {
            // Use normalized key (uppercase label) to avoid duplicates if casing differs
            const key = g.label.toUpperCase();

            goalStats[key] = {
                target: customTargets[g.label] !== undefined ? customTargets[g.label] : g.target,
                current: 0,
                label: g.label,
                id: g.id
            };
        });

        // 2. Aggregate data
        investments.forEach(inv => {
            const amount = Number(inv.total) || 0;
            const category = (inv.category || '').trim(); // Remove whitespace
            const key = category.toUpperCase(); // Normalize for matching

            grandTotal += amount;

            if (goalStats[key]) {
                goalStats[key].current += amount;
            } else {
                // If a category exists in data but not in constants (e.g. custom/old)
                // Try to find if it exists with different casing in original map
                // If definitely new:
                goalStats[key] = {
                    target: customTargets[category] || 0, // Check if we have a custom target for this "new" thing
                    current: amount,
                    label: category,
                    id: category // fallback ID
                };
            }
        });

        return { grandTotal, resultGoals: Object.values(goalStats) };
    }, [investments, customTargets]);

    const Currency = ({ value, className = "" }) => (
        <span className={className}>
            ${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
    );

    if (showForm) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="h-full"
            >
                <InvestmentForm
                    onBack={() => setShowForm(false)}
                    onSubmit={handleAddInvestment}
                    isSubmitting={isSubmitting}
                />
            </motion.div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-lime-500" size={32} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-neutral-950 overflow-hidden relative">
            {/* Header / Grand Total */}
            <div className="p-6 bg-gradient-to-b from-lime-900/10 to-transparent">
                <div className="flex flex-col items-center">
                    <span className="text-lime-400 text-sm uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
                        <Wallet size={16} /> Total Invertido
                    </span>
                    <div className="text-4xl font-bold text-white">
                        <Currency value={stats.grandTotal} />
                    </div>
                </div>
            </div>

            {/* Content: Goals List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {stats.resultGoals.map((goal) => {
                    const isEditing = editingGoal === (goal.id || goal.label);
                    const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
                    const remaining = Math.max(0, goal.target - goal.current);
                    const isCompleted = goal.current >= goal.target && goal.target > 0;

                    return (
                        <motion.div
                            key={goal.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden"
                        >
                            {/* Background Progress Bar (Subtle) */}
                            <div
                                className="absolute bottom-0 left-0 h-1 bg-lime-500/20"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />

                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-white truncate max-w-[60%]">{goal.label}</h3>
                                {goal.target > 0 && (
                                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${isCompleted ? 'bg-lime-500 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                                        {progress.toFixed(1)}%
                                    </div>
                                )}
                            </div>

                            <div className="flex items-end justify-between mb-2">
                                <div className="flex flex-col">
                                    <span className="text-neutral-500 text-xs">Actual</span>
                                    <Currency value={goal.current} className="text-xl font-medium text-white" />
                                </div>

                                <div className="flex flex-col items-end">
                                    <span className="text-neutral-500 text-xs flex items-center gap-1">
                                        Meta
                                        {!isEditing && (
                                            <button onClick={() => handleEditStart(goal)} className="text-neutral-600 hover:text-white">
                                                <Pencil size={10} />
                                            </button>
                                        )}
                                    </span>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="number"
                                                value={tempTarget}
                                                onChange={(e) => setTempTarget(e.target.value)}
                                                className="w-24 bg-neutral-800 text-white text-right text-sm rounded p-1 border border-neutral-700 outline-none focus:border-lime-500"
                                                autoFocus
                                            />
                                            <button onClick={() => handleEditSave(goal.label)} className="text-lime-400 p-1 hover:bg-neutral-800 rounded">
                                                <Save size={14} />
                                            </button>
                                            <button onClick={() => setEditingGoal(null)} className="text-red-400 p-1 hover:bg-neutral-800 rounded">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <Currency value={goal.target} className="text-neutral-300" />
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar Visual */}
                            {goal.target > 0 && (
                                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden mt-2">
                                    <div
                                        className={`h-full ${isCompleted ? 'bg-lime-400' : 'bg-lime-600'}`}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>
                            )}

                            <div className="mt-2 text-right">
                                <span className="text-xs text-neutral-500">
                                    {remaining > 0 ? 'Faltan: ' : 'Excedente: '}
                                    <Currency value={remaining > 0 ? remaining : Math.abs(goal.current - goal.target)} className={remaining > 0 ? "text-neutral-400" : "text-lime-400"} />
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Floating Action Button */}
            <div className="absolute bottom-6 right-6">
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-lime-500 hover:bg-lime-400 text-black p-4 rounded-full shadow-lg shadow-lime-900/20 transition-all active:scale-95"
                >
                    <Plus size={32} />
                </button>
            </div>
        </div>
    );
}
