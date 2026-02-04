import React, { useState, useEffect, useMemo } from 'react';
import { getExpenses, submitExpense } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, TrendingUp, Target, Wallet } from 'lucide-react';
import { INVESTMENT_GOALS } from '../constants/investments';
import InvestmentForm from './InvestmentForm';

export default function InvestmentView() {
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_URL = localStorage.getItem('EXPENSE_API_URL') || '';

    useEffect(() => {
        fetchData();
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

    const stats = useMemo(() => {
        let grandTotal = 0;
        const goalStats = {};

        // Initialize with predefined goals
        INVESTMENT_GOALS.forEach(g => {
            goalStats[g.label] = {
                target: g.target,
                current: 0,
                label: g.label
            };
        });

        investments.forEach(inv => {
            const amount = Number(inv.total) || 0;
            const category = inv.category;

            grandTotal += amount;

            if (goalStats[category]) {
                goalStats[category].current += amount;
            } else {
                // If a category exists in data but not in constants (e.g. custom/old)
                goalStats[category] = {
                    target: 0, // No target known
                    current: amount,
                    label: category
                };
            }
        });

        return { grandTotal, resultGoals: Object.values(goalStats) };
    }, [investments]);

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
                                <h3 className="text-lg font-bold text-white">{goal.label}</h3>
                                <div className={`text-xs font-bold px-2 py-1 rounded-full ${isCompleted ? 'bg-lime-500 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                                    {progress.toFixed(1)}%
                                </div>
                            </div>

                            <div className="flex items-end justify-between mb-2">
                                <div className="flex flex-col">
                                    <span className="text-neutral-500 text-xs">Actual</span>
                                    <Currency value={goal.current} className="text-xl font-medium text-white" />
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-neutral-500 text-xs">Meta</span>
                                    <Currency value={goal.target} className="text-neutral-300" />
                                </div>
                            </div>

                            {/* Progress Bar Visual */}
                            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden mt-2">
                                <div
                                    className={`h-full ${isCompleted ? 'bg-lime-400' : 'bg-lime-600'}`}
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </div>

                            <div className="mt-2 text-right">
                                <span className="text-xs text-neutral-500">
                                    Faltan: <Currency value={remaining} className="text-neutral-400" />
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
