export default function ResponsiveWrapper({ children }) {
  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      {children}
    </div>
  );
}
