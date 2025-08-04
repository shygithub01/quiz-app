import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
const cardVariants = cva("relative rounded-lg transition-all duration-300 group", {
    variants: {
        variant: {
            default: "bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl hover:-translate-y-1",
            glass: "bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-white/10 hover:border-white/30 hover:shadow-white/10",
            solid: "bg-white border border-gray-200 shadow-sm hover:shadow-lg text-gray-900",
            floating: "bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:shadow-white/25 hover:-translate-y-2 hover:scale-[1.02]",
            interactive: "bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/15 hover:border-white/40 hover:shadow-2xl hover:-translate-y-1 cursor-pointer",
            minimal: "bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20",
            gradient: "bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-md border border-white/30 shadow-xl hover:from-white/25 hover:via-white/15 hover:to-white/10",
            success: "bg-green-500/20 backdrop-blur-md border border-green-400/30 shadow-lg hover:bg-green-500/30 hover:border-green-400/50",
            warning: "bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 shadow-lg hover:bg-yellow-500/30 hover:border-yellow-400/50",
            error: "bg-red-500/20 backdrop-blur-md border border-red-400/30 shadow-lg hover:bg-red-500/30 hover:border-red-400/50",
            premium: "bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-600/20 backdrop-blur-md border border-purple-400/30 shadow-xl hover:from-purple-500/30 hover:via-pink-500/30 hover:to-purple-600/30",
        },
        size: {
            sm: "p-4",
            default: "p-6",
            lg: "p-8",
            xl: "p-10",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});
const Card = React.forwardRef(({ className, variant, size, hover = true, glow = false, ...props }, ref) => (_jsx("div", { ref: ref, className: cn(cardVariants({ variant, size }), hover && "hover:shadow-xl hover:-translate-y-1", glow && "hover:shadow-white/20", "animate-fade-in", className), ...props })));
Card.displayName = "Card";
const CardHeader = React.forwardRef(({ className, centered = false, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("flex flex-col space-y-2 p-6 pb-4", centered && "text-center items-center", className), ...props })));
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef(({ className, level = 3, gradient = false, ...props }, ref) => {
    const Heading = `h${level}`;
    return (_jsx(Heading, { ref: ref, className: cn("font-semibold leading-none tracking-tight text-white", level === 1 && "text-4xl", level === 2 && "text-3xl", level === 3 && "text-2xl", level === 4 && "text-xl", level === 5 && "text-lg", level === 6 && "text-base", gradient && "bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent", className), ...props }));
});
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef(({ className, muted = true, ...props }, ref) => (_jsx("p", { ref: ref, className: cn("text-sm leading-relaxed", muted ? "text-white/70" : "text-white", className), ...props })));
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef(({ className, noPadding = false, ...props }, ref) => (_jsx("div", { ref: ref, className: cn(!noPadding && "p-6 pt-0", className), ...props })));
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef(({ className, justify = "start", ...props }, ref) => (_jsx("div", { ref: ref, className: cn("flex items-center p-6 pt-4 gap-3", justify === "start" && "justify-start", justify === "center" && "justify-center", justify === "end" && "justify-end", justify === "between" && "justify-between", justify === "around" && "justify-around", justify === "evenly" && "justify-evenly", className), ...props })));
CardFooter.displayName = "CardFooter";
// Enhanced Card Variants
const GlassCard = React.forwardRef(({ className, ...props }, ref) => (_jsx(Card, { ref: ref, variant: "glass", className: cn("backdrop-blur-xl", className), ...props })));
GlassCard.displayName = "GlassCard";
const FloatingCard = React.forwardRef(({ className, ...props }, ref) => (_jsx(Card, { ref: ref, variant: "floating", glow: true, className: cn("animate-float", className), ...props })));
FloatingCard.displayName = "FloatingCard";
const InteractiveCard = React.forwardRef(({ className, onClick, ...props }, ref) => (_jsx(Card, { ref: ref, variant: "interactive", className: cn("cursor-pointer group", "hover:shadow-2xl hover:shadow-white/20", "active:scale-[0.98] active:transition-transform active:duration-100", className), onClick: onClick, ...props })));
InteractiveCard.displayName = "InteractiveCard";
const MetricCard = React.forwardRef(({ className, icon, title, value, description, trend, trendValue, ...props }, ref) => (_jsx(Card, { ref: ref, variant: "glass", className: cn("p-6", className), ...props, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-white/70 text-sm font-medium", children: [icon, title] }), _jsx("div", { className: "text-3xl font-bold text-white", children: value }), description && (_jsx("p", { className: "text-sm text-white/60", children: description }))] }), trend && trendValue && (_jsxs("div", { className: cn("flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full", trend === "up" && "text-green-400 bg-green-500/20", trend === "down" && "text-red-400 bg-red-500/20", trend === "neutral" && "text-white/70 bg-white/10"), children: [trend === "up" && "↗", trend === "down" && "↘", trend === "neutral" && "→", trendValue] }))] }) })));
MetricCard.displayName = "MetricCard";
// Quiz specific card
const QuizCard = React.forwardRef(({ className, question, isSelected = false, isCorrect = false, isWrong = false, showAnswer = false, children, ...props }, ref) => (_jsxs(Card, { ref: ref, variant: showAnswer
        ? isCorrect
            ? "success"
            : isWrong
                ? "error"
                : "default"
        : isSelected
            ? "interactive"
            : "default", className: cn("cursor-pointer transition-all duration-300", isSelected && !showAnswer && "border-white/50 bg-white/15", showAnswer && isCorrect && "border-green-400/50", showAnswer && isWrong && "border-red-400/50", className), ...props, children: [question && (_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg font-medium text-white", children: question }) })), _jsx(CardContent, { children: children })] })));
QuizCard.displayName = "QuizCard";
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, GlassCard, FloatingCard, InteractiveCard, MetricCard, QuizCard, cardVariants };
// Export card styles for external use
export const cardStyles = {
    glass: "bg-white/10 backdrop-blur-md border border-white/20",
    solid: "bg-white border border-gray-200 text-gray-900",
    floating: "bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:-translate-y-2",
    gradient: "bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-md",
    minimal: "bg-white/5 backdrop-blur-sm border border-white/10",
};
