"use client";  

import React, { forwardRef } from 'react';

type DripAvatarProps = {
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
};

const sizeMap: Record<NonNullable<DripAvatarProps["size"]>, string> = {
    sm: "w-16 h-16",    //chat panel avatar
    md: "w-24 h-24",    //chat header
    lg: "w-40 h-40",    //intro panel
    xl: "w-56 h-56",    //center screen entrance
};

const DripAvatar = forwardRef<HTMLImageElement, DripAvatarProps>(
    ({ size = "md", className = "" }, ref) => {
        return (
            <img 
                ref={ref}
                src="/drip/drip.svg"
                alt="Drip Avatar"
                className={`${sizeMap[size]} ${className}`}
            />
        )
    })

DripAvatar.displayName = "DripAvatar";

export default DripAvatar;