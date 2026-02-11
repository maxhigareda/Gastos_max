import React, { useState, useEffect, useMemo } from 'react';
import { getExpenses, submitExpense, getConfigs, saveConfig } from '../services/api'; // Added Config imports
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, TrendingUp, Target, Wallet, Pencil, Save, X, Trash2, Check } from 'lucide-react';
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

    // SYNCED STATE (Previously localStorage)
    const [customGoals, setCustomGoals] = useState([]);
    const [hiddenGoals, setHiddenGoals] = useState([]);
    const [targetOverrides, setTargetOverrides] = useState({});

    const [showAddGoal, setShowAddGoal] = useState(false);
    const [newGoal, setNewGoal] = useState({ label: '', target: '' });

    const API_URL = localStorage.getItem('EXPENSE_API_URL') || '';

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        if (!API_URL) return;
        setLoading(true);
        try {
            // 1. Fetch Investments
            const investData = await getExpenses(API_URL, 'investment');
            setInvestments(investData);

            // 2. Fetch Config (Profiles, Hidden, Custom, etc.)
            const configData = await getConfigs(API_URL);
            processConfig(configData);

        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const processConfig = (data) => {
        if (!data || !Array.isArray(data)) return;

        // Reduce to find latest entry for each key
        // We assume the data comes sequentially or we trust the API to append.
        // We strictly want the LAST valid entry for each key.
        const latestConfig = {};

        data.forEach(item => {
            if (item.key && item.value) {
                latestConfig[item.key] = item.value;
            }
        });

        // Parse and Set State
        try {
            if (latestConfig['CUSTOM_INVESTMENT_GOALS']) {
                setCustomGoals(JSON.parse(latestConfig['CUSTOM_INVESTMENT_GOALS']));
            }
            if (latestConfig['HIDDEN_INVESTMENT_GOALS']) {
                setHiddenGoals(JSON.parse(latestConfig['HIDDEN_INVESTMENT_GOALS']));
            }
            if (latestConfig['INVESTMENT_TARGETS']) {
                setTargetOverrides(JSON.parse(latestConfig['INVESTMENT_TARGETS']));
            }
        } catch (e) {
            console.error("Error parsing config JSON", e);
        }
    };

    const handleAddInvestment = async (formData) => {
        setIsSubmitting(true);
        try {
            await submitExpense(formData, API_URL);
            await fetchData(); // Refetch to get updated numbers
            setShowForm(false);
        } catch (error) {
            alert("Error al guardar inversión: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // MERGED GOALS LIST
    const allGoals = useMemo(() => {
        const visibleDefaults = INVESTMENT_GOALS.filter(g => !hiddenGoals.includes(g.id) && !hiddenGoals.includes(g.label));
        return [...visibleDefaults, ...customGoals];
    }, [customGoals, hiddenGoals]);

    const handleEditStart = (goal) => {
        setEditingGoal(goal.id || goal.label);
        setTempTarget(goal.target.toString());
    };

    const handleEditSave = async (goal) => {
        const newTarget = parseFloat(tempTarget);
        if (isNaN(newTarget)) {
            alert("Número inválido");
            return;
        }

        // SAVE TO CLOUD
        try {
            if (goal.isCustom) {
                // Update custom goal list
                const updated = customGoals.map(g =>
                    g.id === goal.id ? { ...g, target: newTarget } : g
                );
                setCustomGoals(updated); // Optimistic update
                await saveConfig('CUSTOM_INVESTMENT_GOALS', updated, API_URL);
            } else {
                // It's a default goal or orphan, save override
                const updatedOverrides = { ...targetOverrides, [goal.label]: newTarget };
                setTargetOverrides(updatedOverrides); // Optimistic update
                await saveConfig('INVESTMENT_TARGETS', updatedOverrides, API_URL);
            }
        } catch (error) {
            alert("Error al guardar cambios configuración: " + error.message);
        }

        setEditingGoal(null);
    };

    const handleCreateGoal = async () => {
        if (!newGoal.label || !newGoal.target) return;

        const goalToAdd = {
            id: `custom_${Date.now()}`,
            label: newGoal.label,
            target: parseFloat(newGoal.target),
            isCustom: true
        };

        const updated = [...customGoals, goalToAdd];
        setCustomGoals(updated); // Optimistic
        setShowAddGoal(false);
        setNewGoal({ label: '', target: '' });

        try {
            await saveConfig('CUSTOM_INVESTMENT_GOALS', updated, API_URL);
        } catch (error) {
            alert("Error al sincronizar nueva meta: " + error.message);
        }
    };

    const handleDeleteGoal = async (goal) => {
        const id = goal.id || goal.label;
        if (!confirm(`¿${goal.isCustom ? 'Borrar' : 'Ocultar'} la meta "${goal.label}"?`)) return;

        try {
            // Common: Add to hidden list
            if (!hiddenGoals.includes(id)) {
                const updatedHidden = [...hiddenGoals, id];
                setHiddenGoals(updatedHidden);
                await saveConfig('HIDDEN_INVESTMENT_GOALS', updatedHidden, API_URL);
            }

            if (goal.isCustom) {
                const updatedCustom = customGoals.filter(g => g.id !== id);
                setCustomGoals(updatedCustom);
                await saveConfig('CUSTOM_INVESTMENT_GOALS', updatedCustom, API_URL);
            }
            // Reuse optimistic update effect
        } catch (error) {
            alert("Error al sincronizar borrado: " + error.message);
        }
    };

    const stats = useMemo(() => {
        let grandTotal = 0;
        const goalStats = {};

        // 1. Initialize ALL goals (Def + Custom)
        allGoals.forEach(g => {
            const key = g.label.toUpperCase();
            // Target priority: Override > Goal.target
            const effectiveTarget = targetOverrides[g.label] !== undefined ? targetOverrides[g.label] : g.target;

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
            if (hiddenGoals.includes(category) || hiddenGoals.includes(key)) {
                return;
            }

            if (goalStats[key]) {
                goalStats[key].current += amount;
            } else {
                // Orphaned investment (category deleted or renamed?)
                // Allow it to have a target if we set one via override!
                const effectiveTarget = targetOverrides[category] !== undefined ? targetOverrides[category] : 0;

                goalStats[key] = {
                    target: effectiveTarget,
                    current: amount,
                    label: category,
                    id: category, // Use name as ID for orphans
                    isOrphan: true
                };
            }
        });

        return { grandTotal, resultGoals: Object.values(goalStats) };
    }, [investments, allGoals, targetOverrides, hiddenGoals]);


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
                    availableGoals={stats.resultGoals}
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
            {loading ? (
                <div className="flex-1 flex items-center justify-center text-neutral-500 gap-2">
                    <Loader2 className="animate-spin" /> Cargando inversiones...
                </div>
            ) : (
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
                                            <div className={`text-xs font-bold px-2 py-1 rounded-full ${isCompleted ? 'bg-lime-500 text-black flex items-center gap-1' : 'bg-neutral-800 text-neutral-400'}`}>
                                                {isCompleted && <Check size={12} strokeWidth={3} />}
                                                {isCompleted ? 'Completada' : `${progress.toFixed(1)}%`}
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
            )}

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
