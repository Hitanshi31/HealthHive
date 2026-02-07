import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    isLoading?: boolean;
}

// Let's refine the Button component to be safer functionality-wise
const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    isLoading = false,
    disabled,
    ...props
}) => {
    const baseStyles = "font-bold rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100";

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg shadow-blue-200 focus:ring-blue-500",
        secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm focus:ring-slate-300",
        danger: "bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 focus:ring-red-500", // Matches "danger" style in existing code commonly used
        dangerSolid: "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200 focus:ring-red-500",
        outline: "bg-transparent border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600 focus:ring-blue-500",
        ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:ring-slate-300"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-5 py-2.5 text-sm", // Matching the "px-5 py-2.5" seen in ProfileDashboard
        lg: "px-6 py-3.5 text-base"
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
        <button
            className={`${baseStyles} ${variants[variant === 'danger' ? 'danger' : variant]} ${sizes[size]} ${widthClass} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
            {children}
        </button>
    );
};

export default Button;
