"use client";

import { useId, useState } from "react";

type PasswordFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function PasswordField({
  label,
  id,
  className,
  ...inputProps
}: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>

      <div className="relative">
        <input
          {...inputProps}
          id={inputId}
          type={isVisible ? "text" : "password"}
          className={className}
        />

        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          className="absolute inset-y-0 right-0 flex items-center gap-1 px-4 text-sm font-medium text-slate-500 transition hover:text-primary focus:outline-none focus:text-primary"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isVisible ? "visibility_off" : "visibility"}
          </span>
          <span>{isVisible ? "Hide password" : "Show password"}</span>
        </button>
      </div>
    </div>
  );
}
