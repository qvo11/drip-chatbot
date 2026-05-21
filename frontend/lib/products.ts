import productsData from "../../backend/pricing-engine/data/products.json"

export interface Product {
    id: string;
    name: string;
    category: string;
    description: string;
    base_cost: number;
    attributes: {
        material: string,
        weight?: string,
        type?: string
    };
    best_for?: string[];
    print_compatibility: string[];
}

export const products: Product[] = productsData as Product[];

export const FILTER_OPTIONS = [
    { label: "Best Price",            value: "best_price" },
    { label: "Premium Feel",          value: "premium" },
    { label: "Athletic/Performance",  value: "athletic" },
    { label: "Everyday Comfort",      value: "comfort" },
];

export const PRODUCT_RECOMMENDATIONS: Record<string, Record<string, string>> = {
    tshirt: {
        best_price: "PC54", 
        premium:     "5001",    
        athletic:    "ST350",   
        comfort:     "64000",   
    },
    hoodie: {
        best_price:  "18500",   
        premium:     "DT650",   
        athletic:    "SF500",   
        comfort:     "SS4500",  
    },
    hat: {
        best_price:  "CP77",   
        premium:     "112",     
        athletic:    "632",     
        comfort:     "31-069",  
    },
};

export function getRecommendedProduct(category: string, filter: string) {
    const productId = PRODUCT_RECOMMENDATIONS[category]?.[filter];
    if (!productId) return null;
    return products.find((p: Product) => p.id === productId) ?? null;
}

export function getProductsByCategory(category: string): Product[] {
    return products.filter((p: Product) => p.category === category);
}

export function getDTGCompatible(category: string): Product[] {
    return products.filter(
        (p) => p.category === category && p.print_compatibility.includes("dtg")
    );
}