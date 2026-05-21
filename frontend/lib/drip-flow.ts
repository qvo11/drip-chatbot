export type StepId = "intro" | "product" | "product_filter" | "product_confirm" | "product_list" | "quantity" | "quantity_upgrade"
    | "location" | "colors_per_location" | "dtg_incompatible" | "dtg_product_list" |"garment_tone" | "needed_by" | "result" | 
    "warnings" | "error";

export interface LocationColors {
    location: string;
    label: string;
    colors: number;
}

export interface QuoteData {
    product_id?: string;
    product_name?: string;
    category?: string;
    filter?: string;
    quantity?: number;
    selected_locations?: string[];
    location_labels?: string[];
    colors_per_location?: LocationColors[];
    current_location_index?: number;
    print_type?: string;
    garment_tone?: string;
    needed_by?: string;
}

export interface StepConfig {
    message: string;
    type: "buttons" | "number_input" | "multi_select" | "date_input" | "product_list" | "display";
}

export const STEPS: Record<StepId, StepConfig> = {
    intro: {
        message: "Hi! I'm Drip, your custom apparel guide. Ready for a quick quote? Let's make something great!",
        type: "buttons",
    },
    product: {
        message: "What product do you need?",
        type: "buttons"
    },
    product_filter: {
        message: "What are you looking for in a product?",
        type: "buttons",
    },
    product_confirm: {
        message: "", // built dynamically
        type: "buttons",
    },
    product_list: {
        message: "Here are the suggested options based on your needs — pick one:",
        type: "product_list",
    },
    quantity: {
        message: "How many do you need?",
        type: "number_input",
    },
    quantity_upgrade: {
        message: "Screen printing requires a minimum order of 20 peices. You can switch to DTG (great for small runs!) or increase your quantity.",
        type: "buttons"
    },
    location: {
        message: "Where on the garment do you want your design(s)? Select all that apply, then click Done.",
        type: "multi_select",
    },
    colors_per_location: {
        message: "", // built dynamically
        type: "number_input",
    },
    dtg_incompatible: {
        message: "This product doesn't support DTG printing (required for 8+ colors). What would you like to do?",
        type: "buttons"
    },
    dtg_product_list: {
        message: "Here are products that support DTG printing:",
        type: "product_list"
    },
    garment_tone: {
        message: "Is the garment light or dark colored?",
        type: "buttons",
    },
    needed_by: {
        message: "When do you need your order by?",
        type: "date_input",
    },
    result: {
        message: "", // built from API response
        type: "display",
    },
    warnings: {
        message: "", // built from API warnings
        type: "buttons",
    },
    error: {
        message: "Something went wrong getting your quote. Please try again or contact us!",
        type: "buttons",
    }
};

export const LOCATION_OPTIONS: Record<string, { label: string; value: string }[]> = {
    tshirt: [
        { label: "Front", value: "front" },
        { label: "Back", value: "back" },
        { label: "Left Chest", value: "left_chest" },
        { label: "Right Sleeve", value: "right_sleeve" },
        { label: "Left Sleeve", value: "left_sleeve"}
    ],
    hoodie: [
        { label: "Front", value: "front" },
        { label: "Back", value: "back" },
        { label: "Left Chest", value: "left_chest" },
        { label: "Right Sleeve", value: "right_sleeve" },
        { label: "Left Sleeve", value: "left_sleeve"}

    ],
    hat: [
        { label: "Front", value: "front" },
        { label: "Back", value: "back" },
        { label: "Right Side", value: "right_side" },
        { label: "Left Side", value: "left_side" },
    ],
};

export const PRODUCT_BUTTONS = [
    { label: "T-Shirts", value: "tshirt" },
    { label: "Hoodies", value: "hoodie" },
    { label: "Hats", value: "hat" },
];

export const INTRO_BUTTONS = [
    { label: "Get a Quote", value: "get_quote" },
    { label: "Learn More", value: "learn_more" },
];

export const GARMENT_TONE_BUTTONS = [
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
];

export function getColorsMessage(locationLabel: string): string {
    return `How many colors in your design for the ${locationLabel}? (max 7 for screen print)`;
}

export function getConfirmMessage(productName: string): string {
    return `Perfect! Based on that I'd recommend the ${productName}. Want a quote for that product?`;
}

export function determinePrintType(category: string, colorsPerLocation: LocationColors[]): string {
    if (category === "hat") return "embroidery";
    const maxColors = Math.max(...colorsPerLocation.map((location) => location.colors));
    return maxColors > 7 ? "dtg" : "screen_print";
}