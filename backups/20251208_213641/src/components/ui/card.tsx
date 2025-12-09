import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "relative rounded-lg transition-all duration-300 group",
  {
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
        
        ghost: "bg-transparent border border-transparent hover:bg-white/5 hover:border-white/10",
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
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  hover?: boolean
  glow?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover = true, glow = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, size }),
        hover && "hover:shadow-xl hover:-translate-y-1",
        glow && "hover:shadow-white/20",
        "animate-fade-in",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { centered?: boolean }
>(({ className, centered = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-2 p-6 pb-4",
      centered && "text-center items-center",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { 
    level?: 1 | 2 | 3 | 4 | 5 | 6
    gradient?: boolean
  }
>(({ className, level = 3, gradient = false, ...props }, ref) => {
  const baseClasses = cn(
    "font-semibold leading-none tracking-tight text-white",
    level === 1 && "text-4xl",
    level === 2 && "text-3xl", 
    level === 3 && "text-2xl",
    level === 4 && "text-xl",
    level === 5 && "text-lg",
    level === 6 && "text-base",
    gradient && "bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent",
    className
  );
  
  switch (level) {
    case 1:
      return <h1 ref={ref} className={baseClasses} {...props} />;
    case 2:
      return <h2 ref={ref} className={baseClasses} {...props} />;
    case 3:
      return <h3 ref={ref} className={baseClasses} {...props} />;
    case 4:
      return <h4 ref={ref} className={baseClasses} {...props} />;
    case 5:
      return <h5 ref={ref} className={baseClasses} {...props} />;
    case 6:
      return <h6 ref={ref} className={baseClasses} {...props} />;
    default:
      return <h3 ref={ref} className={baseClasses} {...props} />;
  }
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { muted?: boolean }
>(({ className, muted = true, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm leading-relaxed",
      muted ? "text-white/70" : "text-white",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { noPadding?: boolean }
>(({ className, noPadding = false, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      !noPadding && "p-6 pt-0",
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
  }
>(({ className, justify = "start", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-4 gap-3",
      justify === "start" && "justify-start",
      justify === "center" && "justify-center",
      justify === "end" && "justify-end",
      justify === "between" && "justify-between",
      justify === "around" && "justify-around",
      justify === "evenly" && "justify-evenly",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Enhanced Card Variants
const GlassCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <Card
      ref={ref}
      variant="glass"
      className={cn("backdrop-blur-xl", className)}
      {...props}
    />
  )
)
GlassCard.displayName = "GlassCard"

const FloatingCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <Card
      ref={ref}
      variant="floating"
      glow={true}
      className={cn("animate-float", className)}
      {...props}
    />
  )
)
FloatingCard.displayName = "FloatingCard"

const InteractiveCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, onClick, ...props }, ref) => (
    <Card
      ref={ref}
      variant="interactive"
      className={cn(
        "cursor-pointer group",
        "hover:shadow-2xl hover:shadow-white/20",
        "active:scale-[0.98] active:transition-transform active:duration-100",
        className
      )}
      onClick={onClick}
      {...props}
    />
  )
)
InteractiveCard.displayName = "InteractiveCard"

const MetricCard = React.forwardRef<
  HTMLDivElement,
  CardProps & {
    icon?: React.ReactNode
    title: string
    value: string | number
    description?: string
    trend?: "up" | "down" | "neutral"
    trendValue?: string
  }
>(({ className, icon, title, value, description, trend, trendValue, ...props }, ref) => (
  <Card
    ref={ref}
    variant="glass"
    className={cn("p-6", className)}
    {...props}
  >
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
          {icon}
          {title}
        </div>
        <div className="text-3xl font-bold text-white">
          {value}
        </div>
        {description && (
          <p className="text-sm text-white/60">
            {description}
          </p>
        )}
      </div>
      {trend && trendValue && (
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
          trend === "up" && "text-green-400 bg-green-500/20",
          trend === "down" && "text-red-400 bg-red-500/20",
          trend === "neutral" && "text-white/70 bg-white/10"
        )}>
          {trend === "up" && "↗"}
          {trend === "down" && "↘"}
          {trend === "neutral" && "→"}
          {trendValue}
        </div>
      )}
    </div>
  </Card>
))
MetricCard.displayName = "MetricCard"

// Quiz specific card
const QuizCard = React.forwardRef<
  HTMLDivElement,
  CardProps & {
    question?: string
    isSelected?: boolean
    isCorrect?: boolean
    isWrong?: boolean
    showAnswer?: boolean
  }
>(({ 
  className, 
  question, 
  isSelected = false, 
  isCorrect = false, 
  isWrong = false, 
  showAnswer = false, 
  children, 
  ...props 
}, ref) => (
  <Card
    ref={ref}
    variant={
      showAnswer 
        ? isCorrect 
          ? "success" 
          : isWrong 
            ? "error" 
            : "default"
        : isSelected 
          ? "interactive" 
          : "default"
    }
    className={cn(
      "cursor-pointer transition-all duration-300",
      isSelected && !showAnswer && "border-white/50 bg-white/15",
      showAnswer && isCorrect && "border-green-400/50",
      showAnswer && isWrong && "border-red-400/50",
      className
    )}
    {...props}
  >
    {question && (
      <CardHeader>
        <CardTitle className="text-lg font-medium text-white">
          {question}
        </CardTitle>
      </CardHeader>
    )}
    <CardContent>
      {children}
    </CardContent>
  </Card>
))
QuizCard.displayName = "QuizCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  GlassCard,
  FloatingCard,
  InteractiveCard,
  MetricCard,
  QuizCard,
  cardVariants
}

// Export card styles for external use
export const cardStyles = {
  glass: "bg-white/10 backdrop-blur-md border border-white/20",
  solid: "bg-white border border-gray-200 text-gray-900",
  floating: "bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:-translate-y-2",
  gradient: "bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-md",
  minimal: "bg-white/5 backdrop-blur-sm border border-white/10",
}
