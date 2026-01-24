import React from 'react';
import { GROUPS } from '../constants/categories';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function TypeSelector({ groupId, onBack, onSelect }) {
    const group = GROUPS.find(g => g.id === groupId);

    if (!group) return null;

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center p-4 border-b border-white/10">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-white/10">
                    <ArrowLeft className="text-white" />
                </button>
                <h2 className="ml-2 text-xl font-bold text-white">{group.label}</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 overflow-y-auto pb-24">
                {group.types.map((type) => (
                    <motion.button
                        key={type}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelect(type)}
                        className="
              flex items-center justify-center p-4 min-h-[80px]
              bg-neutral-800 rounded-xl border border-white/5
              text-neutral-200 font-medium text-center leading-tight
              active:bg-neutral-700 active:border-white/20
            "
                    >
                        {type}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
