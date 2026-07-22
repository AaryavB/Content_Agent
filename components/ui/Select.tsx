import { cn } from "@/lib/cn";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> & {
  options: SelectOption[];
  placeholder?: string;
};

export function Select({
  className,
  options,
  placeholder,
  value,
  ...props
}: SelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        className={cn(
          "focus-ring h-11 w-full cursor-pointer appearance-none rounded-[12px] border border-border bg-surface px-3.5 pr-10 text-sm text-foreground transition-colors hover:border-subtle/60",
          "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted",
          !value && "text-subtle",
          className,
        )}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-subtle"
        aria-hidden="true"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
