"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTypewriter } from "@/hooks/useTypewriter";
import { playDripEntrance, startDripIdle, fadeInButtons, stopDripIdle } from "@/lib/animations";
import { STEPS, LOCATION_OPTIONS, PRODUCT_BUTTONS, INTRO_BUTTONS, GARMENT_TONE_BUTTONS, getColorsMessage, getConfirmMessage, determinePrintType, type StepId, type QuoteData, type LocationColors } from "@/lib/drip-flow";
import { FILTER_OPTIONS, PRODUCT_RECOMMENDATIONS, getRecommendedProduct, getProductsByCategory } from "@/lib/products";
import { Button } from "../ui/button";
import DripSVG from "./DripSVG";
import { gsap } from "gsap";

export default function DripWidget() {
    const fullRef = useRef<SVGGElement>(null);
    const shadowRef = useRef<SVGGElement>(null);
    const bucketRef = useRef<SVGGElement>(null);
    const sunglassRef = useRef<SVGGElement>(null);
    const squeegeeRef = useRef<SVGGElement>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);

    const [currentStep, setCurrentStep] = useState<StepId>("intro");
    const [quoteData, setQuoteData] = useState<QuoteData>({});
    const [resultMessage, setResultMessage] = useState("");
    const [numberInput, setNumberInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [bubbleReady, setBubbleReady] = useState(false);

    const getStepMessage = (): string => {
        if (currentStep === "result") 
            return resultMessage;
        if (currentStep === "colors_per_location") {
            const index = quoteData.current_location_index ?? 0;
            const label = quoteData.location_labels?.[index] ?? "this location";
            return getColorsMessage(label);
        }
        if (currentStep === "product_confirm" && quoteData.product_name) 
            return getConfirmMessage(quoteData.product_name);

        return STEPS[currentStep].message;
    }

    const { displayed, done } = useTypewriter(bubbleReady ? getStepMessage() : "", 45);
    
    // Intro
    useEffect(() => {
        gsap.set(bubbleRef.current, { opacity: 0, x:-20});
        gsap.set(buttonsRef.current, { opacity: 0});

        const tl = playDripEntrance(fullRef, shadowRef, bucketRef, sunglassRef, squeegeeRef, () => {
            gsap.fromTo(bubbleRef.current,
                { opacity: 0, x: -20},
                { opacity: 1, x: 0, duration: 0.4, 
                    onComplete: () => setBubbleReady(true)
                }
            );
            startDripIdle(fullRef, shadowRef, bucketRef);
        });

        return () => {
            tl?.kill();
            stopDripIdle(fullRef, shadowRef, bucketRef)
        };
    }, []);

    useEffect(() => {
        if (done) fadeInButtons(buttonsRef);
    }, [done, currentStep])

    // Handler - Manage Flow
    const handleAnswer = (value: string) => {
        // INTRO
        if (currentStep === "intro") {
            if (value === "get_quote") setCurrentStep("product");
            else console.log("Learn more clicked");
            return;
        }

        // PRODUCT
        if (currentStep === "product") {
            setQuoteData(prev => ({...prev, category: value}));
            setCurrentStep("product_filter");
            return;
        }

        // PRODUCT FILTER
        if (currentStep === "product_filter") {
            const product = getRecommendedProduct(quoteData.category ?? "", value);
            setQuoteData(prev => ({
                ...prev, 
                filter: value,
                product_id: product?.id,
                product_name: product?.name,
            }));
            setCurrentStep("product_confirm");
            return;
        }

        // PRODUCT CONFIRM
        if (currentStep === "product_confirm") {
            if (value === 'yes') setCurrentStep('quantity');
            else setCurrentStep('product_list');
            return;
        }

        // PRODUCT LIST
        if (currentStep === "product_list") {
            const products = getProductsByCategory(quoteData.category ?? "");
            const product = products.find(p => p.id === value);
            setQuoteData(prev => ({
                ...prev,
                product_id: value,
                product_name: product?.name,
            }))
            setCurrentStep('quantity');
            return;
        }

        // QUANTITY
        if (currentStep === 'quantity') {
            setQuoteData(prev => ({...prev, quantity: parseInt(value)}));
            setCurrentStep("location");
            return;
        }

        // LOCATION
        if (currentStep === "location") {
            const category = quoteData.category ?? "tshirt";
            const options = LOCATION_OPTIONS[category] ?? [];
            const selectedValues = value.split(","); // value is comma-joined selections
            const selectedLabels = selectedValues.map(v => options.find(o => o.value === v)?.label ?? v);
        setQuoteData(prev => ({
            ...prev,
            selected_locations: selectedValues,
            location_labels: selectedLabels,
            colors_per_location: [],
            current_location_index: 0,
        }));
        setCurrentStep("colors_per_location");
        return;
        }

        // COLORS PER LOCATION 
        if (currentStep === "colors_per_location") {
            const index = quoteData.current_location_index ?? 0;
            const locations = quoteData.selected_locations ?? [];
            const labels = quoteData.location_labels ?? [];

            const colorsPerLoc = [...(quoteData.colors_per_location ?? []),
            { location: locations[index], label: labels[index], colors: parseInt(value) }];

        if (index + 1 < locations.length) {
            setQuoteData(prev => ({
                ...prev,
                colors_per_location: colorsPerLoc,
                current_location_index: index + 1,
            }));
            return;
        }

        const printType = determinePrintType(quoteData.category ?? "", colorsPerLoc);
        setQuoteData(prev => ({
            ...prev,
            colors_per_location: colorsPerLoc,
            print_type: printType,
        }));

        // skip for hats/emb
        if (quoteData.category === "hat") setCurrentStep("needed_by");

        // only dtg goes to garment tone step
        if (quoteData.print_type === "dtg") setCurrentStep("garment_tone");
        else setCurrentStep("needed_by");
        return;
    }

    // GARMENT TONE (dtg only)
    if (currentStep === "garment_tone") {
        setQuoteData(prev => ({ ...prev, garment_tone: value }));
        setCurrentStep("needed_by");
        return;
    }

    // NEEDED BY — save date, fire the API call
    if (currentStep === "needed_by") {
        const finalData = { ...quoteData, needed_by: value };
        setQuoteData(finalData);
        //fetchQuote(finalData);
        return;
    }

    // ERROR — start over
    if (currentStep === "error") {
        setQuoteData({});
        setCurrentStep("intro");
        return;
    }
    };

    // API Call
    const fetchQuote = async (data: QuoteData) => {
        setIsLoading(true);
        try {
             const endpoint = data.print_type === "dtg" ? "/api/quote/dtg" : 
             data.print_type === "embroidery" ? "/api/quote/embroidery" : 
             "/api/quote/screen-print";

        const response = await fetch(`http://localhost:8000${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                product_id: data.product_id,
                quantity: data.quantity,
                location_count: data.selected_locations?.length ?? 1,
                colors_per_location: data.colors_per_location,
                garment_tone: data.garment_tone,
                needed_by: data.needed_by,
            })
        });

        const result = await response.json();

        if (result.error) {
            setCurrentStep("error"); 
            return;
        }

        setResultMessage(`Here's your quote for ${result.product}!\n\nQuantity: ${result.quantity}\nCost per unit: $${result.cost_per_unit}\nTotal: $${result.total}`);
        setCurrentStep("result");

    } catch (err) {
        setCurrentStep("error");
    } finally {
        setIsLoading(false);
        }
    }


    return (
         <div className="fixed inset-0 z-50 bg-brand-navy/95 flex items-center justify-center">
            <div className="flex items-center gap-0">
                <div className="w-50 h-50">
                    <DripSVG fullRef={fullRef} shadowRef={shadowRef} bucketRef={bucketRef} sunglassRef={sunglassRef} squeegeeRef={squeegeeRef}/>
                </div>
        
                {/* Speech bubble */}
                <div ref={bubbleRef} className="flex items-center">
        
                {/* Left-pointing tail */}
                    <svg width="12" height="24" viewBox="0 0 12 24" className="fill-white shrink-0">
                        <path d="M12 0 L0 12 L12 24 Z" />
                    </svg>
        
                    {/* Bubble body */}
                    <div className="bg-white text-brand-navy rounded-2xl shadow-lg px-6 py-4 max-w-sm">
                        <p className="text-lg font-medium mb-4">{displayed}</p>
                            <div ref={buttonsRef} className="flex justify-center gap-3">
                                <Button
                                    onClick={() => handleAnswer("get_quote")}
                                    className="bg-brand-red px-6 py-2 text-white hover:bg-brand-red/80"
                                >
                                    Get Quote
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleAnswer("learn_more")}
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