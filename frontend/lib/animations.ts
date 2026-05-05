import { gsap } from "gsap";
import type { RefObject } from "react";

export function playDripEntrance(
    fullRef: RefObject<SVGGElement>,
    shadowRef: RefObject<SVGGElement>,
    bucketRef: RefObject<SVGGElement>,
    sunglassRef: RefObject<SVGGElement>,
    squeegeeRef: RefObject<SVGGElement>,
    bubbleRef: RefObject<HTMLDivElement>,
    buttonsRef: RefObject<HTMLDivElement>,
    onComplete?: () => void
) {
    const full     = fullRef.current;
    const shadow   = shadowRef.current;
    const bucket   = bucketRef.current;
    const sunglass = sunglassRef.current;
    const squeegee = squeegeeRef.current;
 
    if (!full || !shadow || !bucket || !sunglass || !squeegee) return;

    {/* Initial State */}
    gsap.set(full, {y: -1100})
    gsap.set(shadow, {scaleX: 0, scaleY: 0, transformOrigin: "403.72px 791.13px"})
    gsap.set(bucket, {svgOrigin: "196 660"})

    const tl = gsap.timeline({ onComplete });

    {/* Drip falls in */}
    tl.to(full, { y: 0, duration: 0.80, ease: "power3.in" }, 0);
 
    tl.to(shadow, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.80,
        ease: "power2.in",
        transformOrigin: "403.72px 791.13px"
    }, 0);

    {/* Squish landing */}
    tl.to(full, {
        scaleX: 1.4,
        scaleY: 0.4,
        transformOrigin: "403px 780px",
        duration: 0.15,
        ease: "power2.out",
    }, 0.80);
 
    tl.to(shadow, {
        scaleX: 1.18,
        scaleY: 0.75,
        duration: 0.15,
        ease: "power2.out",
        transformOrigin: "403.72px 791.13px",
    }, 0.80);

    {/* Unsquish */}
    tl.to(full, {
        scaleX: 0.9,
        scaleY: 1.2,
        duration: 0.20,
        ease: "power2.out",
    }, 0.95);
 
    tl.to(full, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.25,
        ease: "elastic.out(1, 0.5)",
    }, 1.15);
 
    tl.to(shadow, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.40,
        ease: "power2.out",
        transformOrigin: "403.72px 791.13px",
    }, 0.95);

    {/* Bucket Swing */}
    tl.to(bucket, {
        rotation: 18,
        duration: 0.28,
        ease: "power2.out",
    }, 1.0);
    tl.to(bucket, {
        rotation: -10,
        duration: 0.42,
        ease: "power1.inOut",
    }, 1.28);
    tl.to(bucket, {
        rotation: 8,
        duration: 0.36,
        ease: "power1.inOut",
    }, 1.70);
    tl.to(bucket, {
        rotation: -3,
        duration: 0.30,
        ease: "power1.inOut",
    }, 2.06);
    tl.to(bucket, {
        rotation: 0,
        duration: 0.40,
        ease: "power2.out",
    }, 2.36);

    {/* Sunglasses Pop */}
    tl.to(sunglass, {
        y: -22,
        duration: 0.14,
        ease: "power2.out",
    }, 1.0);
    tl.to(sunglass, {
        y: 0,
        duration: 0.65,
        ease: "elastic.out(1, 0.5)",
    }, 1.14);

    {/* Squeegee Pops */}
        tl.to(squeegee, {
        y: -40,
        duration: 0.16,
        ease: "power2.out",
    }, 1.0);
    tl.to(squeegee, {
        y: 0,
        duration: 0.65,
        ease: "elastic.out(1.2, 0.5)",
    }, 1.16);

    {/* UI elements */}
    tl.fromTo(bubbleRef.current, 
        { opacity: 0, x: -20 }, 
        { opacity: 1, x: 0, duration: 0.4 })

    tl.fromTo(buttonsRef.current,
        { opacity: 0, y: 10 }, 
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.1 })

    return tl;
}

export function startDripIdle(
    fullRef: RefObject<SVGGElement>,
    shadowRef: RefObject<SVGGElement>,
    bucketRef: RefObject<SVGGElement>,
) {
    const full = fullRef.current;
    const shadow = shadowRef.current;
    const bucket = bucketRef.current;
 
    if (!full || !shadow || !bucket) return;
 
    // Full mascot bobs up and down
    gsap.to(full, {
        y: -3,
        duration: 2.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
    });
 
    // Shadow breathes with the float
    gsap.to(shadow, {
        scaleX: 0.92,
        scaleY: 0.90,
        duration: 2.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        transformOrigin: "403.72px 791.13px",
    });
 
    // Bucket sways gently
    gsap.to(bucket, {
        rotation: 4,
        duration: 3.1,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
    });
}

export function stopDripIdle(
    fullRef:   RefObject<SVGGElement>,
    shadowRef: RefObject<SVGGElement>,
    bucketRef: RefObject<SVGGElement>,
) {
    gsap.killTweensOf([
        fullRef.current,
        shadowRef.current,
        bucketRef.current,
    ]);
}