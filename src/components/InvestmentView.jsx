import React, { useState, useEffect, useMemo } from 'react';
import { getExpenses, submitExpense } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, TrendingUp, Target, Wallet, Pencil, Save, X, Trash2 } from 'lucide-react';
import { INVESTMENT_GOALS } from '../constants/investments';
import InvestmentForm from './InvestmentForm';

export default function InvestmentView() {
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for editing goals
    const [editingGoal, setEditingGoal] = useState(null); // ID/Label of goal being edited
    const [tempTarget, setTempTarget] = useState('');

    // Custom Goals Management
    const [customGoals, setCustomGoals] = useState([]); // Array of { id, label, target, isCustom: true }
    const [showAddGoal, setShowAddGoal] = useState(false);
    const [newGoal, setNewGoal] = useState({ label: '', target: '' });

    const API_URL = localStorage.getItem('EXPENSE_API_URL') || '';

    useEffect(() => {
        fetchData();
        // Load custom goals from local storage
        const savedGoals = localStorage.getItem('CUSTOM_INVESTMENT_GOALS');
        if (savedGoals) {
            setCustomGoals(JSON.parse(savedGoals));
        }
    }, []);

    const fetchData = async () => {
        if (!API_URL) return;
        setLoading(true);
        try {
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
            await fetchData();
            setShowForm(false);
        } catch (error) {
            alert("Error al guardar inversión: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // MERGED GOALS LIST
    const allGoals = useMemo(() => {
        // Base goals + Custom goals
        // But we need to check if user "edited" a base goal target, typically we might store that separately
        // For simplicity in this iteration:
        // We will just use the list. The edits to "Targets" (previous feature) 
        // will be migrated to just updating the goal object in customGoals if it's there
        // or storing overrides. 

        // Actually, let's keep it simple: 
        // 1. Defaults are defaults.
        // 2. Custom are custom.
        // 3. Edits to targets affect the specific object.

        // We reuse the LocalStorage matching from before but enhanced.
        // If we edit a DEFAULT goal, we need to persist that override.
        // Let's store "Goal Overrides" separately or promote defaults to custom?
        // Let's stick to the previous pattern of "CustomTargets" valid for defaults, 
        // and "CustomGoals" for completely new ones.

        const hidden = JSON.parse(localStorage.getItem('HIDDEN_INVESTMENT_GOALS') || '[]');
        const visibleDefaults = INVESTMENT_GOALS.filter(g => !hidden.includes(g.id) && !hidden.includes(g.label));
        return [...visibleDefaults, ...customGoals];
    }, [customGoals]);

    // PREVIOUS EDIT LOGIC (Modified to support both types)
    const handleEditStart = (goal) => {
        setEditingGoal(goal.id || goal.label);
        setTempTarget(goal.target.toString());
    };

    const handleEditSave = (goal) => {
        const newTarget = parseFloat(tempTarget);
        if (isNaN(newTarget)) {
            alert("Número inválido");
            return;
        }

        if (goal.isCustom) {
            // Update custom goal list
            const updated = customGoals.map(g =>
                g.id === goal.id ? { ...g, target: newTarget } : g
            );
            setCustomGoals(updated);
            localStorage.setItem('CUSTOM_INVESTMENT_GOALS', JSON.stringify(updated));
        } else {
            // It's a default goal, save override
            // We can reuse the CUSTOM_INVESTMENT_GOALS to create a "shadow" copy or separate key
            // For simplicity, let's add it to customGoals with same ID effectively "shadowing" it? 
            // Or better, let's just use the previous "INVESTMENT_TARGETS" logic for overrides
            // But user wants a UNIFIED model now.

            // Let's simpler: Store overrides in a separate map like before
            const overrides = JSON.parse(localStorage.getItem('INVESTMENT_TARGETS') || '{}');
            overrides[goal.label] = newTarget;
            localStorage.setItem('INVESTMENT_TARGETS', JSON.stringify(overrides));
            // Trigger re-render (hacky but works if we depend on it in stats)
            // Ideally we lift state up, but here we can just update a dummy state or reload
            window.location.reload(); // Simplest for this quick iteration to refresh Constants access
        }
        setEditingGoal(null);
    };

    const handleCreateGoal = () => {
        if (!newGoal.label || !newGoal.target) return;

        const goalToAdd = {
            id: `custom_${Date.now()}`,
            label: newGoal.label,
            target: parseFloat(newGoal.target),
            isCustom: true
        };

        const updated = [...customGoals, goalToAdd];
        setCustomGoals(updated);
        localStorage.setItem('CUSTOM_INVESTMENT_GOALS', JSON.stringify(updated));
        setNewGoal({ label: '', target: '' });
        setShowAddGoal(false);
    };

    const handleDeleteGoal = (goal) => {
        const id = goal.id || goal.label;
        if (!confirm(`¿${goal.isCustom ? 'Borrar' : 'Ocultar'} la meta "${goal.label}"?`)) return;

        // Common: Add to hidden list to prevent "Zombie" resurrection from historical data
        const hidden = JSON.parse(localStorage.getItem('HIDDEN_INVESTMENT_GOALS') || '[]');
        if (!hidden.includes(id)) {
            const updatedHidden = [...hidden, id];
            localStorage.setItem('HIDDEN_INVESTMENT_GOALS', JSON.stringify(updatedHidden));
        }

        if (goal.isCustom) {
            const updated = customGoals.filter(g => g.id !== id);
            setCustomGoals(updated);
            localStorage.setItem('CUSTOM_INVESTMENT_GOALS', JSON.stringify(updated));
        } else {
            window.location.reload(); // Quick refresh to apply filter
        }
    };

    const stats = useMemo(() => {
        let grandTotal = 0;
        const goalStats = {};

        // Load overrides and hidden
        const overrides = JSON.parse(localStorage.getItem('INVESTMENT_TARGETS') || '{}');
        const hidden = JSON.parse(localStorage.getItem('HIDDEN_INVESTMENT_GOALS') || '[]');

        // 1. Initialize ALL goals (Def + Custom)
        allGoals.forEach(g => {
            const key = g.label.toUpperCase();
            // Target priority: Override > Goal.target
            const effectiveTarget = overrides[g.label] !== undefined ? overrides[g.label] : g.target;

            goalStats[key] = {
                target: effectiveTarget,
                current: 0,
                label: g.label,
                id: g.id,
                isCustom: !!g.isCustom
            };
        });

        // 2. Aggregate data
        investments.forEach(inv => {
            const amount = Number(inv.total) || 0;
            const category = (inv.category || '').trim();
            const key = category.toUpperCase();

            grandTotal += amount;

            // CHECK HIDDEN: If the category label or ID matches something hidden, SKIP IT from the list
            // We check against the raw category name since orphans won't have an ID
            if (hidden.includes(category) || hidden.includes(key)) {
                return;
            }

            if (goalStats[key]) {
                goalStats[key].current += amount;
            } else {
                // Orphaned investment (category deleted or renamed?)
                // Only show if NOT hidden
                goalStats[key] = {
                    target: 0,
                    current: amount,
                    label: category,
                    id: category, // Use name as ID for orphans
                    isOrphan: true
                };
            }
        });

        return { grandTotal, resultGoals: Object.values(goalStats) };
    }, [investments, allGoals]);


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
                    availableGoals={allGoals}
                    onBack={() => setShowForm(false)}
                    onSubmit={handleAddInvestment}
                    isSubmitting={isSubmitting}
                />
            </motion.div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-neutral-950 overflow-hidden relative">
            {/* Header / Grand Total */}
            <div className="p-6 bg-gradient-to-b from-lime-900/10 to-transparent flex justify-between items-start">
                <div className="flex-1 flex flex-col items-center">
                    <span className="text-lime-400 text-sm uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
                        <Wallet size={16} /> Total Invertido
                    </span>
                    <div className="text-4xl font-bold text-white">
                        <Currency value={stats.grandTotal} />
                    </div>
                </div>
                {/* Add Goal Button Small */}
                <button onClick={() => setShowAddGoal(true)} className="p-2 bg-neutral-800 rounded-full text-lime-400 hover:bg-neutral-700">
                    <Plus size={20} />
                </button>
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
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden group"
                        >
                            {/* Background Progress */}
                            <div
                                className="absolute bottom-0 left-0 h-1 bg-lime-500/20"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />

                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-white truncate max-w-[60%]">{goal.label}</h3>
                                <div className="flex items-center gap-2">
                                    {goal.target > 0 && (
                                        <div className={`text-xs font-bold px-2 py-1 rounded-full ${isCompleted ? 'bg-lime-500 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                                            {progress.toFixed(1)}%
                                        </div>
                                    )}
                                    <button onClick={() => handleDeleteGoal(goal)} className="text-neutral-600 hover:text-red-400 p-1">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
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
                                            <button onClick={() => handleEditSave(goal)} className="text-lime-400 p-1 hover:bg-neutral-800 rounded">
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

                            {/* Bar */}
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

            {/* Add Goal Modal */}
            <AnimatePresence>
                {showAddGoal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50"
                    >
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-xs">
                            <h3 className="text-lg font-bold text-white mb-4">Nueva Meta</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-neutral-400">Nombre de la Meta</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Viaje a Japón"
                                        value={newGoal.label}
                                        onChange={e => setNewGoal({ ...newGoal, label: e.target.value })}
                                        className="w-full bg-neutral-800 rounded p-2 text-white border border-neutral-700 focus:border-lime-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-neutral-400">Monto Objetivo ($)</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={newGoal.target}
                                        onChange={e => setNewGoal({ ...newGoal, target: e.target.value })}
                                        className="w-full bg-neutral-800 rounded p-2 text-white border border-neutral-700 focus:border-lime-500 outline-none"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => setShowAddGoal(false)}
                                        className="flex-1 py-2 rounded text-neutral-400 hover:bg-neutral-800"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreateGoal}
                                        className="flex-1 py-2 bg-lime-500 text-black rounded font-bold hover:bg-lime-400"
                                    >
                                        Crear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
