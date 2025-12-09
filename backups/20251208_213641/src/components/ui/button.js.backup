import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden", {
    variants: {
        variant: {
            default: "bg-white text-purple-600 hover:bg-white/90 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold backdrop-blur-sm",
            gradient: "bg-gradient-to-r from-white to-white/90 text-purple-600 hover:from-white hover:to-white shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 font-semibold border border-white/30",
            outline: "border-2 border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:border-white/50 hover:shadow-lg transform hover:scale-105 font-medium",
            ghost: "bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:shadow-lg transform hover:scale-105 border border-white/20 font-medium",
            quiz: "bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:border-white/50 hover:bg-white/20 hover:shadow-lg transition-all duration-300 font-medium hover:transform hover:scale-105",
            success: "bg-green-500/90 backdrop-blur-md text-white hover:bg-green-400 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 font-semibold border border-green-400/30",
            destructive: "bg-red-500/90 backdrop-blur-md text-white hover:bg-red-400 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 font-semibold border border-red-400/30",
            secondary: "bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border border-white/30 hover:border-white/50 hover:shadow-lg transform hover:scale-105 font-medium",
            glass: "bg-white/5 backdrop-blur-xl border border-white/20 text-white hover:bg-white/10 hover:border-white/30 hover:shadow-2xl transform hover:scale-105 font-medium",
            link: "text-white underline-offset-4 hover:underline hover:text-white/80 font-medium",
            premium: "bg-gradient-to-r from-purple-500/90 via-pink-500/90 to-purple-600/90 backdrop-blur-md text-white hover:from-purple-400 hover:via-pink-400 hover:to-purple-500 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 font-semibold border border-purple-400/30",
            glow: "bg-white text-purple-600 hover:bg-white/95 shadow-lg hover:shadow-white/25 hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 font-semibold before:absolute before:inset-0 before:rounded-md before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
        },
        size: {
            sm: "h-8 rounded-md px-3 text-xs",
            default: "h-10 px-4 py-2 text-sm",
            lg: "h-12 rounded-md px-6 text-base",
            xl: "h-14 rounded-lg px-8 text-lg",
            xxl: "h-16 rounded-xl px-10 text-xl",
            icon: "h-10 w-10",
            "icon-sm": "h-8 w-8 text-xs",
            "icon-lg": "h-12 w-12 text-base",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});
const Button = React.forwardRef(({ className, variant, size, asChild = false, loading, icon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (_jsxs(Comp, { className: cn(buttonVariants({ variant, size }), className), ref: ref, disabled: disabled || loading, ...props, children: [loading && (_jsx("div", { className: "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" })), !loading && icon && (_jsx("span", { className: "mr-2 flex-shrink-0", children: icon })), children, !loading && rightIcon && (_jsx("span", { className: "ml-2 flex-shrink-0", children: rightIcon }))] }));
});
Button.displayName = "Button";
// Enhanced button with ripple effect
const RippleButton = React.forwardRef(({ className, variant, size, children, onClick, ...props }, ref) => {
    const buttonRef = React.useRef(null);
    const createRipple = (event) => {
        const button = buttonRef.current;
        if (!button)
            return;
        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        const rect = button.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add("ripple");
        const ripple = button.getElementsByClassName("ripple")[0];
        if (ripple) {
            ripple.remove();
        }
        button.appendChild(circle);
        // Remove ripple after animation
        setTimeout(() => {
            circle.remove();
        }, 600);
        // Call original onClick
        if (onClick)
            onClick(event);
    };
    React.useImperativeHandle(ref, () => buttonRef.current);
    return (_jsxs("button", { ref: buttonRef, className: cn(buttonVariants({ variant, size }), "relative overflow-hidden", className), onClick: createRipple, ...props, children: [children, _jsx("style", { jsx: true, children: `
          .ripple {
            position: absolute;
            border-radius: 50%;
            transform: scale(0);
            animation: ripple-animation 600ms linear;
            background-color: rgba(255, 255, 255, 0.3);
            pointer-events: none;
          }
          
          @keyframes ripple-animation {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
        ` })] }));
});
RippleButton.displayName = "RippleButton";
// Floating Action Button
const FloatingButton = React.forwardRef(({ className, variant = "gradient", size = "icon-lg", ...props }, ref) => {
    return (_jsx(Button, { ref: ref, variant: variant, size: size, className: cn("fixed bottom-6 right-6 rounded-full shadow-2xl hover:shadow-white/20 z-50 animate-bounce-gentle", className), ...props }));
});
FloatingButton.displayName = "FloatingButton";
// Icon Button with enhanced styling
const IconButton = React.forwardRef(({ className, variant = "ghost", size = "icon", ...props }, ref) => {
    return (_jsx(Button, { ref: ref, variant: variant, size: size, className: cn("rounded-full", className), ...props }));
});
IconButton.displayName = "IconButton";
export { Button, RippleButton, FloatingButton, IconButton, buttonVariants };
// Export button variants for external use
export const buttonStyles = {
    primary: "bg-white text-purple-600 hover:bg-white/90 font-semibold",
    secondary: "bg-white/20 backdrop-blur-md text-white border border-white/30",
    success: "bg-green-500/90 text-white hover:bg-green-400 font-semibold",
    danger: "bg-red-500/90 text-white hover:bg-red-400 font-semibold",
    ghost: "bg-white/10 backdrop-blur-md text-white hover:bg-white/20",
    outline: "border-2 border-white/30 bg-white/10 text-white hover:bg-white/20",
};
