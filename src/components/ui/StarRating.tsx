"use client";
import { useState } from "react";
interface StarRatingProps { value: number; onChange?: (rating: number) => void; size?: "sm" | "md" | "lg"; readonly?: boolean; }
export function StarRating({ value, onChange, size = "md", readonly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const sizeClasses = { sm: "text-base", md: "text-xl", lg: "text-3xl" };
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((star) => (
        <button key={star} type="button" disabled={readonly} onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)} onMouseLeave={() => !readonly && setHovered(0)}
          className={`${sizeClasses[size]} transition-all ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}>
          <span className={star <= (hovered || value) ? "text-amber-400" : "text-gray-200"}>★</span>
        </button>
      ))}
    </div>
  );
}
