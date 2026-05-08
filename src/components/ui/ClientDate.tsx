"use client";

import { useEffect, useState } from "react";

interface ClientDateProps {
  date: string | Date | number;
  options?: Intl.DateTimeFormatOptions;
  locale?: string;
  className?: string;
}

export function ClientDate({ date, options = { day: "numeric", month: "short" }, locale = "en-IN", className }: ClientDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    try {
      const d = new Date(date);
      setFormattedDate(d.toLocaleDateString(locale, options));
    } catch (e) {
      setFormattedDate("");
    }
  }, [date, options, locale]);

  if (!formattedDate) {
    return <span className={`opacity-0 ${className || ""}`}>—</span>;
  }

  return <span className={className}>{formattedDate}</span>;
}
