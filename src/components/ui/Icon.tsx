import React from 'react';
import {
  Activity, AlarmClock, ArrowLeft, ArrowRight, Award, Backpack, BarChart3, Bed, Bell, BookOpen, BookText, Calendar, Check, CheckCheck, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Circle, Cloud, CloudMoon, Coffee, Coins, Compass, Crown, Droplets, Dumbbell, Eye, Feather, Flag, Flame,
  Flower2, Footprints, Frown, Gem, Gift, Glasses, Hand, Heart, HeartHandshake, Home, Hourglass, Landmark, Laugh, Leaf, Lock, LogIn, LogOut, Mail, Map, MapPin,
  Meh, Moon, Mountain, MountainSnow, Music, Palette, PartyPopper, Pause, PawPrint, Pencil, Play, Plus, RefreshCw, Rocket, RotateCcw, Satellite, Search, Send,
  Settings, Shell, Shirt, Smile, SmilePlus, Snowflake, Sparkle, Sparkles, Square, Star, Sun, Sunrise, Tent, ThumbsUp, Timer, Trash2, TreePine, Trees, Trophy,
  Umbrella, User, UserCircle2, Users, Waves, Wind, X, Zap, Bird, Cat, Rabbit, Snail, Egg, Nut, Volume2, VolumeX, Vibrate, Palmtree, Lamp, Sofa, Brain, Utensils,
  Info, ShoppingBag, Globe, Clock, Puzzle, Sticker, Wand2, Rainbow, type LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * The single icon system for the whole app. Every icon goes through here so
 * stroke width, sizing and colour stay consistent (Lucide, 2px stroke, rounded).
 */
const MAP = {
  // navigation
  home: Home, goals: CheckCircle2, pet: PawPrint, journal: BookOpen, profile: UserCircle2, settings: Settings, back: ChevronLeft, forward: ChevronRight,
  'arrow-left': ArrowLeft, 'arrow-right': ArrowRight, 'chevron-down': ChevronDown, 'chevron-up': ChevronUp, close: X, search: Search, info: Info,
  // actions
  add: Plus, check: Check, 'check-all': CheckCheck, 'check-circle': CheckCircle2, edit: Pencil, delete: Trash2, pause: Pause, play: Play, undo: RotateCcw,
  refresh: RefreshCw, send: Send, login: LogIn, logout: LogOut, mail: Mail, google: Globe, lock: Lock, circle: Circle, square: Square, flag: Flag, hand: Hand,
  // stats & rewards
  xp: Sparkles, sparkle: Sparkle, energy: Zap, coins: Coins, streak: Flame, level: Star, trophy: Trophy, award: Award, gift: Gift, gem: Gem, crown: Crown,
  heart: Heart, friendship: HeartHandshake, clap: ThumbsUp, party: PartyPopper, calendar: Calendar, stats: BarChart3, clock: Clock, timer: Timer, hourglass: Hourglass, alarm: AlarmClock, bell: Bell,
  // goal categories
  exercise: Dumbbell, sleep: Bed, study: BookText, hydration: Droplets, mindfulness: Leaf, productivity: CheckCheck, journaling: Pencil, routine: Sunrise, custom: Sparkles,
  // activities
  breath: Wind, wind: Wind, leaf: Leaf, walk: Footprints, stretch: Activity, brain: Brain, music: Music, eat: Utensils, coffee: Coffee, sun: Sun, moon: Moon, cloud: Cloud, 'cloud-moon': CloudMoon, feather: Feather, palette: Palette, puzzle: Puzzle, wand: Wand2, rainbow: Rainbow,
  // moods
  'mood-great': Laugh, 'mood-good': Smile, 'mood-okay': Meh, 'mood-low': Frown, 'mood-rough': CloudMoon, 'mood-add': SmilePlus,
  // places / adventures / environments
  forest: TreePine, trees: Trees, beach: Palmtree, waves: Waves, mountains: Mountain, snow: Snowflake, 'mountain-snow': MountainSnow, garden: Flower2, village: Lamp,
  ruins: Landmark, space: Satellite, rocket: Rocket, compass: Compass, map: Map, pin: MapPin, tent: Tent, bedroom: Sofa, cafe: Coffee, cabin: Tent,
  // items
  hat: Crown, glasses: Glasses, scarf: Shell, jacket: Shirt, backpack: Backpack, toy: Sticker, companion: Snail, environment: Palmtree, collectible: Gem, shop: ShoppingBag,
  acorn: Nut, shell: Shell, crystal: Gem, star: Star, umbrella: Umbrella, egg: Egg,
  // species
  bird: Bird, cat: Cat, fox: PawPrint, bunny: Rabbit, penguin: Egg, snail: Snail,
  // people
  user: User, users: Users, eye: Eye,
  // settings
  sound: Volume2, mute: VolumeX, haptics: Vibrate,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof MAP;
export const ICON_NAMES = Object.keys(MAP) as IconName[];

interface Props {
  name: IconName | (string & {});
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  style?: any;
}

/** Older saved goals may reference legacy icon names; map them onto the current set. */
const LEGACY: Record<string, IconName> = {
  water: 'hydration', book: 'study', barbell: 'exercise', bed: 'sleep', leaf: 'mindfulness', pencil: 'journaling', sunny: 'sun', cafe: 'coffee', bicycle: 'exercise',
  'musical-notes': 'music', brush: 'palette', restaurant: 'eat', call: 'users', sparkles: 'custom', flower: 'garden', body: 'stretch', 'document-text': 'journaling',
  flash: 'energy', happy: 'mood-good', list: 'productivity', 'checkmark-done': 'productivity',
};

export function resolveIconName(name: string): IconName {
  if (name in MAP) return name as IconName;
  return LEGACY[name] ?? 'custom';
}

export function Icon({ name, size = 22, color, strokeWidth = 2.1, fill = 'none', style }: Props) {
  const { colors } = useTheme();
  const Cmp = MAP[resolveIconName(name)] ?? Circle;
  return <Cmp size={size} color={color ?? colors.text} strokeWidth={strokeWidth} fill={fill} style={style} absoluteStrokeWidth={false} />;
}

/** Icon inside a soft rounded tile — used for list rows, categories, rewards. */
export function IconTile({ name, color, bg, size = 44, iconSize, radius: r }: { name: IconName | (string & {}); color?: string; bg?: string; size?: number; iconSize?: number; radius?: number }) {
  const { colors } = useTheme();
  const c = color ?? colors.primary;
  return (
    <_Tile size={size} radius={r ?? Math.round(size * 0.34)} bg={bg ?? c + '26'}>
      <Icon name={name} size={iconSize ?? Math.round(size * 0.5)} color={c} />
    </_Tile>
  );
}

import { View } from 'react-native';
function _Tile({ size, radius: r, bg, children }: { size: number; radius: number; bg: string; children: React.ReactNode }) {
  return <View style={{ width: size, height: size, borderRadius: r, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>{children}</View>;
}
