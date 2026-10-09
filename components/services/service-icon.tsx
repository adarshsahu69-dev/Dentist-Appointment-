import {
  Activity,
  Baby,
  Bone,
  Braces,
  HeartPulse,
  Scissors,
  Smile,
  Sparkles,
  Syringe,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "General Dentistry": Smile,
  "Teeth Cleaning": Sparkles,
  "Dental Checkups": Activity,
  "Teeth Whitening": Sparkles,
  "Braces and Orthodontics": Braces,
  "Root Canal Treatment": Syringe,
  "Dental Implants": Bone,
  "Tooth Extraction": Wrench,
  "Pediatric Dentistry": Baby,
  "Emergency Dental Care": HeartPulse,
  default: Scissors,
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? iconMap.default;
  return <Icon className={cn("h-5 w-5", className)} aria-hidden="true" />;
}
