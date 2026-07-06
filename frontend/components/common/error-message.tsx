interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      className={`rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-600 font-medium ${className}`}
      role="alert"
    >
      {message}
    </div>
  );
}
