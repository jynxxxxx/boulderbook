import type { ReactNode } from "react"

type IconHoverEffectProps = {
  children: ReactNode,
  red?: boolean
  additionalClasses?: string;
}

export function IconHoverEffect({ children, red = false, additionalClasses = "", }: IconHoverEffectProps) {

  const colorClasses = red
    ? "outline-red-400 hover:bg-red-200 group-hover-bg-red-200 group-focus-visible:bg-red-200 focus-visible:bg-red-200"
    : "outline-gray-600 hover:bg-gray-400 group-hover-bg-gray-400 group-focus-visible:bg-gray-400 focus-visible:bg-gray-400";

  return (
    <div className={`rounded-full px-6 py-2 transition-colors duration-200 flex items-center gap-2 ${colorClasses} ${additionalClasses}`}>
      {children}
    </div>
  )
}