import React from 'react';

interface MetaRowProps {
    label: string;
    value: string;
    copy?: boolean;
}

export const MetaRow: React.FC<MetaRowProps> = ({ label, value, copy = false }) => (
    <div>
        <h4 className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{label}</h4>
        <p
            className={`text-sm font-mono text-white/80 ${copy ? 'break-all cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => {
                if (copy) {
                    navigator.clipboard.writeText(value);
                }
            }}
        >
            {value}
        </p>
    </div>
);
