import { 
  ShoppingBag, 
  Home, 
  Car, 
  Gamepad2, 
  Activity, 
  Utensils, 
  Zap, 
  Briefcase, 
  Stethoscope, 
  BookOpen, 
  ShoppingCart, 
  Tag, 
  Plane, 
  Music, 
  Coffee,
  HelpCircle
} from 'lucide-react';

const ICON_MAP = {
  'shopping-bag': ShoppingBag,
  'home': Home,
  'car': Car,
  'gamepad-2': Gamepad2,
  'heart-pulse': Activity,
  'utensils': Utensils,
  'zap': Zap,
  'briefcase': Briefcase,
  'stethoscope': Stethoscope,
  'book-open': BookOpen,
  'shopping-cart': ShoppingCart,
  'tag': Tag,
  'plane': Plane,
  'music': Music,
  'coffee': Coffee,
};

export default function CategoryIcon({ name, size = 18, className = "" }) {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent size={size} className={className} />;
}
