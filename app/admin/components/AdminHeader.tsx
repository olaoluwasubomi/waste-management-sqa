"use client";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  showButton?: boolean;
}

export default function AdminPageHeader({
  title,
  subtitle,
  buttonLabel,
  onButtonClick,
  showButton = true,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row lg:flex-row xl:flex-row md:items-center md:justify-between gap-4 mb-6">
      
      {/* Left */}
      <div>
        <h3 className="text-2xl md:text-3xl font-bold text-black">
          {title}
        </h3>
        {subtitle && (
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right */}
      {showButton && buttonLabel && (
        <button
          onClick={onButtonClick}
          className="
            bg-green-600 hover:bg-green-700
            text-white font-medium
            px-4 py-2 rounded-lg
            shadow-md transition
            text-sm md:text-base
          "
        >
          + {buttonLabel}
        </button>
      )}
    </div>
  );
}
