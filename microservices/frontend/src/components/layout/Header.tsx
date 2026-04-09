export function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-gray-800">Drink Water Management</h2>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">v1.0.0</span>
      </div>
    </header>
  );
}
