"use client";

import React from 'react';
import { Button } from '../ui/button';
import { useEffect, useRef } from 'react';
import DripSVG from './DripSVG';
import { playDripEntrance, startDripIdle, stopDripIdle } from '@/lib/animations';

interface DripIntroProps {
    onGetQuote: () => void;
    onLearnMore: () => void;
}

export default function DripIntro({
    onGetQuote,
    onLearnMore,
}: DripIntroProps) {
    const fullRef = useRef<SVGGElement>(null);
    const shadowRef = useRef<SVGGElement>(null);
    const bucketRef = useRef<SVGGElement>(null);
    const sunglassRef = useRef<SVGGElement>(null);
    const squeegeeRef = useRef<SVGGElement>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);

useEffect(() => {
    const tl = playDripEntrance( fullRef, shadowRef, bucketRef, sunglassRef, squeegeeRef, bubbleRef, buttonsRef, () => {
        startDripIdle(fullRef, shadowRef, bucketRef);

        return () => {
            tl?.kill();
            stopDripIdle(fullRef, shadowRef, bucketRef)
        }
    });
}, []);

    return (
        <div className="fixed inset-0 z-50 bg-brand-navy/95 flex items-center justify-center">
            <div className="flex items-center gap-0">
                <div className="w-50 h-50">
                <DripSVG fullRef={fullRef} shadowRef={shadowRef} bucketRef={bucketRef} sunglassRef={sunglassRef} squeegeeRef={squeegeeRef}/>
                </div>

                {/* Speech bubble */}
                <div ref={bubbleRef} className="opacity-0 flex items-center">

                    {/* Left-pointing tail */}
                    <svg width="12" height="24" viewBox="0 0 12 24" className="fill-white shrink-0">
                        <path d="M12 0 L0 12 L12 24 Z" />
                    </svg>

                    {/* Bubble body */}
                    <div className="bg-white text-brand-navy rounded-2xl shadow-lg px-6 py-4 max-w-sm">
                        <p className="text-lg font-medium mb-4">
                            Hi! I'm Drip, your custom apparel guide. Ready for a quick quote?
                        </p>
                        <div ref={buttonsRef} className="flex justify-center gap-3 opacity-0">
                            <Button
                                onClick={onGetQuote}
                                className="bg-brand-red px-6 py-2 text-white hover:bg-brand-red/80"
                            >
                                Get Quote
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={onLearnMore}
                                className="px-6 py-2 bg-brand-navy text-white hover:bg-brand-navy/80"
                            >
                                Learn More
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

