import { gsap } from "gsap";
import type { RefObject } from "react";

export function playDripEntrance(
    avatarRef: RefObject<HTMLImageElement>,
    bubbleRef: RefObject<HTMLDivElement>,
    buttonsRef: RefObject<HTMLDivElement>,
    onComplete?: () => void
) {
    const tl = gsap.timeline({ onComplete });

    {/* Drip falls in */}
    tl.fromTo(avatarRef.current, 
        { y: -400, opacity: 0, scaleY: 1 }, 
        { y: 0, opacity: 1, scaleY: 1, duration: .80})

    {/* Squish landing */}
    tl.to(avatarRef.current, { scaleY: 0.4, scaleX: 1.4, duration: 0.15, ease: "power2.out"})

    {/* Unsquish */}
    tl.to(avatarRef.current, { scaleY: 1.2, scaleX: 0.9, duration: 0.2, ease: "power2.out" })
    tl.to(avatarRef.current, { scaleY: 1, scaleX: 1, duration: 0.25, ease: "elastic.out(1, 0.5"})

    tl.fromTo(bubbleRef.current, 
        { opacity: 0, x: -20 }, 
        { opacity: 1, x: 0, duration: 0.4 })

    tl.fromTo(buttonsRef.current,
        { opacity: 0, y: 10 }, 
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.1 })

    return tl;
}

export function startDripIdle(avatarRef: RefObject<HTMLImageElement>) {
    if (!avatarRef.current) return;
    gsap.to(avatarRef.current, {
        y: -10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"    
    })
}