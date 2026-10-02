import { AlertCircle } from "lucide-react";

export function TimetableFormErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {errors.map((error) => (
        <div key={error} className="flex gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ))}
    </div>
  );
}

export function TimetableFieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <div className="mt-1 text-xs text-red-600">{error}</div>;
}

export function timetableInputClassName(error?: string): string {
  const baseClassName =
    "mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2";
  return error
    ? `${baseClassName} border-red-500 focus:border-red-500 focus:ring-red-500/20`
    : `${baseClassName} border-gray-200 focus:border-primary focus:ring-primary/20`;
}
