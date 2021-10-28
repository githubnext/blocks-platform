import * as TooltipPrimitive from "@radix-ui/react-tooltip"

export const Tooltip = ({ children, side = "top", text, className = "", ...props }: {
  children: React.ReactNode,
  side: "top" | "bottom" | "left" | "right",
  text: string,
  className?: string,
}) => {

  return (
    <TooltipPrimitive.Root delayDuration={0}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content side={side} sideOffset={6} className={`relative bg-indigo-600 text-white p-3 py-1 rounded-lg shadow-lg text-sm ${className}`} {...props}>
        {text}
        <TooltipPrimitive.Arrow className="border-indigo-600" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Root>
  )
}