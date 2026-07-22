type LoadingStateProps = {
  message?: string;
  className?: string;
};

export function LoadingState({
  message = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={`flex min-h-[240px] items-center justify-center ${className ?? ""}`}
    >
      <div className="flex items-center gap-3">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-hidden="true"
        />
        <p className="text-sm text-muted">{message}</p>
      </div>
    </div>
  );
}
