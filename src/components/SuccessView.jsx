import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function SuccessView({ onReset }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-neutral-900 border border-white/10 p-8 rounded-3xl flex flex-col items-center max-w-sm w-full"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="text-green-500 mb-4"
                >
                    <CheckCircle size={64} />
                </motion.div>

                <h2 className="text-2xl font-bold text-white mb-2">¡Registrado!</h2>
                <p className="text-neutral-400 text-center mb-6">El gasto se ha guardado correctamente.</p>

                <button
                    onClick={onReset}
                    className="w-full py-3 bg-white text-neutral-950 rounded-xl font-bold hover:bg-neutral-200 transition-colors"
                >
                    Nuevo Gasto
                </button>
            </motion.div>
        </div>
    );
}
