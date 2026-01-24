import React from 'react';
import { GROUPS } from '../constants/categories'; // Adjust path if needed
import { motion } from 'framer-motion';

export default function GroupSelector({ onSelect }) {
    return (
        <div className="grid grid-cols-2 gap-4 p-4">
            {GROUPS.map((group) => {
                const Icon = group.icon;
                return (
                    <motion.button
                        key={group.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelect(group.id)}
                        className={`
              flex flex-col items-center justify-center 
              p-6 rounded-2xl border
              ${group.color}
              hover:opacity-80
              transition-all duration-200
            `}
                    >
                        <div className={`p-3 rounded-full bg-white/10 mb-3`}>
                            <Icon size={32} className="text-current" />
                        </div>
                        <span className="text-lg font-medium text-current">{group.label}</span>
                    </motion.button>
                );
            })}
        </div>
    );
}
