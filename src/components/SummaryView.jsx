import React, { useState, useEffect, useMemo } from 'react';
import { getExpenses } from '../services/api';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { GROUPS } from '../constants/categories';

export default function SummaryView({ onBack }) {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    // NOTE: In a real deploy, user would set this. For now we use a prompt or placeholder.
    const API_URL = localStorage.getItem('EXPENSE_API_URL') || '';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if (!API_URL) return;
        setLoading(true);
        try {
            const data = await getExpenses(API_URL);
            setExpenses(data);
        } catch (error) {
            console.error("Failed to fetch expenses", error);
        } finally {
            setLoading(false);
        }
    };

    const changeMonth = (delta) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    // Helper to get month key "YYYY-MM"
    const getMonthKey = (dateObj) => {
        return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    };

    const processedData = useMemo(() => {
        const currentMonthKey = getMonthKey(currentDate);

        // Calculate previous month date
        const prevDate = new Date(currentDate);
        prevDate.setMonth(prevDate.getMonth() - 1);
        const prevMonthKey = getMonthKey(prevDate);

        const currentStats = {}; // { Group: { total: 0, types: { Type: 0 } } }
        const prevStats = {};    // { Group: { total: 0, types: { Type: 0 } } }
        let totalCurrent = 0;

        expenses.forEach(exp => {
            // exp.date comes as string often from Sheets "2026-01-24T..."
            const expDate = new Date(exp.date);
            const key = getMonthKey(expDate);
            const amount = Number(exp.total) || 0;
            const groupName = exp.group;
            const typeName = exp.type;

            // Helper to aggregate
            const addToStats = (statsObj) => {
                if (!statsObj[groupName]) {
                    statsObj[groupName] = { total: 0, types: {} };
                }
                statsObj[groupName].total += amount;

                if (!statsObj[groupName].types[typeName]) {
                    statsObj[groupName].types[typeName] = 0;
                }
                statsObj[groupName].types[typeName] += amount;
            };

            if (key === currentMonthKey) {
                addToStats(currentStats);
                totalCurrent += amount;
            } else if (key === prevMonthKey) {
                addToStats(prevStats);
            }
        });

        // Structure for rendering: Array of Groups
        // We strive to respect the order of GROUPS constant if possible, or just keys
        const resultGroups = Object.keys(currentStats).map(gName => {
            // Find matches in previous month
            const currGroup = currentStats[gName];
            const prevGroup = prevStats[gName];
            const prevGroupTotal = prevGroup ? prevGroup.total : 0;

            const subcategories = Object.keys(currGroup.types).map(tName => {
                const currTypeTotal = currGroup.types[tName];
                const prevTypeTotal = prevGroup?.types[tName] || 0;

                let pctChange = 0;
                if (prevTypeTotal > 0) {
                    pctChange = ((currTypeTotal - prevTypeTotal) / prevTypeTotal) * 100;
                }

                return {
                    name: tName,
                    total: currTypeTotal,
                    prevTotal: prevTypeTotal,
                    pctChange: prevTypeTotal === 0 ? null : pctChange
                };
            });

            let groupPctChange = 0;
            if (prevGroupTotal > 0) {
                groupPctChange = ((currGroup.total - prevGroupTotal) / prevGroupTotal) * 100;
            }

            // Find color from constants if exists
            const constGroup = GROUPS.find(g => g.label === gName);
            // If not found (e.g. old data), fallback
            const colorClass = constGroup ? constGroup.color : 'text-neutral-300 bg-neutral-800 border-neutral-700';

            return {
                name: gName,
                total: currGroup.total,
                prevTotal: prevGroupTotal,
                pctChange: prevGroupTotal === 0 ? null : groupPctChange,
                itemColor: colorClass,
                types: subcategories
            };
        });

        return { totalCurrent, resultGroups };

    }, [expenses, currentDate]);

    const Currency = ({ value }) => (
        <span>${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    );

    const Percentage = ({ value }) => {
        if (value === null) return <span className="text-neutral-500 text-xs">--</span>;
        const isHigher = value > 0;
        const isLower = value < 0;

        // Logic: Higher spending (Red), Lower spending (Green)
        let color = "text-neutral-400";
        let Icon = Minus;
        if (isHigher) { color = "text-red-400"; Icon = TrendingUp; }
        if (isLower) { color = "text-emerald-400"; Icon = TrendingDown; }

        return (
            <div className={`flex items-center gap-1 text-xs font-bold ${color}`}>
                <Icon size={12} />
                {Math.abs(value).toFixed(0)}%
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-neutral-950 overflow-hidden">
            {/* Month Filter Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-neutral-950/80 backdrop-blur-md z-10">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-white/10 text-white">
                    <ChevronLeft />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-sm text-neutral-400 capitalize">
                        {currentDate.toLocaleDateString('es-MX', { year: 'numeric' })}
                    </span>
                    <span className="text-xl font-bold text-white capitalize">
                        {currentDate.toLocaleDateString('es-MX', { month: 'long' })}
                    </span>
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-white/10 text-white">
                    <ChevronRight />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Grand Total */}
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 text-center shadow-lg">
                    <h2 className="text-neutral-400 text-sm uppercase tracking-wider mb-1">Total Gastado</h2>
                    <div className="text-4xl font-bold text-white">
                        <Currency value={processedData.totalCurrent} />
                    </div>
                </div>

                {/* Groups List */}
                <div className="space-y-4 pb-20">
                    {processedData.resultGroups.length === 0 ? (
                        <div className="text-center text-neutral-500 py-10">
                            No hay gastos registrados en este mes.
                        </div>
                    ) : (
                        processedData.resultGroups.map(group => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={group.name}
                                className={`rounded-2xl border ${group.itemColor} bg-opacity-5 p-4`}
                            >
                                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                    <h3 className="text-lg font-bold text-white">{group.name}</h3>
                                    <div className="flex flex-col items-end">
                                        <span className="text-lg font-bold text-white"><Currency value={group.total} /></span>
                                        <Percentage value={group.pctChange} />
                                    </div>
                                </div>

                                {/* Subcategories */}
                                <div className="space-y-2">
                                    {group.types.map(type => (
                                        <div key={type.name} className="flex items-center justify-between text-sm">
                                            <span className="text-neutral-300">{type.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-white font-medium"><Currency value={type.total} /></span>
                                                <div className="w-12 flex justify-end">
                                                    <Percentage value={type.pctChange} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
