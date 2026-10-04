export default function OnboardingHeader() {
  return (
    <div className="relative w-full h-80 overflow-hidden rounded-t-xl bg-gradient-to-b from-green-600 to-green-500 flex items-center justify-center">
      {/* Logo Text */}
      <h1 className="text-white text-4xl font-semibold drop-shadow-md">
        EcoWaste
      </h1>

      {/* Curved Layers */}
      <div className="absolute bottom-0 left-0 w-full h-40 bg-[#f1f1f1] rounded-t-[100%] translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-full h-44 bg-[#e7e7e7] rounded-t-[100%] translate-y-[65%]" />
      <div className="absolute bottom-0 left-0 w-full h-48 bg-[#dcdcdc] rounded-t-[100%] translate-y-[80%]" />
    </div>
  );
}
