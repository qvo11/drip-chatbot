import { useState, useEffect } from "react";

export function useTypewriter(text: string, speed: number) {
    const [displayed, setDisplayed] = useState("");
    const [done, setDone] = useState(false);

    useEffect(() => {
        setDisplayed("");
        setDone(false);

        if (!text) return;

        let index = 0;
        const interval = setInterval(() => {
            index++;
            setDisplayed(text.slice(0, index));
            if (index >= text.length) {
                clearInterval(interval);
                setDone(true);
            }
        }, speed)

        return () => clearInterval(interval);
    }, [text, speed])

    return {displayed, done}
}