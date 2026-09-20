"use client";

export default function Modal({
  open,
  onClose,
  children,
  cardClassName = "max-w-md",
  ariaLabel = "Dialog",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  cardClassName?: string;
  ariaLabel?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white p-5 shadow-xl ${cardClassName}`}>
        {children}
      </div>
    </div>
  );
}