import {
  Briefcase,
  Compass,
  Home,
  Leaf,
  Moon,
  Sparkles,
  TrainFront,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { PresenceStatus } from "@/lib/constants";

export const PRESENCE_ICONS: Record<PresenceStatus, LucideIcon> = {
  working: Briefcase,
  commuting: TrainFront,
  home: Home,
  exploring: Compass,
  need_company: Users,
  taking_it_slow: Leaf,
  offline: Moon,
  custom: Sparkles,
};
