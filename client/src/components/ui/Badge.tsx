import React from 'react';

interface BadgeProps {
    variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'blue' | 'purple';
    children: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '', icon }) => {
    const baseStyles = "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5 w-fit";

    const variants = {
        success: "bg-green-50 text-green-700 border-green-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger: "bg-red-50 text-red-700 border-red-200",
        neutral: "bg-slate-100 text-slate-600 border-slate-200",
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        purple: "bg-purple-50 text-purple-700 border-purple-200"
    };

    return (
        <span className={`${baseStyles} ${variants[variant]} ${className}`}>
            {icon}
            {children}
        </span>
    );
};

export default Badge;
