export default function InfoModal({ open, title, rows = [], onClose, footer }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4">
          <dl className="divide-y divide-gray-100">
            {rows.map(([label, value], i) => (
              <div key={i} className="grid grid-cols-3 gap-3 py-2.5 text-sm">
                <dt className="text-gray-500">{label}</dt>
                <dd className="col-span-2 font-medium text-gray-900 break-words">{value ?? "-"}</dd>
              </div>
            ))}
          </dl>
        </div>
        {footer && <div className="flex justify-end gap-2 border-t px-6 py-3">{footer}</div>}
      </div>
    </div>
  );
}
