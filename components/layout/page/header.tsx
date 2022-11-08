import React from "react";

interface HeaderProps {
  heading: React.ReactNode;
}

export function Header({ heading }: HeaderProps) {
  return (
    <div className="py-8 lg:py-16 flex items-center px-6">
      <div className="text-center mx-auto inline-block">
        <h1 className="text-3xl lg:text-6xl leading-tight max-w-3xl font-bold tracking-tight mt-6 mx-auto">
          {heading}
        </h1>
      </div>
    </div>
  );
}
