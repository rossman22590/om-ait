"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function KortixLogo() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // After mount, we can access the theme
  useEffect(() => {
    setMounted(true)
  }, [])
  
  return (
    <div className="flex h-6 w-6 items-center justify-center flex-shrink-0">
      {mounted && (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={theme === "dark" ? "text-white" : "text-primary"}
        >
          <path
            d="M20.82 11.42C20.82 15.5335 17.5135 18.84 13.4 18.84C9.28652 18.84 6 15.5335 6 11.42C6 7.30652 9.28652 4 13.4 4C17.5135 4 20.82 7.30652 20.82 11.42Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M13.48 4.42C10.2 7.7 13.48 11.4 13.48 11.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M13.4 4.42C16.68 7.7 13.4 11.4 13.4 11.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  )
}