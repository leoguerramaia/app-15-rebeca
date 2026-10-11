export default function ResponsiveWrapper({ children }) {
  return (
    <div className="w-full min-h-screen bg-gray-50 flex justify-center overflow-x-hidden">
      {/* Container adaptável: px-4 (margem mobile), md:px-8 (margem tablet/desktop) */}
      <div className="w-full max-w-5xl px-4 sm:px-6 md:px-8 py-6 sm:py-10">
        {children}
      </div>
    </div>
  );
}