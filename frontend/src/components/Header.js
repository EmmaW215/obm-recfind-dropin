'use client';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-[1050] shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
          RF
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight tracking-tight">RecFindOBM</h1>
          <p className="text-[11px] text-gray-400 leading-tight">Oakville Drop-in Programs</p>
        </div>
      </div>
      <div className="hidden sm:block text-xs text-gray-400">Apr 1–30, 2026</div>
    </header>
  );
}
