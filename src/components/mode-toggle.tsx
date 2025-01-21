import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"
import { canvasManager } from "@/services/CanvasManager"

export type Theme = "light" | "dark" | "system"

export function ModeToggle() {
  const { setTheme } = useTheme()

  const handleThemeChange = async (theme: Theme) => {
    await setTheme(theme);
    const canvas = canvasManager.getCanvas();
    if (canvas) {
      canvas.set({ backgroundColor: cssVariableToHex('--card') });
      canvas.renderAll();
    }
  }

  function getCSSVariableValue(variableName: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
  }

  function cssVariableToHex(variableName: string): string {
    const hslValue = getCSSVariableValue(variableName);
    const hslMatch = hslValue.match(/(\d+(\.\d+)?)/g);
    
    if (!hslMatch || hslMatch.length < 3) {
      console.warn('Invalid HSL format:', hslValue);
      return '#000000';
    }

    const [h, s, l] = hslMatch.map(Number);
    return hslToHex(h, s, l);
  }

  function hslToHex(h: number, s: number, l: number): string {
    h = Number(h);
    s = Number(s);
    l = Number(l);

    if (isNaN(h) || isNaN(s) || isNaN(l)) {
      console.warn('Invalid HSL values:', { h, s, l });
      return '#000000';
    }

    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c/2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }

    const toHex = (n: number): string => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
