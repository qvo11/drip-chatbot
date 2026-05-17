# simple placeholder for now - emb pricing requires stitch count estimates 
# add emb engine later if we have stitch count calculator or API integration with digitizing service ?

def quote_embroidery(product: dict, quantity: int) -> dict:
    return {
        "print_type": "embroidery",
        "status": "manual_quote_required",
        "message": (
            f"Embroidery quotes require a stitch count estimate from our team. "
            f"Please contact us with your design and we'll get you a free quote within 24 hours."
        ),
        "quantity": quantity,
        "product_id": product["id"],
        "next_steps": [
            "Send your logo or design file to shop@impressink.com",
            "Include the quantity and garment style",
            "Our team will provide a stitch count estimate and full quote"
        ]
    }