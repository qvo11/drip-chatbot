from screen_print import quote_screen_print
from dtg import quote_dtg_print
from emb import quote_embroidery

def get_quote(print_type: str, **kwargs) -> dict:
    if print_type == "screen_print":
        return quote_screen_print(**kwargs)
    elif print_type == "dtg":
        return quote_dtg_print(**kwargs)
    elif print_type == "embroidery":
        return quote_embroidery(**kwargs)
    else:
        return {"error": f"Unsupported print type '{print_type}'."}