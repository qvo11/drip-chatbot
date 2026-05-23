"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTypewriter } from "@/hooks/useTypewriter";
import { playDripEntrance, startDripIdle, fadeInButtons, stopDripIdle } from "@/lib/animations";
import { STEPS, LOCATION_OPTIONS, PRODUCT_BUTTONS, INTRO_BUTTONS, GARMENT_TONE_BUTTONS, getColorsMessage, 
    getConfirmMessage, determinePrintType, type StepId, type QuoteData } from "@/lib/drip-flow";
import { FILTER_OPTIONS, getRecommendedProduct, getProductsByCategory, products, getDTGCompatible } from "@/lib/products";
import { Button } from "../ui/button";
import DripSVG from "./DripSVG";
import { gsap } from "gsap";
import DripFAQ from "./DripFAQ";


export default function DripWidget() {
    const fullRef = useRef<SVGGElement>(null);
    const shadowRef = useRef<SVGGElement>(null);
    const bucketRef = useRef<SVGGElement>(null);
    const sunglassRef = useRef<SVGGElement>(null);
    const squeegeeRef = useRef<SVGGElement>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);
    const errorMessageRef = useRef("")

    const [showFAQ, setShowFAQ] = useState(false);
    const [currentStep, setCurrentStep] = useState<StepId>("intro");
    const [quoteData, setQuoteData] = useState<QuoteData>({});
    const [resultMessage, setResultMessage] = useState("");
    const [numberInput, setNumberInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [bubbleReady, setBubbleReady] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [warningsMessage, setWarningsMessage] = useState("");
    const [errorReturnStep, setErrorReturnStep] = useState<StepId>("needed_by");
    const [dtgIncompatibleSource, setDtgIncompatibleSource] = useState<"quantity_upgrade" | "colors_per_location">("quantity_upgrade");

    const getStepMessage = (): string => {
        if (currentStep === "result" || currentStep === "error")
            return resultMessage;
        if (currentStep === "warnings")
            return warningsMessage;
        if (currentStep === "colors_per_location") {
            const index = quoteData.current_location_index ?? 0;
            const label = quoteData.location_labels?.[index] ?? "this location";
            return getColorsMessage(label);
        }
        if (currentStep === "product_confirm" && quoteData.product_name) 
            return getConfirmMessage(quoteData.product_name);

        return STEPS[currentStep].message;
    }

    const { displayed, done } = useTypewriter(bubbleReady ? getStepMessage() : "", 35);
    
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

    useEffect (() => {
        gsap.set(buttonsRef.current, {opacity: 0, y: 8})
        setNumberInput(""); // clears input
        setSelectedDate("");
    }, [currentStep])

    useEffect(() => {
        if (done) fadeInButtons(buttonsRef);
    }, [done])

    // Handler - Manage Flow
    const handleAnswer = (value: string) => {
        // INTRO
        if (currentStep === "intro") {
            if (value === "get_quote") setCurrentStep("product");
            else setShowFAQ(true);
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
            const products = getProductsByCategory(quoteData.category ?? "Unkown Product");
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
            const qty = parseInt(value);
            if (qty < 20) {
                setQuoteData(prev => ({...prev, quantity: qty}));
                setCurrentStep("quantity_upgrade");
                return;
            }
            setQuoteData(prev => ({...prev, quantity: parseInt(value)}));
            setCurrentStep("location");
            return;
        }

        //  QUANTITY UPGRADE
        if (currentStep === "quantity_upgrade") {
            if (value === "dtg") {
                const product = products.find(p => p.id === quoteData.product_id);
                const supportsDTG = product?.print_compatibility.includes("dtg");

                if (!supportsDTG) {
                    setDtgIncompatibleSource("quantity_upgrade");
                    setCurrentStep('dtg_incompatible');
                    return
                }

                setQuoteData(prev => ({...prev, print_type: "dtg"}));
                setCurrentStep("location");
            } else {
                setCurrentStep("quantity");
            }
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
            print_type: category === "hat" ? "embroidery" : prev.print_type,
        }));
        setCurrentStep(quoteData.category === 'hat' ? "needed_by" : "colors_per_location");
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
            setNumberInput("");
            setQuoteData(prev => ({
                ...prev,
                colors_per_location: colorsPerLoc,
                current_location_index: index + 1,
            }));
            return;
        }

        const printType = determinePrintType(quoteData.category ?? "", colorsPerLoc);

        if (printType === "dtg") {
            const product = products.find(p => p.id === quoteData.product_id);
            const supportsDTG = product?.print_compatibility.includes("dtg");

            if (!supportsDTG) {
                setDtgIncompatibleSource("colors_per_location");
                setCurrentStep("dtg_incompatible");
                return;
            }
        }
        setQuoteData(prev => ({
            ...prev,
            colors_per_location: colorsPerLoc,
            print_type: printType,
        }));

        // only dtg goes to garment tone step
        if (printType === "dtg") setCurrentStep("garment_tone");
        else setCurrentStep("needed_by");
        return;
    }

    // DTG INCOMPATIBLE
    if (currentStep === "dtg_incompatible") {
        if (value === "change_product") {
            setCurrentStep("dtg_product_list");
            return;
        }
        
        if (value === "change_colors") {
            if (dtgIncompatibleSource === "quantity_upgrade") {
                // path 1 - go back to quantity input
                setCurrentStep("quantity_upgrade");
            } else {
            // path 2 - reset colors and go back
            setQuoteData(prev => ({
                ...prev,
                colors_per_location: [],
                current_location_index: 0,
            }));
            setCurrentStep("colors_per_location");
        }
        return;
        }
    }

    // DTG PRODUCT LIST
    if (currentStep === "dtg_product_list") {
    const product = products.find(p => p.id === value);
    setQuoteData(prev => ({
        ...prev,
        product_id: value,
        product_name: product?.name,
        colors_per_location: [],
        current_location_index: 0,
    }));

    if (dtgIncompatibleSource === "quantity_upgrade") {
        //path 1 - product changed, proceed w/ dtg
        setQuoteData(prev => ({ ...prev, print_type: "dtg" }));
        setCurrentStep("location");
    } else {
        //path 2 - product changed, re-enter colors
        setCurrentStep("colors_per_location");
    }
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
        fetchQuote(finalData);
        return;
    }

    // ERROR — start over
    if (currentStep === "error") {
        errorMessageRef.current = "";
        if (errorReturnStep === "product") {
            resetAll();
        } else if (errorReturnStep === "quantity") {
            setQuoteData(prev => ({
                category: prev.category, 
                product_id: prev.product_id,
                product_name: prev.product_name
            }));
        } else if (errorReturnStep === "colors_per_location") {
            setQuoteData(prev => ({
            category: prev.category,
            product_id: prev.product_id,
            product_name: prev.product_name,
            quantity: prev.quantity,
            selected_locations: prev.selected_locations,
            location_labels: prev.location_labels,
            colors_per_location: [],
            current_location_index: 0,
            }));
        }
        setCurrentStep(errorReturnStep);
        return;
    }
    };

    const resetAll = () => {
        setCurrentStep("product");
        setQuoteData({});
        setResultMessage("");
        setNumberInput("");
        setSelectedDate("");
        setWarningsMessage("");
        setIsLoading(false);
        setErrorReturnStep("needed_by");
        setDtgIncompatibleSource("quantity_upgrade");
    };

    // API Call
    const fetchQuote = async (data: QuoteData) => {
        console.log("API URL:", process.env.NEXT_PUBLIC_API_URL); // debugging
        console.log("API KEY set:", !!process.env.NEXT_PUBLIC_API_KEY); // debugging
        setIsLoading(true);
        try {
            const SIZE_MAP: Record<string, string> = {
                "Front": "10x10",
                "Back": "12x14",
                "Left Chest": "5x5",
                "Right Chest": "5x5",
                "Left Sleeve": "5x5",
                "Right Sleeve": "5x5",
            };

            let endpoint = '';
            let body = {};

            if (data.print_type === 'screen_print') {
            endpoint = '/api/quote/screen-print';
            body = {
                product_id: data.product_id,
                quantity: data.quantity,
                num_colors: data.colors_per_location?.[0]?.colors ?? 1,
                additional_locations: (data.selected_locations?.length?? 1) - 1,
                needed_by: data.needed_by,
            };
            } else if (data.print_type === 'dtg') {
            endpoint = '/api/quote/dtg';
            body = {
                product_id: data.product_id,
                quantity: data.quantity,
                garment_tone: data.garment_tone,
                locations: (data.colors_per_location ?? []).map(l => ({
                    size: SIZE_MAP[l.label] ?? "10x10",
                    label: l.label,
                })),
                needed_by: data.needed_by,
            };
            } else if (data.print_type === "embroidery") {
                endpoint = "/api/quote/embroidery";
                body = {
                product_id: data.product_id,
                quantity: data.quantity,
                };
            } else if (data.print_type === "embroidery") {
                endpoint = "/api/quote/embroidery";
                body = {
                    product_id: data.product_id,
                    quantity: data.quantity,
            };
            } else {
            setCurrentStep("error");
            return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
                method: 'POST',
                headers: {"Content-Type": "application/json", "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "",},
                body: JSON.stringify(body),
            });

            const result = await response.json();
            console.log("API result:", result); // debugging 

            // handle emb response 
            if (data.print_type === "embroidery") {
                const nextSteps = (result.next_steps as string[])
                    .map((step: string, i: number) => `${i + 1}. ${step}`)
                    .join("\n");
                setResultMessage(`${result.message}\n\nNext steps:\n${nextSteps}`);
                setCurrentStep("result");
                setIsLoading(false);
                return;
            }

            // request succeeded but logic failed (soft error)
            if (result.error) {
                setResultMessage(result.error);
                const errorMsg = result.error.toLowerCase();
                let returnStep: StepId = "needed_by";

                if (errorMsg.includes("quantity") || errorMsg.includes("minimum")) {
                    returnStep = 'quantity';
                } else if (
                    errorMsg.includes("support") || 
                    errorMsg.includes("compatibility") || 
                    errorMsg.includes("not found") ||
                    errorMsg.includes("dtg") ||
                    errorMsg.includes("screen") ||
                    errorMsg.includes("does not")
                ) {
                    returnStep = "product";
                } else if (errorMsg.includes("color")) {
                    returnStep = "colors_per_location";
                } else if (errorMsg.includes("date") || errorMsg.includes("parse")) {
                    returnStep = "needed_by";
                }

                setErrorReturnStep(returnStep);
                setCurrentStep('error');
                return;
            }

            const locationSummary = (data.colors_per_location ?? [])
                .map(l => `${l.label}: ${l.colors} color${l.colors > 1 ? "s" : ""}`)
                .join(", ");

            const quoteText = `Here's your quote for ${data.quantity} ${data.product_name}(s)!\n\n` +
                `Print: ${data.print_type?.replace("_", " ").toUpperCase()}\n` +
                `Locations: ${locationSummary}\n\n` +
                `Cost per unit: $${Number(result.cost_per_unit).toFixed(2)}\n` +
                `Order total:   $${Number(result.order_total).toFixed(2)}\n` +
                (result.rush_fee > 0 ? `Rush fee:      $${Number(result.rush_fee).toFixed(2)}\n` : "") +
                `Final total:   $${Number(result.final_total).toFixed(2)}`;

            setResultMessage(quoteText);

            if (result.warnings?.length) {
                setWarningsMessage(`Heads up: ${result.warnings.join(" ")}`);
                setCurrentStep("warnings");
            } else {
                setCurrentStep("result");
            }

        } catch (err) {
            console.error("Quote fetch failed:", err);
            setResultMessage("Something went wrong connecting to the server. Please try again.");
            setErrorReturnStep("needed_by");
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
                    <div className="bg-white text-brand-navy rounded-2xl shadow-xl px-6 py-5 w-96 min-h-[160px] flex flex-col items-center">
                        {showFAQ ? (
                            <DripFAQ onClose={() => setShowFAQ(false)} />
                        ) : (
                        <>
                        <p className="text-lg text-center font-medium whitespace-pre-line mb-4">{displayed}</p>

                        {isLoading && (
                            <p className="text-sm text-brand-teal animate-pulse">
                                Calculating your quote<span className="animate-wiggle">...</span>
                            </p>
                        )}

                        {/*Buttons*/}
                        <div ref={bubbleRef}>
                        {done && currentStep === "intro" && (
                            <div className="flex justify-center gap-3">
                                {INTRO_BUTTONS.map(btn => (
                                    <Button
                                    key={btn.value}
                                    onClick={() => handleAnswer(btn.value)}
                                    >
                                    {btn.label}
                                    </Button>
                                ))}
                            </div>
                        )}

                        {done && currentStep === "product" && (
                            <div className="flex justify-center gap-3">
                                {PRODUCT_BUTTONS.map(btn => (
                                    <Button
                                    key={btn.value}
                                    onClick={() => handleAnswer(btn.value)}
                                    >
                                        {btn.label}
                                    </Button>
                                ))}
                            </div>
                        )}
                        {done && currentStep === "product_filter" && (
                            <div className="grid gap-1 grid-cols-2">
                            {FILTER_OPTIONS.map(btn => (
                                <Button
                                key={btn.value}
                                onClick={() => handleAnswer(btn.value)}
                                className="px-10 py-2"
                                >
                                    {btn.label}
                                </Button>
                            ))}
                            </div>
                        )}

                        {done && currentStep === "product_confirm" && (
                            <div className="flex flex-col justify-center gap-2">
                            <Button
                            onClick={() => handleAnswer('yes')}
                            className="primary px-6 py-2 text-white hover:bg-brand-teal"
                            >
                                Yes, let&apos;s go!
                            </Button>
                            <Button
                            onClick={() => handleAnswer('no')}
                            className="primary px-6 py-2 text-white hover:bg-brand-teal"
                            >
                                No, show me other options.
                            </Button>
                            </div>
                        )}

                        {done && currentStep === "garment_tone" && (
                            <div className="flex justify-center gap-3">
                            {GARMENT_TONE_BUTTONS.map(btn => (
                                <Button
                                key={btn.value}
                                onClick={() => handleAnswer(btn.value)}
                                className="primary px-6 py-2 text-white hover:bg-brand-teal"
                                >
                                    {btn.label}
                                </Button>
                            ))}
                            </div>
                        )}

                        {done && currentStep === "product_list" && (
                            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                            {getProductsByCategory(quoteData.category ?? "").map((p) => (
                                <button key={p.id} onClick={() => handleAnswer(p.id)}
                                className="flex flex-col items-start text-left px-4 py-3 rounded-xl border-2 border-brand-navy hover:border-brand-teal transition-colors bg-white w-full">
                                <span className="font-semibold text-sm text-brand-red">{p.name}</span>
                                <span className="text-xs text-brand-navy mt-0.5">{p.description}</span>
                                </button>
                            ))}
                            </div>
                        )}

                        {done && currentStep === "dtg_incompatible" && (
                            <div className="flex flex-col gap-2 w-full">
                                <Button onClick={() => handleAnswer("change_product")}
                                    className="bg-brand-navy text-white hover:bg-brand-teal">
                                    Show me DTG-compatible products
                                </Button>
                                <Button onClick={() => handleAnswer("change_colors")}
                                    className="bg-brand-navy text-white hover:bg-brand-teal">
                                    {dtgIncompatibleSource === "quantity_upgrade" ? "Increase quantity to meet screen print minimum (20)" : "Re-enter colors (7 or less)"}
                                </Button>
                            </div>
                        )}

                        {done && currentStep === "dtg_product_list" && (
                            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto w-full pr-1">
                                {getDTGCompatible(quoteData.category ?? "").map((p) => (
                                    <button key={p.id} onClick={() => handleAnswer(p.id)}
                                        className="flex flex-col items-start text-left px-4 py-3 rounded-xl border-2 border-brand-navy hover:border-brand-teal transition-colors bg-white w-full">
                                        <span className="font-semibold text-sm text-brand-red">{p.name}</span>
                                        <span className="text-xs text-brand-navy mt-0.5">{p.description}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {done && currentStep === "quantity" && (
                            <div className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    min={1}
                                    value={numberInput}
                                    onChange={(num) => setNumberInput(num.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && numberInput.trim()) handleAnswer(numberInput); }}
                                    placeholder="Enter quantity..."
                                    className="border-2 border-brand-navy/20 rounded-xl px-4 py-2 text-brand-navy text-sm focus:outline-none focus:border-brand-red"
                                />
                                <Button onClick={() => { if (numberInput.trim()) handleAnswer(numberInput); }}>
                                    OK
                                </Button>
                            </div>
                        )}

                        {done && currentStep === "quantity_upgrade" && (
                            <div className="flex flex-col gap-2">
                                <Button
                                    onClick={() => handleAnswer("dtg")}
                                    className="primary px-6 py-2 text-white hover:bg-brand-teal"
                                >
                                    DTG it is!
                                </Button>
                                <Button
                                    onClick={() => handleAnswer("increase")}
                                    className="primary px-6 py-2 text-white hover:bg-brand-teall"
                                >
                                    Increase order amount
                                </Button>
                            </div>
                        )}

                        {done && currentStep === "location" && (
                            <div className="flex flex-col gap-2">
                                {(LOCATION_OPTIONS[quoteData.category ?? ""] ?? []).map((opt) => (
                            <button key={opt.value} onClick={() => {
                                const current = quoteData.selected_locations ?? [];
                                const isSelected = current.includes(opt.value);
                                const updated = isSelected ? current.filter(v => v !== opt.value) // deselect
                                : [...current, opt.value]; // select
                                setQuoteData(prev => ({ ...prev, selected_locations: updated }));
                                }}
                            className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-colors
                            ${(quoteData.selected_locations ?? []).includes(opt.value)
                                ? "bg-brand-red text-white border-brand-red"
                                : "bg-white text-brand-navy border-brand-navy/20 hover:border-brand-red"
                            }`}
                            >
                                {opt.label}
                            </button>
                        ))}

                        {/* Done button — only shows when at least one location is selected */}
                        {(quoteData.selected_locations ?? []).length > 0 && (
                        <Button
                        onClick={() => handleAnswer((quoteData.selected_locations ?? []).join(","))}
                        className="bg-brand-navy text-white px-6 py-2 mt-2 hover:bg-brand-teal"
                        >
                            Done
                        </Button>
                        )}
                        </div>
                        )}

                        {done && currentStep === "colors_per_location" && (
                            <div className="flex gap-2">
                                <input
                                type="number"
                                value={numberInput}
                                min={1}
                                onChange={(e) => setNumberInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && numberInput.trim()) handleAnswer(numberInput); }}
                                placeholder="Number of colors..."
                                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-brand-teal text-brand-navy"
                            />
                            <button
                            onClick={() => { if (numberInput.trim()) handleAnswer(numberInput); }}
                            className="bg-brand-navy text-white rounded-full px-4 py-2 text-sm hover:bg-brand-teal"
                            >
                                OK
                            </button>
                            </div>
                        )}

                        {done && currentStep === "needed_by" && (
                            <div className="flex gap-2">
                                <input type="date" value={selectedDate}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-brand-red text-brand-navy" />
                                <Button onClick={() => {if (selectedDate) handleAnswer(selectedDate)}}>
                                    OK
                                </Button>
                            </div>
                        )}

                        {done && currentStep === "result" && (
                            <div className="flex justify-center gap-3">
                                <Button onClick={resetAll}>
                                    Start New Quote
                                </Button>
                                <Button onClick={() => setShowFAQ(true)}>
                                    Learn More
                                </Button>
                            </div>
                        )}

                        {done && currentStep === "warnings" && (
                            <div className="flex justify-center">
                                <Button onClick={() => setCurrentStep("result")}>
                                    Got it
                                </Button>
                            </div>
                        )}

                        {done && currentStep === "error" && (
                            <div className="flex justify-center">
                                <Button onClick={() => setCurrentStep(errorReturnStep)}>
                                    Try Again
                                </Button>
                            </div>
                        )}
                    </div>
                    </>
                    )}
                    </div>
                </div>
            </div>
        </div>
        
    );
}