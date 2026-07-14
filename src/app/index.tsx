import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet, Text, View, TouchableOpacity, TouchableWithoutFeedback,
  ScrollView, SafeAreaView, StatusBar, Animated, Modal, TextInput,
  ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Image,
  PanResponder,
} from "react-native";
import {
  Flame, Star, Gift, PartyPopper, QrCode, Check, ChevronRight,
  Sparkles, Coffee, Bell, CreditCard, Trash2, Users, ArrowRight,
  Sliders, Plus, X, Utensils, Minus, ShoppingCart, Sun, Moon,
} from "lucide-react-native";
import Svg, { Circle, Defs, LinearGradient, Stop, Rect, Path, Ellipse, Polygon, ClipPath } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FOOD_MENU, DRINKS_MENU, WING_SAUCES, type MenuItem, type MenuSection } from "../data/menu";
import { MENU_IMAGES } from "../data/menu_images";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                   DATA                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

const LOUNGE = { name: "Cavali", table: 7 };

const DARK_COLORS = {
  night: "#0E0A08",
  card:  "#1C1411",
  card2: "#251B17",
  ember: "#FF5A1F",
  gold:  "#E5B13A",
  teal:  "#14B8A6",
  cream: "#F8F1EA",
  muted: "#948375",
  line:  "#2E2018",
  danger:"#EF4444",
};

const LIGHT_COLORS = {
  night: "#FAF8F6",
  card:  "#FFFFFF",
  card2: "#F3EFEA",
  ember: "#FF5A1F",
  gold:  "#D97706",
  teal:  "#0D9488",
  cream: "#20140C",
  muted: "#786255",
  line:  "#E6DFD9",
  danger:"#DC2626",
};

// Fallback for static compilation/initial state
const COLORS = DARK_COLORS;

/* ── Flavor Sections ─────────────────────────────────────────────────────── */
type Flavor = { id: string; name: string; color: string; desc: string };
type FlavorSection = { id: string; name: string; label: string; sectionColor: string; noMix?: boolean; flavors: Flavor[] };

const FLAVOR_SECTIONS: FlavorSection[] = [
  {
    id: "house", name: "House Mix", label: "🏠 House", sectionColor: "#FF5A1F", noMix: true,
    flavors: [
      { id: "habibi_nights", name: "Habibi Nights", color: "#A855F7", desc: "New Flavor — Cavalli's signature premium blend" },
      { id: "kashmiri_c_hookah", name: "Kashmiri Chai", color: "#FDA4AF", desc: "NEW FLAVOR — Sweet Rooh Afza base with cardamoms" },
      { id: "anarkali",     name: "Anarkali",     color: "#FF6B9D", desc: "Rooh Afza milk base — sweet & floral" },
      { id: "sokha",        name: "Sokha",         color: "#6366F1", desc: "Blueberry base — rich & berry-forward" },
      { id: "zalim",        name: "Zalim",         color: "#EAB308", desc: "Red Bull base — energising & sharp" },
      { id: "dragon",       name: "Dragon",        color: "#EF4444", desc: "Mango base — bold tropical kick" },
      { id: "chulbuli",     name: "Chulbuli",      color: "#F59E0B", desc: "Mango base — tropical & playful" },
      { id: "white_king",   name: "White King",    color: "#C8BFA8", desc: "Milk base — smooth & creamy royalty" },
      { id: "dubai_nights", name: "Dubai Nights",  color: "#10B981", desc: "Watermelon base — refreshing & lush" },
    ],
  },
  {
    id: "fruity", name: "Fruity", label: "🍓 Fruity", sectionColor: "#F472B6",
    flavors: [
      { id: "lychee",      name: "Lychee",      color: "#FCA5A5", desc: "Delicate sweet lychee" },
      { id: "mango",       name: "Mango",        color: "#F59E0B", desc: "Tropical sun-ripe mango" },
      { id: "orange",      name: "Orange",       color: "#F97316", desc: "Zesty fresh orange burst" },
      { id: "guava",       name: "Guava",        color: "#FB7185", desc: "Soft tropical guava" },
      { id: "kiwi",        name: "Kiwi",         color: "#84CC16", desc: "Tart kiwi with green zing" },
      { id: "blueberry",   name: "Blueberry",    color: "#818CF8", desc: "Bold dark blueberry" },
      { id: "grapes",      name: "Grapes",       color: "#A855F7", desc: "Dark grape, smoky finish" },
      { id: "coconut",     name: "Coconut",      color: "#D4A574", desc: "Creamy tropical coconut" },
      { id: "vanilla",     name: "Vanilla",      color: "#FDE68A", desc: "Rich smooth vanilla bean" },
      { id: "strawberry",  name: "Strawberry",   color: "#F43F5E", desc: "Juicy ripe strawberry" },
      { id: "lemon",       name: "Lemon",        color: "#FDE047", desc: "Sharp citrus lemon" },
      { id: "gum",         name: "Gum",          color: "#F9A8D4", desc: "Sweet bubblegum pop" },
      { id: "lime",        name: "Lime",         color: "#4ADE80", desc: "Fresh lime zest" },
    ],
  },
  {
    id: "pro", name: "Pro", label: "⭐ Pro", sectionColor: "#E5B13A",
    flavors: [
      { id: "double_apple", name: "Double Apple",      color: "#FF5A1F", desc: "The original. Sweet, tart, timeless." },
      { id: "pan_ras",      name: "Pan Ras",            color: "#10B981", desc: "Aromatic betel pan, classic desi" },
      { id: "chief",        name: "Chief Commissioner", color: "#6366F1", desc: "Bold, distinguished master blend" },
      { id: "mint_pro",     name: "Mint",               color: "#14B8A6", desc: "Pure ice-cold mint exhale" },
    ],
  },
  {
    id: "adaya", name: "Adaya", label: "💫 Adaya", sectionColor: "#A855F7",
    flavors: [
      { id: "lady_killer", name: "Lady Killer", color: "#EC4899", desc: "Seductive rose & berry mix" },
      { id: "love66",      name: "Love 66",     color: "#EF4444", desc: "Passionate fruity rush" },
      { id: "skyfall",     name: "Skyfall",     color: "#38BDF8", desc: "Airy blue mint sky blend" },
      { id: "bagdadi",     name: "Bagdadi",     color: "#F59E0B", desc: "Exotic Middle Eastern spice" },
    ],
  },
  {
    id: "lit", name: "Lit", label: "🔥 Lit", sectionColor: "#FF5A1F",
    flavors: [
      { id: "watermelon_lit",  name: "Watermelon Lit",   color: "#4ADE80", desc: "Watermelon with a fiery lit edge" },
      { id: "blue_lit",        name: "Blue Lit",          color: "#38BDF8", desc: "Electric blue berry glow" },
      { id: "peach_lit",       name: "Peach Lit",         color: "#FB923C", desc: "Warm peach with a bright lift" },
      { id: "lime_lit",        name: "Lime Lit",           color: "#A3E635", desc: "Sparkling lit lime kick" },
      { id: "smoothie_sunshine", name: "Smoothie Sunshine", color: "#FDE047", desc: "Tropical sunshine smoothie" },
    ],
  },
  {
    id: "classic", name: "Classic", label: "🌿 Classic", sectionColor: "#14B8A6",
    flavors: [
      { id: "safari_melon", name: "Safari Melon", color: "#34D399", desc: "Wild fresh melon adventure" },
      { id: "blue_mist",    name: "Blue Mist",    color: "#7DD3FC", desc: "Blueberry with cool mist" },
      { id: "white_peach",  name: "White Peach",  color: "#FECDD3", desc: "Delicate silky white peach" },
      { id: "irish_peach",  name: "Irish Peach",  color: "#86EFAC", desc: "Crisp peach with Irish charm" },
    ],
  },
];

const MIXABLE_SECTIONS = FLAVOR_SECTIONS.filter(s => !s.noMix);

// Flat list of all flavors for mixer / search use
const ALL_FLAVORS: Flavor[] = FLAVOR_SECTIONS.flatMap((s) => s.flavors);
const flavorById = (id: string): Flavor | undefined => ALL_FLAVORS.find((f) => f.id === id);
const sectionOf = (id: string): FlavorSection | undefined =>
  FLAVOR_SECTIONS.find((s) => s.flavors.some((f) => f.id === id));

const MOCK_DB: Record<string, { name: string; hookahCount: number; history: Array<{ flavorId: string; count: number }> }> = {
  "5551234567": { name: "Sam", hookahCount: 3, history: [{ flavorId: "double_apple", count: 6 }, { flavorId: "mint_pro", count: 3 }] },
};

const HOOKAH_PRICE = 18;
const CHAI_PRICE   = 4;
const DB_STORAGE_KEY      = "@cavali_customer_db";
const SESSION_STORAGE_KEY = "@cavali_active_session";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            FLAVOR ICON SYSTEM                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FlavorIcon({ id, color, size = 24, style }: { id: string; color: string; size?: number; style?: any }) {
  const s = size;
  const v = "0 0 24 24";

  const getIcon = () => {

  /* ── House Mix ─────────────────────────────────────────────── */
  if (id === "anarkali") return ( // Rose flower
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Circle cx="12" cy="12" r="4" fill={color} />
      <Path d="M12 3c-2 1-4 3-3 5 0 0 1.5-1 3-1s3 1 3 1c1-2-1-4-3-5z" fill={color} opacity={0.9}/>
      <Path d="M12 21c-2-1-4-3-3-5 0 0 1.5 1 3 1s3-1 3-1c1 2-1 4-3 5z" fill={color} opacity={0.9}/>
      <Path d="M3 12c1-2 3-4 5-3 0 0-1 1.5-1 3s1 3 1 3c-2 1-4-1-5-3z" fill={color} opacity={0.8}/>
      <Path d="M21 12c-1-2-3-4-5-3 0 0 1 1.5 1 3s-1 3-1 3c2 1 4-1 5-3z" fill={color} opacity={0.8}/>
      <Circle cx="12" cy="12" r="2" fill="#FFF" opacity={0.4}/>
    </Svg>
  );

  if (id === "sokha" || id === "blueberry" || id === "blue_mist") return ( // Blueberries
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Circle cx="9" cy="14" r="4.5" fill={color}/>
      <Path d="M7.5 12.5l1 1M10.5 12.5L9.5 14" stroke="#312E81" strokeWidth="1" opacity={0.5}/>
      <Circle cx="15" cy="11" r="4.5" fill={color} opacity={0.9}/>
      <Path d="M13.5 9.5l1 1M16.5 9.5L15.5 11" stroke="#312E81" strokeWidth="1" opacity={0.5}/>
      <Circle cx="7" cy="13" r="1" fill="#FFF" opacity={0.25}/>
    </Svg>
  );

  if (id === "zalim" || id === "dragon") return ( // Energy can
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Rect x="7" y="4" width="10" height="16" rx="3" fill={color}/>
      <Rect x="8" y="2" width="8" height="3" rx="1.5" fill={color} opacity={0.7}/>
      <Rect x="8" y="19" width="8" height="3" rx="1.5" fill={color} opacity={0.7}/>
      <Path d="M10 9l1 2-2 1 4-1-1 2 2-1" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity={0.9}/>
      {id === "dragon" && <Path d="M7 4 C5 8 6 16 7 20" stroke="#FF0000" strokeWidth="1" opacity={0.5} fill="none"/>}
    </Svg>
  );

  if (id === "chulbuli" || id === "mango") return ( // Mango
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M12 3c-1 0-7 3-7 9 0 5 3 9 7 9s7-4 7-9c0-6-6-9-7-9z" fill={color}/>
      <Path d="M12 3c0 0 2 2 2 5s-1 6-2 9" stroke="#92400E" strokeWidth="1" opacity={0.3} fill="none"/>
      <Path d="M11 2c1-2 2.5-1.5 3-0.5" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <Path d="M14 2.5c1.5-.5 2.5.5 2 1.5" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </Svg>
  );

  if (id === "white_king") return ( // Crown
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M3 18h18l-2-10-4 5-3-9-3 9-4-5z" fill={color}/>
      <Rect x="3" y="18" width="18" height="3" rx="1.5" fill={color} opacity={0.8}/>
      <Circle cx="12" cy="4" r="2" fill={color} opacity={0.9}/>
      <Circle cx="4" cy="12" r="1.5" fill={color} opacity={0.7}/>
      <Circle cx="20" cy="12" r="1.5" fill={color} opacity={0.7}/>
      <Circle cx="12" cy="18.5" r="1" fill="#E5B13A" opacity={0.8}/>
    </Svg>
  );

  if (id === "dubai_nights" || id === "watermelon_lit" || id === "safari_melon") return ( // Watermelon
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M3 10c0 5 4 9 9 9s9-4 9-9" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <Path d="M4.5 10c0 4 3.5 7.5 7.5 7.5s7.5-3.5 7.5-7.5" stroke="#F8F1EA" strokeWidth="1" fill="none" opacity={0.6}/>
      <Path d="M5.5 10c0 3.5 3 6.5 6.5 6.5s6.5-3 6.5-6.5H5.5z" fill={color}/>
      <Circle cx="9" cy="12.5" r="0.8" fill="#1C1411"/>
      <Circle cx="12" cy="14.5" r="0.8" fill="#1C1411"/>
      <Circle cx="15" cy="12.5" r="0.8" fill="#1C1411"/>
    </Svg>
  );

  /* ── Fruity Section ─────────────────────────────────────────── */
  if (id === "lychee") return ( // Round spiky lychee
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Circle cx="12" cy="13" r="8" fill={color}/>
      <Circle cx="9" cy="10" r="2" fill={color} opacity={0.5}/>
      <Circle cx="15" cy="10" r="2" fill={color} opacity={0.5}/>
      <Circle cx="12" cy="8"  r="2" fill={color} opacity={0.5}/>
      <Circle cx="7"  cy="13" r="2" fill={color} opacity={0.5}/>
      <Circle cx="17" cy="13" r="2" fill={color} opacity={0.5}/>
      <Circle cx="12" cy="18" r="2" fill={color} opacity={0.5}/>
      <Path d="M12 5 v-3" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <Circle cx="12" cy="13" r="4" fill="#FFF" opacity={0.1}/>
    </Svg>
  );

  if (id === "orange") return ( // Orange slice
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Circle cx="12" cy="12" r="10" fill={color}/>
      <Circle cx="12" cy="12" r="8.5" fill="#1C1411"/>
      <Circle cx="12" cy="12" r="1"   fill={color}/>
      <Path d="M12 12L12 4.5M12 12L18.5 8.5M12 12L18.5 15.5M12 12L12 19.5M12 12L5.5 15.5M12 12L5.5 8.5" stroke={color} strokeWidth="1.2"/>
    </Svg>
  );

  if (id === "guava") return ( // Guava
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M12 4c-4 0-8 3-8 8 0 4 3 9 8 9s8-5 8-9c0-5-4-8-8-8z" fill={color}/>
      <Path d="M12 4c0 0-2 4-2 8s2 8 2 8" stroke="#BE123C" strokeWidth="1" opacity={0.3} fill="none"/>
      <Path d="M4 12c4 0 8-2 8-2s4 2 8 0" stroke="#BE123C" strokeWidth="1" opacity={0.3} fill="none"/>
      <Path d="M12 2v3" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </Svg>
  );

  if (id === "kiwi") return ( // Kiwi cross-section
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Circle cx="12" cy="12" r="10" fill={color}/>
      <Circle cx="12" cy="12" r="8"  fill="#F8F1EA"/>
      <Circle cx="12" cy="12" r="2"  fill="#F59E0B"/>
      {[0,60,120,180,240,300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 12 + 2.5 * Math.cos(rad);
        const y1 = 12 + 2.5 * Math.sin(rad);
        const x2 = 12 + 7.5 * Math.cos(rad);
        const y2 = 12 + 7.5 * Math.sin(rad);
        return <Path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} stroke={color} strokeWidth="1.5" opacity={0.7}/>;
      })}
      {[30,90,150,210,270,330].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x = 12 + 6 * Math.cos(rad);
        const y = 12 + 6 * Math.sin(rad);
        return <Circle key={i} cx={x} cy={y} r="0.8" fill="#1C1411" opacity={0.6}/>;
      })}
    </Svg>
  );

  if (id === "grapes") return ( // Grape bunch
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Circle cx="9"  cy="7"  r="3.2" fill={color}/>
      <Circle cx="15" cy="7"  r="3.2" fill={color}/>
      <Circle cx="12" cy="10" r="3.2" fill={color}/>
      <Circle cx="8"  cy="13" r="3.2" fill={color}/>
      <Circle cx="16" cy="13" r="3.2" fill={color}/>
      <Circle cx="12" cy="16" r="3.2" fill={color}/>
      <Path d="M12 5V3c0-1 1-1.5 2-1" stroke="#78350F" strokeWidth="1.5" fill="none"/>
    </Svg>
  );

  if (id === "coconut") return ( // Coconut
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Ellipse cx="12" cy="14" rx="9" ry="7" fill={color}/>
      <Path d="M3 14C3 14 7 10 12 10s9 4 9 4" stroke="#92400E" strokeWidth="1.5" opacity={0.5} fill="none"/>
      <Path d="M12 10V4" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <Path d="M12 4C10 2 7 3 7 5" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <Path d="M12 4C14 2 17 3 17 5" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <Circle cx="9" cy="12" r="1.5" fill="#92400E" opacity={0.5}/>
      <Circle cx="13" cy="13" r="1" fill="#92400E" opacity={0.5}/>
    </Svg>
  );

  if (id === "vanilla") return ( // Vanilla flower
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M12 20c-1 0-3-3-3-8s2-8 3-8 3 3 3 8-2 8-3 8z" fill={color}/>
      <Circle cx="12" cy="12" r="2.5" fill="#F8F1EA"/>
      <Path d="M12 4c-3-1-6 0-7 3" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
      <Path d="M12 4c3-1 6 0 7 3" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity={0.7}/>
      <Path d="M5 7c-1 2-1 5 0 7" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity={0.5}/>
    </Svg>
  );

  if (id === "strawberry") return ( // Strawberry
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M12 21c-4 0-8-4-8-9 0-4 2-7 6-7 1 0 2 0.5 2 0.5s1-0.5 2-0.5c4 0 6 3 6 7 0 5-4 9-8 9z" fill={color}/>
      <Path d="M12 5c-1-2-1.5-4 0-4s1 2 0 4" stroke="#4ADE80" strokeWidth="1.5" fill="none"/>
      <Path d="M9.5 5.5c-1.5-1.5-2-3.5-0.5-3.5" stroke="#4ADE80" strokeWidth="1.2" fill="none"/>
      <Path d="M14.5 5.5c1.5-1.5 2-3.5 0.5-3.5" stroke="#4ADE80" strokeWidth="1.2" fill="none"/>
      <Circle cx="10" cy="12" r="0.7" fill="#FFF" opacity={0.5}/>
      <Circle cx="13" cy="10" r="0.7" fill="#FFF" opacity={0.5}/>
      <Circle cx="11" cy="15" r="0.7" fill="#FFF" opacity={0.5}/>
      <Circle cx="14" cy="14" r="0.7" fill="#FFF" opacity={0.5}/>
    </Svg>
  );

  if (id === "lemon") return ( // Lemon
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Ellipse cx="12" cy="12" rx="9" ry="7" fill={color}/>
      <Path d="M4 12c4-2 8-2 16 0" stroke="#CA8A04" strokeWidth="1" opacity={0.4} fill="none"/>
      <Path d="M3 10c2-2 4-3 9-3s7 1 9 3" stroke="#CA8A04" strokeWidth="0.8" opacity={0.3} fill="none"/>
      <Ellipse cx="3.5" cy="12" rx="1.5" ry="1" fill={color} opacity={0.8}/>
      <Ellipse cx="20.5" cy="12" rx="1.5" ry="1" fill={color} opacity={0.8}/>
    </Svg>
  );

  if (id === "gum") return ( // Bubble gum bubble
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Circle cx="12" cy="13" r="9"  fill={color}/>
      <Circle cx="8"  cy="8"  r="4"  fill={color} opacity={0.7}/>
      <Circle cx="17" cy="7"  r="3"  fill={color} opacity={0.5}/>
      <Circle cx="12" cy="4"  r="2"  fill={color} opacity={0.4}/>
      <Circle cx="10" cy="11" r="2"  fill="#FFF"  opacity={0.2}/>
    </Svg>
  );

  if (id === "lime" || id === "lime_lit") return ( // Lime wedge
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M12 2L22 19H2z" fill={color} opacity={0.15}/>
      <Path d="M3 19h18c0 0-9-17-9-17L3 19z" fill={color}/>
      <Path d="M12 4L12 19M12 11L5 19M12 11L19 19" stroke="#166534" strokeWidth="1" opacity={0.4} fill="none"/>
      {id === "lime_lit" && <Circle cx="12" cy="14" r="3" fill="#FDE047" opacity={0.5}/>}
    </Svg>
  );

  /* ── Pro Section ────────────────────────────────────────────── */
  if (id === "double_apple") return ( // Two apples
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M8 19c-1.6-.7-3-.7-4.5 0-1.1-.8-1.5-3.5-1.5-5.5C2 11 3.5 9.8 5 9.8c1.1 0 1.5 1.1 2.6 1.1.8 0 1.1-.3 1.5-.3" fill={color}/>
      <Path d="M8 19c1.9-.8 3.4-.8 5 0 1.1-.8 1.9-3.5 1.9-5.5C15 11 13.8 9.8 12.3 9.8c-1.1 0-1.9 1.1-3 1.1-.6 0-1-.3-1.4-.5" fill={color} opacity={0.8}/>
      <Path d="M8 8c-.8-1.5-.8-3 .8-3.8" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <Path d="M8.4 4c1.5.3 2.3 1.9 2.3 1.9S9.2 7 8 5.7c-.4-.4-.4-1.5.4-1.7z" fill="#4ADE80"/>
      <Path d="M14 18c2-0.8 3.5-.8 5 0 1-.8 2-3.5 2-5.5C21 10 19.5 9 18 9c-1 0-2 1-3 1-.5 0-1-.3-1.3-.5" fill={color} opacity={0.85}/>
      <Path d="M16 7c-.5-1.3-.5-2.5.7-3.2" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </Svg>
  );

  if (id === "pan_ras") return ( // Betel/Pan leaf
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M12 21C8 18 3 14 4 7c1-5 7-6 8-6s7 1 8 6c1 7-4 11-8 14z" fill={color}/>
      <Path d="M12 21V8" stroke="#065F46" strokeWidth="1.5" opacity={0.4} fill="none"/>
      <Path d="M12 10q4 1.5 5 0" stroke="#065F46" strokeWidth="1.2" opacity={0.4} fill="none"/>
      <Path d="M12 14q-4 1.5-5 0" stroke="#065F46" strokeWidth="1.2" opacity={0.4} fill="none"/>
      <Path d="M12 12q4 1.5 5 0" stroke="#065F46" strokeWidth="1.2" opacity={0.4} fill="none"/>
      <Path d="M12 16q-3 1-4 0" stroke="#065F46" strokeWidth="1.2" opacity={0.4} fill="none"/>
    </Svg>
  );

  if (id === "chief") return ( // Badge/star shield
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M12 2L4 6v6c0 5 4 9 8 10 4-1 8-5 8-10V6z" fill={color}/>
      <Path d="M12 6l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L7 10l3.5-.5z" fill="#FFF" opacity={0.85}/>
    </Svg>
  );

  if (id === "mint_pro") return ( // Mint leaf (detailed)
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M12 2c0 0 8 4 8 10 0 4.5-3.5 8-8 8s-8-3.5-8-8c0-6 8-10 8-10z" fill={color}/>
      <Path d="M12 2v18" stroke="#115E59" strokeWidth="1.5" opacity={0.4} fill="none"/>
      <Path d="M12 6q3 2 5 1"  stroke="#115E59" strokeWidth="1.2" opacity={0.4} fill="none"/>
      <Path d="M12 9q-3 2-5 1" stroke="#115E59" strokeWidth="1.2" opacity={0.4} fill="none"/>
      <Path d="M12 12q3 2 5 1" stroke="#115E59" strokeWidth="1.2" opacity={0.4} fill="none"/>
      <Path d="M12 15q-3 2-5 1" stroke="#115E59" strokeWidth="1.2" opacity={0.4} fill="none"/>
    </Svg>
  );

  /* ── Adaya Section ──────────────────────────────────────────── */
  if (id === "lady_killer") return ( // Heart with arrow
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M12 20l-9-9c-2-2-2-5 0-7 2-2 5-2 7 0l2 2 2-2c2-2 5-2 7 0 2 2 2 5 0 7z" fill={color}/>
      <Path d="M3 7l18 10" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity={0.9}/>
      <Path d="M19 6l2-2" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity={0.9}/>
      <Path d="M20 8l1 1" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity={0.9}/>
    </Svg>
  );

  if (id === "love66") return ( // Heart with lines
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M12 20l-9-9c-2-2-2-5 0-7 2-2 5-2 7 0l2 2 2-2c2-2 5-2 7 0 2 2 2 5 0 7z" fill={color}/>
      <Circle cx="9.5"  cy="11" r="2" fill="#FFF" opacity={0.7}/>
      <Circle cx="14.5" cy="11" r="2" fill="#FFF" opacity={0.7}/>
      <Path d="M9 14.5 Q12 17 15 14.5" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity={0.85}/>
    </Svg>
  );

  if (id === "skyfall") return ( // Cloud + sky
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Circle cx="8"  cy="14" r="5"   fill={color}/>
      <Circle cx="13" cy="12" r="6"   fill={color}/>
      <Circle cx="18" cy="14" r="4"   fill={color}/>
      <Rect x="3" y="14" width="18" height="6" rx="0" fill={color}/>
      <Path d="M9 8L12 2M12 2L15 8" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <Circle cx="12" cy="2" r="1.5" fill="#FDE047"/>
    </Svg>
  );

  if (id === "bagdadi") return ( // Arabian lantern
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M12 2c-1 0-1.5.7-1.5 1.5V5H8l-3 5v6l3 4h8l3-4v-6L16 5h-2.5V3.5c0-.8-.5-1.5-1.5-1.5z" fill={color}/>
      <Path d="M9 10h6M8 13h8" stroke="#FFF" strokeWidth="1" opacity={0.5} fill="none"/>
      <Circle cx="12" cy="12" r="2" fill="#FDE047" opacity={0.7}/>
      <Path d="M12 20v3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );

  /* ── Lit Section ────────────────────────────────────────────── */
  if (id === "blue_lit") return ( // Blue flame
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M12 2c0 0-7 6-7 12 0 4 3.5 7 7 7s7-3 7-7c0-6-7-12-7-12z" fill={color}/>
      <Path d="M12 8c0 0-4 4-4 8 0 2 1.5 4 4 4s4-2 4-4c0-4-4-8-4-8z" fill="#7DD3FC" opacity={0.6}/>
      <Path d="M12 14c0 0-1.5 1-1.5 3s1.5 2 1.5 2" fill="#FFF" opacity={0.4}/>
    </Svg>
  );

  if (id === "peach_lit" || id === "white_peach" || id === "irish_peach") return ( // Peach
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Path d="M12 21c-4.5 0-8-4-8-9 0-4 3-8 8-8s8 4 8 8c0 5-3.5 9-8 9z" fill={color}/>
      <Path d="M12 4c0 0 0 5 4 6" stroke="#FDE68A" strokeWidth="1.5" opacity={0.5} fill="none"/>
      <Path d="M12 3v-2.5" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <Path d="M12 0.5c1.5 0 2.5 1 2 2" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {id === "irish_peach" && <Path d="M6 12c1-1 2.5-1 3.5 0M11 12c1-1 2.5-1 3.5 0M8.5 15c1-1 2.5-1 3.5 0" stroke="#16A34A" strokeWidth="1.2" strokeLinecap="round" fill="none"/>}
    </Svg>
  );

  if (id === "smoothie_sunshine") return ( // Sun cup
    <Svg width={s} height={s} viewBox={v} style={style}>
      <Circle cx="12" cy="10" r="6" fill={color}/>
      <Path d="M12 2v2M12 16v2M4 10H2M22 10h-2M6 4l1.4 1.4M16.6 14.6L18 16M6 16l1.4-1.4M16.6 5.4L18 4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Path d="M8 16l1 6h6l1-6" fill={color} opacity={0.7}/>
      <Path d="M7 19h10" stroke="#FFF" strokeWidth="1" opacity={0.5}/>
    </Svg>
  );

  /* ── Classic Section ────────────────────────────────────────── */
  if (id === "blue_lit") return ( // handled above
    <Svg width={s} height={s} viewBox={v} style={style}><Circle cx="12" cy="12" r="10" fill={color}/></Svg>
  );

    // Default circle fallback
    return (
      <Svg width={s} height={s} viewBox={v} style={style}>
        <Circle cx="12" cy="12" r="10" fill={color}/>
        <Path d="M12 6v12M6 12h12" stroke="#1C1411" strokeWidth="2.5" strokeLinecap="round"/>
      </Svg>
    );
  };

  return (
    <View style={[{ width: size, height: size, flexShrink: 0 }, style]}>
      {getIcon()}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                               HELPERS                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function formatPhone(digits: string) {
  if (digits.length === 0) return "";
  let out = "(" + digits.slice(0, 3);
  if (digits.length >= 3) out += ") " + digits.slice(3, 6);
  if (digits.length >= 6) out += "-" + digits.slice(6, 10);
  return out;
}

function getRecommendations(customer: any): Flavor[] {
  if (customer?.history?.length > 0) {
    return [...customer.history]
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 4)
      .map((h: any) => flavorById(h.flavorId))
      .filter(Boolean) as Flavor[];
  }
  return ALL_FLAVORS.filter((f) =>
    ["double_apple", "mint_pro", "watermelon_lit", "mango"].includes(f.id)
  );
}

async function updateCustomerDb(phone: string, updated: any) {
  try {
    const raw = await AsyncStorage.getItem(DB_STORAGE_KEY);
    const db = raw ? JSON.parse(raw) : { ...MOCK_DB };
    db[phone] = { name: updated.name, hookahCount: updated.hookahCount, history: updated.history || [] };
    await AsyncStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
  } catch (e) { console.error("DB update error", e); }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                            SMALL COMPONENTS                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */



function getHookahImage(flavorId: string) {
  if (flavorId === "anarkali" || flavorId === "kashmiri_c_hookah") {
    return MENU_IMAGES.hookah_anarkali;
  }
  if (flavorId === "white_king") {
    return MENU_IMAGES.hookah_white_king;
  }
  if (flavorId === "zalim" || flavorId === "dragon") {
    return MENU_IMAGES.hookah_zalim;
  }
  return MENU_IMAGES.hookah_generic;
}

function Panel({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[{ flex: 1, justifyContent: "space-between" }, style]}>{children}</View>;
}

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const COLORS = theme === "dark" ? DARK_COLORS : LIGHT_COLORS;
  const styles = React.useMemo(() => getStyles(COLORS), [theme]);

  const [appReady,      setAppReady]      = useState(false);
  const [screen,        setScreen]        = useState("scan");
  const [scanState,     setScanState]     = useState<"idle"|"scanning"|"success">("idle");
  const [loungeName,    setLoungeName]    = useState("");
  const [tableNum,      setTableNum]      = useState<number|null>(null);
  const [tableScanMode, setTableScanMode] = useState<"input"|"qr">("input");
  const [tableNumInput, setTableNumInput] = useState("");
  const [customerName,  setCustomerName]  = useState("");
  const [phoneDigits,   setPhoneDigits]   = useState("");
  const [customer,      setCustomer]      = useState<any>(null);
  const [selectedFlavor,setSelectedFlavor]= useState<any>(null);
  const [sessionOrders, setSessionOrders] = useState<any[]>([]);
  const [activeOrder,   setActiveOrder]   = useState<any>(null);
  const [orderStage,    setOrderStage]    = useState(0);
  const [rewards,       setRewards]       = useState<any[]>([]);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [serverRequest, setServerRequest] = useState<{ type:string; label:string; status:"pending"|"processing"|"completed" }|null>(null);
  const [showServerPanel, setShowServerPanel] = useState(false);
  const [showMixModal,  setShowMixModal]  = useState(false);
  const [mixFlavors,    setMixFlavors]    = useState<Array<{flavor:Flavor; ratio:number}>>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [mixSection,    setMixSection]    = useState(0);
  const [karakChaiEligible, setKarakChaiEligible] = useState(false);
  const [rewardQrCode,  setRewardQrCode]  = useState<string|null>(null);
  const [addIceHose,    setAddIceHose]    = useState(false);
  const [addIceBase,    setAddIceBase]    = useState(false);
  const [hookahQty,     setHookahQty]     = useState(1);
  const [orderNote,     setOrderNote]     = useState("");

  // ── Draggable Floating Bell ──
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      }
    })
  ).current;

  // ── Welcome Screen Fade ──
  const welcomeFade = useRef(new Animated.Value(0)).current;

  // ── Tab Transition ──
  const tabFade = useRef(new Animated.Value(1)).current;

  // ── Floating Bell Animations ──
  const bellPulse = useRef(new Animated.Value(0)).current;
  const bellRing = useRef(new Animated.Value(0)).current;

  // ── Fly to Cart Particles ──
  const [flyParticles, setFlyParticles] = useState<Array<{ id: number; color: string }>>([]);
  const flyAnim = useRef(new Animated.Value(0)).current;
  const cartBounceAnim = useRef(new Animated.Value(1)).current;

  // ── Tracking Timeline Animations ──
  const timelineProgress = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  // ── Animation Triggers & Loops ──
  useEffect(() => {
    // Start welcome fade-in
    Animated.timing(welcomeFade, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true
    }).start();

    // Start continuous loops
    Animated.loop(
      Animated.sequence([
        Animated.timing(bellPulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(bellPulse, { toValue: 0, duration: 0, useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseValue, { toValue: 1.0, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  function triggerWelcomeAnimation(callback: () => void) {
    welcomeFade.setValue(0);
    Animated.timing(welcomeFade, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true
    }).start(callback);
  }

  function triggerTabFade() {
    tabFade.setValue(0.3);
    Animated.timing(tabFade, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true
    }).start();
  }

  function triggerBellRing() {
    Animated.sequence([
      Animated.timing(bellRing, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(bellRing, { toValue: -1, duration: 90, useNativeDriver: true }),
      Animated.timing(bellRing, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(bellRing, { toValue: -1, duration: 90, useNativeDriver: true }),
      Animated.timing(bellRing, { toValue: 0, duration: 90, useNativeDriver: true }),
    ]).start();
  }

  function triggerFlyToCart(color: string) {
    const id = Date.now();
    setFlyParticles(prev => [...prev, { id, color }]);
    flyAnim.setValue(0);
    Animated.timing(flyAnim, {
      toValue: 1,
      duration: 750,
      useNativeDriver: true,
    }).start(() => {
      setFlyParticles(prev => prev.filter(p => p.id !== id));
      triggerCartBounce();
    });
  }

  function triggerCartBounce() {
    Animated.sequence([
      Animated.timing(cartBounceAnim, { toValue: 1.08, duration: 100, useNativeDriver: true }),
      Animated.timing(cartBounceAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(cartBounceAnim, { toValue: 1.03, duration: 100, useNativeDriver: true }),
      Animated.timing(cartBounceAnim, { toValue: 1.0, duration: 100, useNativeDriver: true }),
    ]).start();
  }

  // ── Smoke Animation ──
  const smokeAnim = useRef(new Animated.Value(0)).current;
  function triggerSmokeAnimation() {
    smokeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(smokeAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      Animated.timing(smokeAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start();
  }

  // ── Food & Drinks ──────────────────────────────────────────
  const [mainTab,         setMainTab]         = useState<"hookah"|"food"|"drinks">("hookah");
  const [hookahCart,      setHookahCart]      = useState<Array<any>>([]);
  const [foodCart,        setFoodCart]        = useState<Array<{item:MenuItem; qty:number; sauce?:string}>>([]);
  const [drinkCart,       setDrinkCart]       = useState<Array<{item:MenuItem; qty:number}>>([]);
  const [activeFoodSection,  setActiveFoodSection]  = useState(0);
  const [activeDrinkSection, setActiveDrinkSection] = useState(0);
  const [showWingSauce,   setShowWingSauce]   = useState(false);
  const [pendingWingItem, setPendingWingItem] = useState<MenuItem|null>(null);

  const laserAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0.4)).current;
  const timers    = useRef<any[]>([]);



  useEffect(() => {
    if (selectedFlavor) setHookahQty(1);
  }, [selectedFlavor]);

  /* ── Init ─────────────────────────────────────────────────── */
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(laserAnim, { toValue:1, duration:1800, useNativeDriver:true }),
      Animated.timing(laserAnim, { toValue:0, duration:1800, useNativeDriver:true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(flashAnim, { toValue:1,   duration:800, useNativeDriver:true }),
      Animated.timing(flashAnim, { toValue:0.4, duration:800, useNativeDriver:true }),
    ])).start();

    const init = async () => {
      try {
        const storedDb = await AsyncStorage.getItem(DB_STORAGE_KEY);
        if (!storedDb) await AsyncStorage.setItem(DB_STORAGE_KEY, JSON.stringify(MOCK_DB));
        const storedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSession) {
          const s = JSON.parse(storedSession);
          setPhoneDigits(s.phoneDigits  || "");
          setCustomerName(s.customerName || "");
          setCustomer(s.customer || null);
          setSessionOrders(s.sessionOrders || []);
          setActiveOrder(s.activeOrder  || null);
          setOrderStage(s.orderStage   || 0);
          setScreen(s.screen        || "scan");
          setLoungeName(s.loungeName   || "");
          setTableNum(s.tableNum     || null);
          if (s.serverRequest) setServerRequest(s.serverRequest);
        }
        // Synthetic delay for premium welcome screen experience
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch(e) { console.error(e); }
      finally { setAppReady(true); }
    };
    init();
    return () => timers.current.forEach(clearTimeout);
  }, []);

  /* ── Session persistence ──────────────────────────────────── */
  useEffect(() => {
    if (!appReady) return;
    const save = async () => {
      try {
        if (screen === "scan" || (screen === "welcome" && !phoneDigits && !customerName)) {
          await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        } else {
          await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
            phoneDigits, customerName, customer, sessionOrders,
            activeOrder, orderStage, screen, serverRequest, loungeName, tableNum,
          }));
        }
      } catch(e) { console.error(e); }
    };
    save();
  }, [phoneDigits, customerName, customer, sessionOrders, activeOrder, orderStage, screen, serverRequest, loungeName, tableNum, appReady]);

  // ── Tab transitions ──
  useEffect(() => {
    triggerTabFade();
  }, [mainTab]);

  // ── Active order polling & timeline tracking animation ──
  useEffect(() => {
    if (screen !== "tracking" || !activeOrder) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(BACKEND_URL);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          const match = data.orders.find((o: any) => o.id === activeOrder.id);
          if (match && match.status !== activeOrder.status) {
            setActiveOrder(match);
          }
        }
      } catch (err) {
        console.log("Error polling active order:", err);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [screen, activeOrder?.id, activeOrder?.status]);

  useEffect(() => {
    if (screen !== "tracking" || !activeOrder) return;
    const stage = activeOrder.status === "fulfilled" ? 2 : (activeOrder.status === "sent_to_toast" ? 1 : 0);
    Animated.timing(timelineProgress, {
      toValue: stage,
      duration: 1000,
      useNativeDriver: false
    }).start();
  }, [activeOrder?.status, screen]);

  /* ── Server request simulation ────────────────────────────── */
  useEffect(() => {
    if (!serverRequest) return;
    let t: any;
    if (serverRequest.status === "pending")     t = setTimeout(() => setServerRequest(p => p ? {...p, status:"processing"} : null), 4000);
    if (serverRequest.status === "processing")  t = setTimeout(() => setServerRequest(p => p ? {...p, status:"completed"}  : null), 12000);
    if (serverRequest.status === "completed")   t = setTimeout(() => setServerRequest(null), 3000);
    return () => t && clearTimeout(t);
  }, [serverRequest?.status]);

  const laserTranslateY = laserAnim.interpolate({ inputRange:[0,1], outputRange:[15,195] });

  /* ── Handlers ─────────────────────────────────────────────── */
  function handlePhoneChange(text: string) {
    setPhoneDigits(text.replace(/\D/g, "").slice(0, 10));
  }

  function triggerTableScan() {
    setScanState("scanning");
    const t1 = setTimeout(() => {
      setLoungeName("Cavali");
      setTableNum(7);
      setTableNumInput("7");
      setScanState("success");
      const t2 = setTimeout(() => {
        setTableScanMode("input");
        setScanState("idle");
      }, 1200);
      timers.current.push(t2);
    }, 1800);
    timers.current.push(t1);
  }

  function submitPhone() {
    Keyboard.dismiss();
    setScreen("loading");
    console.log("[submitPhone] Starting...");
    const parsed = parseInt(tableNumInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setTableNum(parsed);
    }
    setLoungeName("Cavali");
    const t = setTimeout(async () => {
      try {
        console.log("[submitPhone] Getting from AsyncStorage...");
        const raw = await AsyncStorage.getItem(DB_STORAGE_KEY);
        console.log("[submitPhone] AsyncStorage raw data:", raw ? "EXISTS" : "EMPTY");
        const db  = raw ? JSON.parse(raw) : MOCK_DB;
        const found = db[phoneDigits];
        const loadedCustomer = found
          ? { hookahCount: 0, history: [], ...found, name: customerName.trim() }
          : { name: customerName.trim(), hookahCount: 0, history: [] };
        console.log("[submitPhone] Updating DB...");
        await updateCustomerDb(phoneDigits, loadedCustomer);
        console.log("[submitPhone] Setting customer and transitioning to dashboard...");
        setCustomer(loadedCustomer);
        setScreen("dashboard");
      } catch(e) {
        console.log("[submitPhone] ERROR:", e);
        setCustomer({ name: customerName.trim(), hookahCount: 0, history: [] });
        setScreen("dashboard");
      }
    }, 1300);
    timers.current.push(t);
  }

  function addToHookahCart() {
    if (!selectedFlavor) return;
    const newItems = Array.from({ length: hookahQty }).map((_, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      flavor: selectedFlavor,
      iceHose: addIceHose,
      iceBase: addIceBase
    }));
    setHookahCart(prev => [...prev, ...newItems]);
    triggerFlyToCart(selectedFlavor.color || COLORS.ember);
    setSelectedFlavor(null);
    setAddIceHose(false);
    setAddIceBase(false);
  }

  function removeHookahFromCart(id: string) {
    setHookahCart(prev => prev.filter(h => h.id !== id));
  }

  function finishOrder(order: any, newLifetime: number) {
    setCustomer((prev: any) => {
      let history = [...(prev.history || [])];
      const recordFlavor = (fid: string) => {
        const idx = history.findIndex((h: any) => h.flavorId === fid);
        if (idx >= 0) history[idx] = { ...history[idx], count: history[idx].count + 1 };
        else history.push({ flavorId: fid, count: 1 });
      };
      
      if (order.kind === "mixed" && order.hookahs) {
        order.hookahs.forEach((h: any) => {
          if (h.flavor?.isMix && h.flavor?.mixDetails) {
            h.flavor.mixDetails.forEach((md: any) => recordFlavor(md.id));
          } else if (h.flavor?.id) {
            recordFlavor(h.flavor.id);
          }
        });
      }

      const next = { ...prev, hookahCount: newLifetime, history };
      updateCustomerDb(phoneDigits, next);
      return next;
    });

    const earned: any[] = [];

    // ── Every 4th hookah → generate unique reward QR code ──
    if (newLifetime % 4 === 0 && newLifetime > 0) {
      const rewardToken = `CAVALI-${phoneDigits}-H${newLifetime}-${Date.now()}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(rewardToken)}&bgcolor=1C1411&color=E5B13A&format=png`;
      setRewardQrCode(qrUrl);
      earned.push({ type: "hookah", text: "Your 4th hookah is FREE! Show the QR code below to your server." });
    }

    if (earned.length > 0) { setRewards(earned); setShowRewardModal(true); }
  }

  function dismissReward() { setShowRewardModal(false); setRewardQrCode(null); /* stays on tracking */ }

  function restart() {
    timers.current.forEach(clearTimeout);
    setScreen("scan"); setScanState("idle"); setPhoneDigits(""); setCustomerName("");
    setCustomer(null); setSelectedFlavor(null); setSessionOrders([]); setActiveOrder(null);
    setOrderStage(0); setRewards([]); setShowRewardModal(false); setServerRequest(null);
    setLoungeName(""); setTableNum(null);
    setAddIceHose(false); setAddIceBase(false); setKarakChaiEligible(false);
    setHookahCart([]); setFoodCart([]); setDrinkCart([]); setMainTab("hookah");
  }

  /* ── Food cart helpers ─────────────────────────────────────── */
  function addToFoodCart(item: MenuItem, sauce?: string) {
    if (item.requiresSauce) {
      setPendingWingItem(item);
      setShowWingSauce(true);
      return;
    }
    setFoodCart(prev => {
      const existing = prev.findIndex(c => c.item.id === item.id && c.sauce === sauce);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], qty: next[existing].qty + 1 };
        return next;
      }
      return [...prev, { item, qty: 1, sauce }];
    });
    triggerFlyToCart(COLORS.ember);
  }
  function removeFromFoodCart(itemId: string, sauce?: string) {
    setFoodCart(prev => {
      const idx = prev.findIndex(c => c.item.id === itemId && c.sauce === sauce);
      if (idx < 0) return prev;
      const next = [...prev];
      if (next[idx].qty <= 1) { next.splice(idx, 1); return next; }
      next[idx] = { ...next[idx], qty: next[idx].qty - 1 };
      return next;
    });
  }
  function commitWingSauce(sauce: string) {
    if (!pendingWingItem) return;
    setFoodCart(prev => {
      const existing = prev.findIndex(c => c.item.id === pendingWingItem.id && c.sauce === sauce);
      if (existing >= 0) {
        const next = [...prev]; next[existing] = { ...next[existing], qty: next[existing].qty + 1 }; return next;
      }
      return [...prev, { item: pendingWingItem, qty: 1, sauce }];
    });
    setShowWingSauce(false); setPendingWingItem(null);
    triggerFlyToCart(COLORS.ember);
  }

  function addToDrinkCart(item: MenuItem) {
    setDrinkCart(prev => {
      const existing = prev.findIndex(c => c.item.id === item.id);
      if (existing >= 0) {
        const next = [...prev]; next[existing] = { ...next[existing], qty: next[existing].qty + 1 }; return next;
      }
      return [...prev, { item, qty: 1 }];
    });
    triggerFlyToCart(COLORS.teal);
  }
  function removeFromDrinkCart(itemId: string) {
    setDrinkCart(prev => {
      const idx = prev.findIndex(c => c.item.id === itemId);
      if (idx < 0) return prev;
      const next = [...prev];
      if (next[idx].qty <= 1) { next.splice(idx, 1); return next; }
      next[idx] = { ...next[idx], qty: next[idx].qty - 1 };
      return next;
    });
  }

  const foodCartTotal     = foodCart.reduce((s,c) => s + c.item.price * c.qty, 0);
  const foodCartCount     = foodCart.reduce((s,c) => s + c.qty, 0);
  const drinkCartTotal    = drinkCart.reduce((s,c) => s + c.item.price * c.qty, 0);
  const drinkCartCount    = drinkCart.reduce((s,c) => s + c.qty, 0);
  const hookahCartTotal   = hookahCart.length * HOOKAH_PRICE;
  const unifiedCartCount  = hookahCart.length + foodCartCount + drinkCartCount;
  const unifiedCartTotal  = hookahCartTotal + foodCartTotal + drinkCartTotal;

  const BACKEND_URL = "https://cavali-backend.onrender.com/api/orders";

  async function placeUnifiedOrder() {
    if (unifiedCartCount === 0 || !customer) return;

    const order = {
      id: Date.now(),
      kind: "mixed",
      hookahs: hookahCart.map(h => ({ ...h })),
      food: foodCart.map(c => ({ ...c })),
      drinks: drinkCart.map(c => ({ ...c })),
      total: unifiedCartTotal,
      table: tableNum || LOUNGE.table,
      note: orderNote.trim(),
      customerName: customer.name || customerName,
    };

    let chaiOrder = null;
    if (karakChaiEligible) {
      chaiOrder = {
        id: `chai-${Date.now()}`,
        kind: "chai",
        name: "Karak Chai",
        price: CHAI_PRICE,
        free: true,
        table: tableNum || LOUNGE.table,
        customerName: customer.name || customerName,
      };
    }

    try {
      await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
      });
      if (chaiOrder) {
        await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chaiOrder)
        });
      }
    } catch(e) { console.log("Backend error:", e) }

    setSessionOrders(prev => [...prev, order, ...(chaiOrder ? [chaiOrder] : [])]);
    setActiveOrder(order);

    if (hookahCart.length > 0) {
      let newLifetime = customer.hookahCount + hookahCart.length;
      finishOrder(order, newLifetime);
    }

    setHookahCart([]);
    setFoodCart([]);
    setDrinkCart([]);
    setOrderNote("");
    setKarakChaiEligible(false);
    setScreen("tracking");
  }

  function handleCallServer(type: string, label: string) {
    setServerRequest({ type, label, status:"pending" });
    setShowServerPanel(false);
  }

  /* ── Mixer helpers ────────────────────────────────────────── */
  function addFlavorToMix(flavor: Flavor) {
    if (sectionOf(flavor.id)?.noMix) return;            // House Mix — cannot be blended
    if (mixFlavors.some(i => i.flavor.id === flavor.id)) return;
    if (mixFlavors.length >= 8) return;
    const currentSum = mixFlavors.reduce((s,i) => s+i.ratio, 0);
    const ratio = Math.min(100-currentSum, 20);
    setMixFlavors(prev => [...prev, { flavor, ratio: Math.max(10, ratio) }]);
    triggerSmokeAnimation();
  }
  function removeFlavorFromMix(id: string) { setMixFlavors(prev => prev.filter(i => i.flavor.id !== id)); }
  function adjustFlavorRatio(id: string, amount: number) {
    setMixFlavors(prev => prev.map(i => i.flavor.id === id ? { ...i, ratio: Math.max(10, Math.min(100, i.ratio+amount)) } : i));
    triggerSmokeAnimation();
  }
  function handleConfirmMix() {
    const total = mixFlavors.reduce((s,i) => s+i.ratio, 0);
    if (total !== 100 || mixFlavors.length === 0) return;
    const sorted = [...mixFlavors].sort((a,b) => b.ratio - a.ratio);
    const mixFlavor = {
      id: `mix-${Date.now()}`, isMix: true,
      name: sorted.map(i => `${i.ratio}% ${i.flavor.name}`).join(" + "),
      family: "Custom Mix", color: sorted[0].flavor.color,
      colors: sorted.slice(0,2).map(i => i.flavor.color),
      allColors: sorted.map(i => i.flavor.color),
      desc: "Custom blend", 
      mixDetails: sorted.map(i => ({ id: i.flavor.id, name: i.flavor.name, ratio: i.ratio })),
    };
    setSelectedFlavor(mixFlavor);
    setShowMixModal(false);
    setMixFlavors([]);
  }

  /* ── Computed ─────────────────────────────────────────────── */
  const progress          = customer ? (Number(customer.hookahCount) || 0) % 4 : 0;
  const recs              = customer ? getRecommendations(customer) : [];
  const hookahLine        = sessionOrders.flatMap(o => o.kind === "mixed" ? (o.hookahs || []) : (o.kind === "hookah" ? [o] : []));
  const chaiLine          = sessionOrders.filter(o => o.kind === "chai");
  const foodLine          = sessionOrders.flatMap(o => o.kind === "mixed" ? (o.food || []) : (o.kind === "food" ? o.items : []));
  const drinkLine         = sessionOrders.flatMap(o => o.kind === "mixed" ? (o.drinks || []) : (o.kind === "drink" ? o.items : []));
  const total             = sessionOrders.reduce((s, o) => {
    const val = o.kind === "mixed" ? o.total : (o.kind === "hookah" || o.kind === "chai" ? o.price : (o.total ?? 0));
    return s + (Number(val) || 0);
  }, 0);
  const savedAmount       = sessionOrders.reduce((s, o) => {
    const val = o.free ? (o.kind === "hookah" || (o.kind === "mixed" && o.free) ? HOOKAH_PRICE : CHAI_PRICE) : 0;
    return s + (Number(val) || 0);
  }, 0);
  const hookahOrdersSoFar = sessionOrders.reduce((count, o) => count + (o.kind === "mixed" && o.hookahs ? o.hookahs.length : (o.kind === "hookah" ? 1 : 0)), 0);
  const showKarakChaiPromo= hookahOrdersSoFar === 1;
  const mixTotalRatio     = mixFlavors.reduce((s,i) => s+i.ratio, 0);
  const isMixValid        = mixFlavors.length >= 1 && mixTotalRatio === 100;
  const isRegistrationFormValid = 
    customerName.trim().length >= 2 && 
    phoneDigits.length === 10 && 
    tableNumInput.trim().length > 0 && 
    !isNaN(parseInt(tableNumInput, 10)) && 
    parseInt(tableNumInput, 10) > 0;
  const showFloatingCall  = ["dashboard","tracking","bill"].includes(screen);

  const currentSectionFlavors = FLAVOR_SECTIONS[activeSection]?.flavors ?? [];
  const mixSectionFlavors     = MIXABLE_SECTIONS[mixSection]?.flavors ?? [];


  if (!appReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.container, styles.loadingWrap, {
          opacity: welcomeFade,
          transform: [{
            translateY: welcomeFade.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0]
            })
          }]
        }]}>
          <Image source={require("../../assets/images/logo.png")} style={{ width: 280, height: 100, marginBottom: 16 }} resizeMode="contain" />
          {theme === "light" ? (
            <View style={{
              borderWidth: 1.5,
              borderColor: COLORS.gold,
              borderRadius: 30,
              paddingHorizontal: 24,
              paddingVertical: 8,
              marginTop: 12,
              backgroundColor: "#FDFCFB",
              shadowColor: COLORS.gold,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 2
            }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#6A4E3E", letterSpacing: 0.5, textAlign: "center" }}>
                As-salamu alaykum
              </Text>
            </View>
          ) : (
            <Text style={{ fontSize: 24, fontWeight: "600", color: COLORS.gold, marginTop: 16 }}>As-salamu alaykum</Text>
          )}
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} backgroundColor={COLORS.night}/>
      <View style={styles.container}>

        {/* ── Server Banner ─────────────────────────────────── */}
        {serverRequest && (
          <View style={styles.serverBanner}>
            <View style={styles.serverBannerLeft}>
              <View style={[styles.serverStatusDot,
                serverRequest.status==="processing" && styles.serverStatusDotPulse,
                serverRequest.status==="completed"  && styles.serverStatusDotDone,
              ]}/>
              <Text style={styles.serverBannerText}>
                {serverRequest.status==="pending"    && `Requesting ${serverRequest.label}…`}
                {serverRequest.status==="processing" && `Preparing: ${serverRequest.label}`}
                {serverRequest.status==="completed"  && `${serverRequest.label} is on the way!`}
              </Text>
            </View>
            {serverRequest.status !== "completed" && (
              <TouchableOpacity onPress={() => setServerRequest(null)}>
                <Text style={styles.serverCancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ════════════════ WELCOME & CHECK-IN ════════════════ */}
        {screen === "scan" && (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={20}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <Panel>
                {/* Header row with Theme toggle */}
                <View style={{ flexDirection: "row", justifyContent: "flex-end", width: "100%", paddingHorizontal: 16, paddingTop: 10 }}>
                  <TouchableOpacity 
                    style={{
                      width: 44, height: 44, borderRadius: 22,
                      backgroundColor: COLORS.card2, borderColor: COLORS.line, borderWidth: 1,
                      alignItems: "center", justifyContent: "center"
                    }} 
                    onPress={() => setTheme(t => t === "dark" ? "light" : "dark")}
                    activeOpacity={0.8}
                  >
                    {theme === "dark" ? <Sun size={20} color={COLORS.gold} /> : <Moon size={20} color={COLORS.gold} />}
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 30 }}>
                  <View style={{ alignItems: "center", marginTop: 10, marginBottom: 12 }}>
                    <Text style={styles.eyebrow}>Welcome to</Text>
                    <Text style={[styles.loungeName, { textAlign: "center", marginTop: 2, marginBottom: 8 }]}>
                      {LOUNGE.name}
                    </Text>

                    {theme === "light" ? (
                      <View style={{
                        borderWidth: 1.5,
                        borderColor: COLORS.gold,
                        borderRadius: 30,
                        paddingHorizontal: 24,
                        paddingVertical: 8,
                        marginTop: 12,
                        backgroundColor: "#FDFCFB",
                        shadowColor: COLORS.gold,
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.15,
                        shadowRadius: 6,
                        elevation: 2
                      }}>
                        <Text style={{ fontSize: 20, fontWeight: "700", color: "#6A4E3E", letterSpacing: 0.5, textAlign: "center" }}>
                          As-salamu alaykum
                        </Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 24, fontWeight: "600", color: COLORS.gold, marginTop: 12 }}>As-salamu alaykum</Text>
                    )}
                  </View>

                  {tableScanMode === "input" ? (
                    /* Default Mode: Consolidated Check-in Form */
                    <View style={{ marginTop: 14 }}>
                      <Text style={[styles.subText, { textAlign: "center", marginBottom: 16, fontSize: 15.12 }]}>
                        Enter your details below to access the menu and rewards.
                      </Text>

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Your Name</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. John Doe"
                          placeholderTextColor={COLORS.muted}
                          value={customerName}
                          onChangeText={setCustomerName}
                          autoCapitalize="words"
                          maxLength={30}
                        />
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="(555) 000-0000"
                          placeholderTextColor={COLORS.muted}
                          value={formatPhone(phoneDigits)}
                          onChangeText={handlePhoneChange}
                          keyboardType="phone-pad"
                          maxLength={14}
                        />
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Table Number</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. 7"
                          placeholderTextColor={COLORS.muted}
                          value={tableNumInput}
                          onChangeText={setTableNumInput}
                          keyboardType="number-pad"
                          maxLength={4}
                        />
                      </View>

                      <TouchableOpacity
                        style={[styles.btn, styles.btnPrimary, !isRegistrationFormValid && styles.btnDisabled, { marginTop: 16 }]}
                        disabled={!isRegistrationFormValid}
                        onPress={submitPhone}
                      >
                        <Text style={styles.btnPrimaryText}>Check-in & View Menu</Text>
                        <ArrowRight size={17} color="#20140C"/>
                      </TouchableOpacity>

                      <TouchableOpacity style={{ marginTop: 24, alignItems: "center" }} onPress={() => setTableScanMode("qr")}>
                        <Text style={{ color: COLORS.gold, fontSize: 15.12, fontWeight: "600", textDecorationLine: "underline" }}>
                          📷 Or Scan Table QR Code Instead
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* Scanner Mode: Simulated QR Scanner Viewfinder */
                    <View style={{ width: "100%", alignItems: "center", marginTop: 14, gap: 14 }}>
                      <Text style={[styles.subText, { textAlign: "center", paddingHorizontal: 16, fontSize: 15.12 }]}>
                        Scan the QR code on your table to automatically fill the table number.
                      </Text>

                      <View style={styles.qr}>
                        <View style={styles.viewfinderCornerTopLeft}/>
                        <View style={styles.viewfinderCornerTopRight}/>
                        <View style={styles.viewfinderCornerBottomLeft}/>
                        <View style={styles.viewfinderCornerBottomRight}/>
                        {scanState === "idle" && (
                          <View style={styles.qrInnerIcon}><QrCode size={56} color={COLORS.muted}/></View>
                        )}
                        {scanState === "scanning" && (
                          <View style={styles.qrInnerIcon}>
                            <ActivityIndicator size="large" color={COLORS.ember}/>
                            <Animated.View style={[styles.laser, { transform:[{ translateY: laserTranslateY }] }]}/>
                          </View>
                        )}
                        {scanState === "success" && (
                          <View style={[styles.qrInnerIcon, styles.qrSuccessBadge]}>
                            <Check size={48} color="#0E0A08"/>
                          </View>
                        )}
                      </View>

                      {scanState === "idle" && (
                        <TouchableOpacity style={[styles.btn, styles.btnPrimary, { width:"80%" }]} onPress={triggerTableScan}>
                          <QrCode size={18} color="#20140C"/>
                          <Text style={styles.btnPrimaryText}>Scan Table QR Code</Text>
                        </TouchableOpacity>
                      )}
                      {scanState === "scanning" && (
                        <Text style={[styles.validationText, { color:COLORS.ember }]}>Connecting to table…</Text>
                      )}
                      {scanState === "success" && (
                        <Text style={[styles.validationText, { color:COLORS.teal, fontSize:18.9 }]}>
                          ✓ Table {tableNum} · {loungeName} synced!
                        </Text>
                      )}

                      <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setTableScanMode("input")}>
                        <Text style={{ color: COLORS.gold, fontSize: 15.12, fontWeight: "600", textDecorationLine: "underline" }}>
                          ⌨️ Or Enter Table Number Manually
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </Panel>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        )}

        {/* ════════════════ LOADING ════════════════ */}
        {screen === "loading" && (
          <Panel>
            <View style={styles.loadingWrap}>
              <Image source={require("../../assets/images/logo.png")} style={{ width: 280, height: 100, marginBottom: 16 }} resizeMode="contain" />
              <View style={{ alignItems:"center" }}>
                <Text style={styles.loadingTitle}>Syncing rewards…</Text>
                <Text style={styles.subText}>Retrieving your visit history</Text>
              </View>
            </View>
          </Panel>
        )}

        {/* ════════════════ DASHBOARD ════════════════ */}
        {screen === "dashboard" && customer && (
          <View style={{ flex:1 }}>

            {/* ─ Shared Header ─ */}
            <View style={[styles.topRow, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>Table {tableNum||LOUNGE.table} · {loungeName||LOUNGE.name}</Text>
                <Text style={styles.greet} numberOfLines={1}>
                  {customer.hookahCount > 0 ? `Welcome back, ${customer.name} 👋` : `Welcome, ${customer.name} 👋`}
                </Text>
              </View>
              <TouchableOpacity 
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: COLORS.card2, borderColor: COLORS.line, borderWidth: 1,
                  alignItems: "center", justifyContent: "center", marginLeft: 12
                }} 
                onPress={() => setTheme(t => t === "dark" ? "light" : "dark")}
                activeOpacity={0.8}
              >
                {theme === "dark" ? <Sun size={20} color={COLORS.gold} /> : <Moon size={20} color={COLORS.gold} />}
              </TouchableOpacity>
            </View>

            <Animated.View style={{ flex: 1, opacity: tabFade, transform: [{ translateY: tabFade.interpolate({ inputRange: [0.3, 1], outputRange: [15, 0] }) }] }}>

            {/* ══════════ HOOKAH TAB ══════════ */}
            {mainTab === "hookah" && (
              <ScrollView 
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: selectedFlavor ? 240 : (unifiedCartCount > 0 ? 140 : 60) }}>

              {/* Loyalty Card */}
              <View style={styles.loyaltyCardHighlighted}>
                <View style={[styles.ringWrap, { width: 120, height: 120 }]}>
                  <Svg width={120} height={120} viewBox="0 0 110 110">
                    <Circle cx="55" cy="55" r={48} fill="none" stroke={theme === "dark" ? "#2E2018" : "#E6DFD9"} strokeWidth="8"/>
                    <Circle cx="55" cy="55" r={48} fill="none" stroke="url(#eG)" strokeWidth="8"
                      strokeLinecap="round" strokeDasharray={`${(progress / 4) * (2 * Math.PI * 48)} ${(2 * Math.PI * 48)}`} transform="rotate(-90 55 55)"/>
                    <Defs>
                      <LinearGradient id="eG" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FF5A1F"/>
                        <Stop offset="100%" stopColor="#E5B13A"/>
                      </LinearGradient>
                    </Defs>
                  </Svg>
                  <View style={styles.ringCenter}>
                    <Flame size={22} color="#FF5A1F"/>
                    <Text style={styles.ringCount}>{progress}/4</Text>
                  </View>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={styles.loyaltyLabelText}>CAVALI REWARDS</Text>
                  {progress === 0 && customer.hookahCount > 0
                    ? <Text style={styles.loyaltyMainHighlightText}>🎉 Free hookah unlocked!</Text>
                    : <Text style={styles.loyaltyMainHighlightText}>
                        Buy <Text style={{ color:COLORS.ember }}>{4-progress} more</Text> hookah{4-progress===1?"":"s"} to get one <Text style={{ color:COLORS.gold }}>FREE</Text>!
                      </Text>
                  }
                  <Text style={styles.loyaltySubText}>Order 2 hookahs → get a Karak Chai FREE</Text>
                </View>
              </View>

              {/* Karak Chai Promo */}
              {showKarakChaiPromo && (
                <Animated.View style={[styles.flashPromoCard, { opacity:flashAnim }]}>
                  <Sparkles size={20} color={COLORS.gold}/>
                  <View style={{ flex:1 }}>
                    <Text style={styles.flashPromoTitle}>🔥 KARAK CHAI OFFER ACTIVE!</Text>
                    <Text style={styles.flashPromoSub}>
                      Order <Text style={{ color:COLORS.ember, fontWeight:"700" }}>1 more hookah</Text> and get a hot <Text style={{ color:COLORS.gold, fontWeight:"700" }}>Karak Chai FREE!</Text>
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Recommended Flavor Banner */}
              {customer && recs.length > 0 && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={styles.sectionLabel}>Recommended for You</Text>
                  <TouchableOpacity
                    style={[
                      styles.recommendationBannerCard,
                      selectedFlavor?.id === recs[0].id && styles.flavorCardSelected
                    ]}
                    onPress={() => setSelectedFlavor(selectedFlavor?.id === recs[0].id ? null : recs[0])}
                  >
                    <View style={styles.recommendationTag}>
                      <Text style={styles.recommendationTagText}>
                        {customer?.history?.length > 0 ? "YOUR FAVORITE" : "POPULAR CHOICE"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={[styles.flavorIconWrap, { marginRight: 16, backgroundColor: "rgba(229,177,58,0.08)" }]}>
                        <FlavorIcon id={recs[0].id} color={recs[0].color} size={32}/>
                      </View>
                      <View style={{ flex: 1, paddingRight: 80 }}>
                        <Text style={{ fontSize: 20.16, fontWeight: "800", color: COLORS.cream, marginBottom: 4 }}>{recs[0].name}</Text>
                        <Text style={{ fontSize: 15.12, color: COLORS.muted, lineHeight: 20.16 }} numberOfLines={2}>{recs[0].desc}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Custom Mix button */}
              <TouchableOpacity style={styles.actionCard} onPress={() => { setShowMixModal(true); setMixFlavors([]); setMixSection(0); }}>
                <View style={styles.actionIconCircle}>
                  <Sliders size={20} color={COLORS.ember}/>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={styles.actionCardTitle}>Custom Blend Mixer</Text>
                  <Text style={styles.actionCardSub}>Mix any flavors from any section with custom ratios</Text>
                </View>
                <ChevronRight size={18} color={COLORS.muted}/>
              </TouchableOpacity>

              {/* Section tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionTabs}
                contentContainerStyle={{ paddingHorizontal:16, gap:8 }}>
                {FLAVOR_SECTIONS.map((s,i) => (
                  <TouchableOpacity key={s.id} style={[styles.sectionTab, activeSection===i && styles.sectionTabActive]}
                    onPress={() => setActiveSection(i)}>
                    <Text style={[styles.sectionTabText, activeSection===i && styles.sectionTabTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}

              </ScrollView>

              {/* Section header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>{FLAVOR_SECTIONS[activeSection]?.label}</Text>
                {FLAVOR_SECTIONS[activeSection]?.noMix && (
                  <View style={styles.signatureBadge}><Text style={styles.signatureBadgeText}>SIGNATURE</Text></View>
                )}
              </View>

              {/* Flavor list */}
              <View style={{ paddingHorizontal: 8, marginBottom: 16 }}>
                {currentSectionFlavors.map(f => {
                  const isSelected = selectedFlavor?.id === f.id;
                  const hookahImg = getHookahImage(f.id);
                  return (
                    <TouchableOpacity key={f.id}
                      style={[styles.menuItemCard, isSelected && { borderColor: COLORS.ember, borderWidth: 1.5 }]}
                      onPress={() => setSelectedFlavor(isSelected ? null : f)}>
                      <View style={{ flex: 1, paddingRight: 4 }}>
                        <Text style={[styles.menuItemName, { fontSize: 18.9, fontWeight: "700" }]}>{f.name}</Text>
                        {f.desc ? <Text style={[styles.menuItemDesc, { fontSize: 13.86, color: COLORS.muted, marginTop: 4 }]} numberOfLines={3}>{f.desc}</Text> : null}
                        {FLAVOR_SECTIONS[activeSection]?.noMix && (
                          <View style={[styles.signatureBadge, { alignSelf: "flex-start", marginTop: 8 }]}>
                            <Text style={styles.signatureBadgeText}>★ SIGNATURE</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={{ width: 100, height: 100, borderRadius: 12, overflow: "hidden", backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.line, marginLeft: 12 }}>
                        <Image source={hookahImg} style={{ width: "100%", height: "100%", resizeMode: "cover" }} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            )}{/* end hookah tab */}

            {/* ══════════ FOOD TAB ══════════ */}
            {mainTab === "food" && (
              <View style={{ flex:1 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  style={[styles.sectionTabs, { marginBottom:0 }]}
                  contentContainerStyle={{ paddingHorizontal:16, gap:8 }}>
                  {FOOD_MENU.map((s,i) => (
                    <TouchableOpacity key={s.id}
                      style={[styles.sectionTab, activeFoodSection===i && { borderColor:s.color, backgroundColor:s.color+"22" }]}
                      onPress={() => setActiveFoodSection(i)}>
                      <Text style={styles.sectionTabIcon}>{s.icon}</Text>
                      <Text style={[styles.sectionTabText, activeFoodSection===i && { color:s.color }]}>{s.subtitle}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView 
                  style={{ flex: 1 }}
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={{ paddingHorizontal:8, paddingBottom: unifiedCartCount > 0 ? 140 : 60 }}>
                  <View style={{ marginTop:12, marginBottom:8 }}>
                    <Text style={styles.menuSectionTitle}>{FOOD_MENU[activeFoodSection]?.title}</Text>
                    <Text style={styles.menuSectionSubtitle}>{FOOD_MENU[activeFoodSection]?.subtitle}</Text>
                  </View>
                  {FOOD_MENU[activeFoodSection]?.items.map(item => {
                    const cartEntry = foodCart.find(c => c.item.id === item.id && !item.requiresSauce);
                    const sauceEntries = item.requiresSauce ? foodCart.filter(c => c.item.id === item.id) : [];
                    const totalQty = item.requiresSauce ? sauceEntries.reduce((s,c) => s+c.qty, 0) : (cartEntry?.qty ?? 0);
                    return (
                      <View key={item.id} style={styles.menuItemCard}>
                        <View style={{ flex: 1, paddingRight: 4 }}>
                          <Text style={[styles.menuItemName, { fontSize: 18.9, fontWeight: "700" }]} numberOfLines={2}>{item.name}</Text>
                          {item.desc ? <Text style={[styles.menuItemDesc, { fontSize: 13.86, color: COLORS.muted, marginTop: 4 }]} numberOfLines={3}>{item.desc}</Text> : null}
                          <Text style={[styles.menuItemPrice, { fontSize: 16.38, fontWeight: "800", color: COLORS.gold, marginTop: 8 }]}>${item.price}</Text>
                          
                          {item.requiresSauce && sauceEntries.length > 0 && (
                            <View style={{ flexDirection:"row", flexWrap:"wrap", gap:4, marginTop:8 }}>
                              {sauceEntries.map(e => (
                                <View key={e.sauce} style={styles.sauceTag}>
                                  <Text style={styles.sauceTagText}>{e.sauce} x{e.qty}</Text>
                                  <TouchableOpacity onPress={() => removeFromFoodCart(item.id, e.sauce)}>
                                    <Text style={{ color:COLORS.danger, fontSize:13.86, fontWeight:"700", marginLeft:4 }}>x</Text>
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                        
                        <View style={{ width: 100, height: 100, alignItems: "center", justifyContent: "center", position: "relative", marginLeft: 12 }}>
                          <View style={{ width: 100, height: 100, borderRadius: 12, overflow: "hidden", backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.line }}>
                            {MENU_IMAGES[item.id] ? (
                              <Image source={MENU_IMAGES[item.id]} style={{ width: "100%", height: "100%", resizeMode: "cover" }} />
                            ) : (
                              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                                <Text style={{ fontSize: 36 }}>{item.emoji}</Text>
                              </View>
                            )}
                          </View>
                          
                           <View style={{ position: "absolute", bottom: -8, left: 4, right: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 4, alignItems: "center" }}>
                            {totalQty > 0 ? (
                              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card2, borderRadius: 20, borderWidth: 1, borderColor: COLORS.ember, height: 28, paddingHorizontal: 4 }}>
                                {!item.requiresSauce ? (
                                  <>
                                    <TouchableOpacity style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}
                                      onPress={() => removeFromFoodCart(item.id)}>
                                      <Minus size={12} color={COLORS.cream}/>
                                    </TouchableOpacity>
                                    <Text style={{ color: COLORS.cream, fontWeight: "800", fontSize: 13.86, marginHorizontal: 8 }}>{totalQty}</Text>
                                    <TouchableOpacity style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}
                                      onPress={() => addToFoodCart(item)}>
                                      <Plus size={12} color={COLORS.ember}/>
                                    </TouchableOpacity>
                                  </>
                                ) : (
                                  <>
                                    <Text style={{ color: COLORS.cream, fontWeight: "800", fontSize: 13.86, marginLeft: 10, marginRight: 6 }}>{totalQty}</Text>
                                    <TouchableOpacity style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}
                                      onPress={() => addToFoodCart(item)}>
                                      <Plus size={12} color={COLORS.ember}/>
                                    </TouchableOpacity>
                                  </>
                                )}
                              </View>
                            ) : (
                              <TouchableOpacity 
                                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.ember, borderRadius: 20, height: 28, paddingHorizontal: 12 }}
                                onPress={() => addToFoodCart(item)}>
                                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 12.6 }}>ADD</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* ══════════ DRINKS TAB ══════════ */}
            {mainTab === "drinks" && (
              <View style={{ flex:1 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  style={[styles.sectionTabs, { marginBottom:0 }]}
                  contentContainerStyle={{ paddingHorizontal:16, gap:8 }}>
                  {DRINKS_MENU.map((s,i) => (
                    <TouchableOpacity key={s.id}
                      style={[styles.sectionTab, activeDrinkSection===i && { borderColor:s.color, backgroundColor:s.color+"22" }]}
                      onPress={() => setActiveDrinkSection(i)}>
                      <Text style={styles.sectionTabIcon}>{s.icon}</Text>
                      <Text style={[styles.sectionTabText, activeDrinkSection===i && { color:s.color }]}>{s.subtitle}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView 
                  style={{ flex: 1 }}
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={{ paddingHorizontal:8, paddingBottom: unifiedCartCount > 0 ? 140 : 60 }}>
                  <View style={{ marginTop:12, marginBottom:8 }}>
                    <Text style={styles.menuSectionTitle}>{DRINKS_MENU[activeDrinkSection]?.title}</Text>
                    <Text style={styles.menuSectionSubtitle}>{DRINKS_MENU[activeDrinkSection]?.subtitle}</Text>
                  </View>
                  {DRINKS_MENU[activeDrinkSection]?.items.map(item => {
                    const entry = drinkCart.find(c => c.item.id === item.id);
                    return (
                      <View key={item.id} style={styles.menuItemCard}>
                        <View style={{ flex: 1, paddingRight: 4 }}>
                          <Text style={[styles.menuItemName, { fontSize: 18.9, fontWeight: "700" }]} numberOfLines={2}>{item.name}</Text>
                          {item.desc ? <Text style={[styles.menuItemDesc, { fontSize: 13.86, color: COLORS.muted, marginTop: 4 }]} numberOfLines={3}>{item.desc}</Text> : null}
                          <Text style={[styles.menuItemPrice, { fontSize: 16.38, fontWeight: "800", color: COLORS.gold, marginTop: 8 }]}>${item.price}</Text>
                        </View>
                        
                        <View style={{ width: 100, height: 100, alignItems: "center", justifyContent: "center", position: "relative", marginLeft: 12 }}>
                          <View style={{ width: 100, height: 100, borderRadius: 12, overflow: "hidden", backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.line }}>
                            {MENU_IMAGES[item.id] ? (
                              <Image source={MENU_IMAGES[item.id]} style={{ width: "100%", height: "100%", resizeMode: "cover" }} />
                            ) : (
                              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                                <Text style={{ fontSize: 36 }}>{item.emoji}</Text>
                              </View>
                            )}
                          </View>
                          
                          <View style={{ position: "absolute", bottom: -8, left: 4, right: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 4, alignItems: "center" }}>
                            {entry ? (
                              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card2, borderRadius: 20, borderWidth: 1, borderColor: COLORS.ember, height: 28, paddingHorizontal: 4 }}>
                                <TouchableOpacity style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}
                                  onPress={() => removeFromDrinkCart(item.id)}>
                                  <Minus size={12} color={COLORS.cream}/>
                                </TouchableOpacity>
                                <Text style={{ color: COLORS.cream, fontWeight: "800", fontSize: 13.86, marginHorizontal: 8 }}>{entry.qty}</Text>
                                <TouchableOpacity style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}
                                  onPress={() => addToDrinkCart(item)}>
                                  <Plus size={12} color={COLORS.ember}/>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity 
                                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.ember, borderRadius: 20, height: 28, paddingHorizontal: 12 }}
                                onPress={() => addToDrinkCart(item)}>
                                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 12.6 }}>ADD</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
            </Animated.View>

            {/* ══════════ Hookah cart bar (hookah tab only) ══════════ */}
            {mainTab === "hookah" && selectedFlavor && (
              <View style={styles.cartbarWrap}>
                <View style={styles.cartbarContainer}>
                  {/* Top Row: Add-ons */}
                  <View style={styles.cartbarAddonsRow}>
                    <Text style={styles.cartbarAddonsLabel}>Add-ons:</Text>
                    <TouchableOpacity style={[styles.iceToggleCheckbox, addIceHose && styles.iceToggleCheckboxActive]} onPress={() => setAddIceHose(p => !p)}>
                      <View style={[styles.iceCheckboxSquare, addIceHose && styles.iceCheckboxSquareActive]}>
                        {addIceHose && <Check size={11} color="#0E0A08" strokeWidth={3} />}
                      </View>
                      <Text style={[styles.iceCheckboxLabel, addIceHose && styles.iceCheckboxLabelActive]}>🧊 Ice Hose</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iceToggleCheckbox, addIceBase && styles.iceToggleCheckboxActive]} onPress={() => setAddIceBase(p => !p)}>
                      <View style={[styles.iceCheckboxSquare, addIceBase && styles.iceCheckboxSquareActive]}>
                        {addIceBase && <Check size={11} color="#0E0A08" strokeWidth={3} />}
                      </View>
                      <Text style={[styles.iceCheckboxLabel, addIceBase && styles.iceCheckboxLabelActive]}>❄️ Ice Base</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Bottom Row: Selected Flavor & Add Action */}
                  <View style={styles.cartbarMainRow}>
                    <View style={styles.cartbarFlavor}>
                      {selectedFlavor.colors ? (
                        <View style={styles.mixedDot}>
                          <View style={[styles.mixedDotLeft, { backgroundColor: selectedFlavor.colors[0] }]}/>
                          <View style={[styles.mixedDotRight, { backgroundColor: selectedFlavor.colors[1] }]}/>
                        </View>
                      ) : <FlavorIcon id={selectedFlavor.id} color={selectedFlavor.color} size={18}/>}
                      <View style={{ flex:1, marginLeft:8 }}>
                        <Text style={styles.cartbarText} numberOfLines={1}>{selectedFlavor.name}</Text>
                        <Text style={styles.cartbarSubText}>
                          {selectedFlavor.isMix ? "Custom Blend" : ""}
                          {(addIceHose||addIceBase) ? (selectedFlavor.isMix?" · ":"") + [addIceHose&&"Ice Hose",addIceBase&&"Ice Base"].filter(Boolean).join(" + ") : ""}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 4 }}>
                        <TouchableOpacity style={{ padding: 6 }} onPress={() => setHookahQty(q => Math.max(1, q - 1))}>
                          <Minus size={16} color={COLORS.cream}/>
                        </TouchableOpacity>
                        <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.cream, marginHorizontal: 8, minWidth: 20, textAlign: "center" }}>{hookahQty}</Text>
                        <TouchableOpacity style={{ padding: 6, backgroundColor: COLORS.gold, borderRadius: 16 }} onPress={() => setHookahQty(q => q + 1)}>
                          <Plus size={16} color="#0E0A08"/>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity style={[styles.btn, styles.btnPrimary, { paddingVertical:10, paddingHorizontal:16 }]} onPress={addToHookahCart}>
                        <Text style={styles.btnPrimaryText}>Add to Cart</Text>
                        <Plus size={15} color="#20140C"/>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ══════════ Unified Cart Bar ══════════ */}
            {unifiedCartCount > 0 && !selectedFlavor && (
              <Animated.View style={[styles.foodCartBar, { transform: [{ scale: cartBounceAnim }] }]}>
                <View style={styles.foodCartBarInfo}>
                  <View style={styles.foodCartBadge}><Text style={styles.foodCartBadgeText}>{unifiedCartCount}</Text></View>
                  <Text style={styles.foodCartBarText}>View Cart ({unifiedCartCount} item{unifiedCartCount === 1 ? "" : "s"})</Text>
                </View>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary, { paddingVertical:10, paddingHorizontal:16 }]} onPress={() => setScreen("cart")}>
                  <ShoppingCart size={15} color="#20140C"/>
                  <Text style={styles.btnPrimaryText}>Checkout</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* ══════════ Bottom Tab Bar ══════════ */}
            <View style={styles.bottomTabBar}>
              {([
                { key:"hookah" as const, label:"Hookah", Icon:Flame,    badge:0 },
                { key:"food"   as const, label:"Food",   Icon:Utensils, badge:foodCartCount },
                { key:"drinks" as const, label:"Drinks", Icon:Coffee,   badge:drinkCartCount },
              ] as const).map(tab => (
                <TouchableOpacity key={tab.key} style={styles.bottomTab} onPress={() => setMainTab(tab.key)}>
                  <View style={{ position:"relative" }}>
                    <tab.Icon size={22} color={mainTab===tab.key ? COLORS.ember : COLORS.muted}/>
                    {tab.badge > 0 && (
                      <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{tab.badge}</Text></View>
                    )}
                  </View>
                  <Text style={[styles.bottomTabLabel, mainTab===tab.key && styles.bottomTabLabelActive]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

          </View>
        )}


        {/* ════════════════ UNIFIED CART ════════════════ */}
        {screen === "cart" && (
          <Panel>
            {/* Header row with Back Button & Theme toggle */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", paddingHorizontal: 16, paddingTop: 10 }}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setScreen("dashboard")}>
                <Text style={styles.backBtnText}>← Back to Menu</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: COLORS.card2, borderColor: COLORS.line, borderWidth: 1,
                  alignItems: "center", justifyContent: "center"
                }} 
                onPress={() => setTheme(t => t === "dark" ? "light" : "dark")}
                activeOpacity={0.8}
              >
                {theme === "dark" ? <Sun size={20} color={COLORS.gold} /> : <Moon size={20} color={COLORS.gold} />}
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow:1, paddingHorizontal:16, paddingVertical:12 }}>
              <Text style={[styles.menuSectionTitle, { marginBottom: 16 }]}>Your Cart</Text>

              {hookahCart.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.menuSectionSubtitle, { color: COLORS.gold, marginBottom: 8 }]}>Hookahs</Text>
                  {hookahCart.map((h, i) => (
                    <View key={h.id} style={styles.cartItemRow}>
                      {h.flavor.colors ? (
                        <View style={styles.mixedDot}>
                          <View style={[styles.mixedDotLeft,  { backgroundColor:h.flavor.colors[0] }]}/>
                          <View style={[styles.mixedDotRight, { backgroundColor:h.flavor.colors[1] }]}/>
                        </View>
                      ) : (
                        <FlavorIcon id={h.flavor.id} color={h.flavor.color} size={18}/>
                      )}
                      <View style={{ flex:1, paddingRight: 8 }}>
                        <Text style={styles.trackFlavorChipText} numberOfLines={1}>{h.flavor.name}</Text>
                        {(h.iceHose || h.iceBase) && (
                          <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                            {h.iceHose && (
                              <View style={{ backgroundColor: "rgba(20,184,166,0.08)", borderColor: COLORS.teal, borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                                <Text style={{ color: COLORS.teal, fontSize: 11, fontWeight: "700" }}>🧊 Ice Hose</Text>
                              </View>
                            )}
                            {h.iceBase && (
                              <View style={{ backgroundColor: "rgba(20,184,166,0.08)", borderColor: COLORS.teal, borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                                <Text style={{ color: COLORS.teal, fontSize: 11, fontWeight: "700" }}>❄️ Ice Base</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                      <TouchableOpacity onPress={() => removeHookahFromCart(h.id)}>
                        <Text style={{ color: COLORS.ember, fontSize: 13.86, fontWeight: "600" }}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {foodCart.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.menuSectionSubtitle, { color: COLORS.gold, marginBottom: 8 }]}>Food</Text>
                  {foodCart.map((c, i) => (
                    <View key={i} style={styles.cartItemRow}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(245,158,11,0.1)", justifyContent: "center", alignItems: "center", marginRight: 4 }}>
                        <Text style={{ fontSize: 16.38 }}>{c.item.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.trackFlavorChipText, { fontSize: 16.38 }]} numberOfLines={1}>
                          {c.item.name}{c.sauce ? ` (${c.sauce})` : ""}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <Text style={{ color: COLORS.gold, fontSize: 17.64, fontWeight: "700" }}>x{c.qty}</Text>
                        <TouchableOpacity onPress={() => removeFromFoodCart(c.item.id, c.sauce)}>
                          <Text style={{ color: COLORS.ember, fontSize: 13.86, fontWeight: "600" }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {drinkCart.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.menuSectionSubtitle, { color: COLORS.gold, marginBottom: 8 }]}>Drinks</Text>
                  {drinkCart.map((c, i) => (
                    <View key={i} style={styles.cartItemRow}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(20,184,166,0.1)", justifyContent: "center", alignItems: "center", marginRight: 4 }}>
                        <Text style={{ fontSize: 16.38 }}>{c.item.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.trackFlavorChipText, { fontSize: 16.38 }]} numberOfLines={1}>
                          {c.item.name}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <Text style={{ color: COLORS.gold, fontSize: 17.64, fontWeight: "700" }}>x{c.qty}</Text>
                        <TouchableOpacity onPress={() => removeFromDrinkCart(c.item.id)}>
                          <Text style={{ color: COLORS.ember, fontSize: 13.86, fontWeight: "600" }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Order Notes */}
              <View style={{ marginTop: 16, marginBottom: 8, paddingHorizontal: 4 }}>
                <Text style={{ color: COLORS.muted, fontSize: 13.86, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                  Add Special Instructions / Notes
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      height: 60,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      fontSize: 15.12,
                      backgroundColor: theme === "dark" ? "#140E0C" : "#FFFFFF",
                      textAlignVertical: "top",
                      borderRadius: 10,
                      borderColor: COLORS.line,
                      borderWidth: 1,
                      color: COLORS.cream
                    }
                  ]}
                  placeholder="e.g. Extra mint, ice in base, make wings extra spicy..."
                  placeholderTextColor={COLORS.muted}
                  value={orderNote}
                  onChangeText={setOrderNote}
                  maxLength={100}
                  multiline={true}
                />
              </View>

              <View style={{ flexDirection:"row", justifyContent:"space-between", marginTop:20, paddingVertical:12, borderTopWidth:1, borderTopColor:COLORS.line }}>
                <Text style={{ color:COLORS.muted, fontSize:24.192 }}>Total</Text>
                <Text style={{ color:COLORS.cream, fontSize:27.216, fontWeight:"800" }}>${unifiedCartTotal}</Text>
              </View>
            </ScrollView>

            <View style={{ padding: 16 }}>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary, { paddingVertical:16 }]} onPress={placeUnifiedOrder}>
                <Flame size={18} color="#20140C"/>
                <Text style={[styles.btnPrimaryText, { fontSize: 19.35 }]}>Send Order to Kitchen & Bar</Text>
              </TouchableOpacity>
            </View>
            </KeyboardAvoidingView>
          </Panel>
        )}

        {/* ════════════════ TRACKING ════════════════ */}
        {screen === "tracking" && activeOrder && (
          <Panel>
            {/* Back button */}
            <TouchableOpacity style={styles.backBtn} onPress={() => setScreen("dashboard")}>
              <Text style={styles.backBtnText}>← Back to Menu</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow:1, justifyContent:"center", paddingVertical:12 }}>

              {/* ── Confirmation header ── */}
              <View style={styles.orderConfirmWrap}>
                <Animated.View style={[styles.orderConfirmIcon, { opacity: flashAnim }]}>
                  <Check size={40} color="#0E0A08"/>
                </Animated.View>
                <Text style={styles.orderConfirmTitle}>Order Sent! 🎉</Text>
                <Text style={styles.orderConfirmSub}>Thank you for your order</Text>

                {/* ── Horizontal Status Timeline ── */}
                {(() => {
                  const stageIndex = activeOrder.status === "fulfilled" ? 2 : (activeOrder.status === "sent_to_toast" ? 1 : 0);
                  return (
                    <View style={{ marginVertical: 24, paddingHorizontal: 12, width: "100%" }}>
                      <View style={{ height: 4, backgroundColor: COLORS.line, borderRadius: 2, position: "relative", width: "100%", justifyContent: "center" }}>
                        {/* Filled animated line */}
                        <Animated.View style={{
                          position: "absolute",
                          left: 0,
                          height: 4,
                          backgroundColor: COLORS.ember,
                          borderRadius: 2,
                          width: timelineProgress.interpolate({
                            inputRange: [0, 2],
                            outputRange: ["0%", "100%"]
                          })
                        }} />
                        
                        {/* Three timeline node points */}
                        <View style={{ position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", top: -14 }}>
                          {/* Node 0: Received */}
                          <Animated.View style={{
                            width: 32, height: 32, borderRadius: 16,
                            backgroundColor: stageIndex >= 0 ? COLORS.ember : COLORS.line,
                            alignItems: "center", justifyContent: "center",
                            transform: [{ scale: stageIndex === 0 ? pulseValue : 1 }]
                          }}>
                            <Check size={16} color="#000" />
                          </Animated.View>
                          
                          {/* Node 1: Preparing */}
                          <Animated.View style={{
                            width: 32, height: 32, borderRadius: 16,
                            backgroundColor: stageIndex >= 1 ? COLORS.ember : COLORS.line,
                            alignItems: "center", justifyContent: "center",
                            transform: [{ scale: stageIndex === 1 ? pulseValue : 1 }]
                          }}>
                            <Flame size={16} color={stageIndex >= 1 ? "#000" : COLORS.muted} />
                          </Animated.View>
                          
                          {/* Node 2: Served */}
                          <Animated.View style={{
                            width: 32, height: 32, borderRadius: 16,
                            backgroundColor: stageIndex >= 2 ? COLORS.teal : COLORS.line,
                            alignItems: "center", justifyContent: "center",
                            transform: [{ scale: stageIndex === 2 ? pulseValue : 1 }]
                          }}>
                            <Sparkles size={16} color={stageIndex >= 2 ? "#000" : COLORS.muted} />
                          </Animated.View>
                        </View>
                      </View>
                      
                      {/* Labels */}
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 18 }}>
                        <Text style={{ fontSize: 11.34, fontWeight: "700", color: stageIndex >= 0 ? COLORS.cream : COLORS.muted, width: 60, textAlign: "center", marginLeft: -14 }}>Received</Text>
                        <Text style={{ fontSize: 11.34, fontWeight: "700", color: stageIndex >= 1 ? COLORS.cream : COLORS.muted, width: 60, textAlign: "center" }}>Preparing</Text>
                        <Text style={{ fontSize: 11.34, fontWeight: "700", color: stageIndex >= 2 ? COLORS.teal : COLORS.muted, width: 60, textAlign: "center", marginRight: -14 }}>Served!</Text>
                      </View>
                    </View>
                  );
                })()}

              {/* Hookahs */}
              {activeOrder.kind === "mixed" && activeOrder.hookahs && activeOrder.hookahs.map((h: any, i: number) => (
                <View key={h.id} style={styles.trackFlavorChip}>
                  {h.flavor.colors ? (
                    <View style={styles.mixedDot}>
                      <View style={[styles.mixedDotLeft,  { backgroundColor:h.flavor.colors[0] }]}/>
                      <View style={[styles.mixedDotRight, { backgroundColor:h.flavor.colors[1] }]}/>
                    </View>
                  ) : (
                    <FlavorIcon id={h.flavor.id} color={h.flavor.color} size={18}/>
                  )}
                  <View style={{ flex:1, paddingRight: 8 }}>
                    <Text style={styles.trackFlavorChipText} numberOfLines={1}>{h.flavor.name}</Text>
                    {(h.iceHose || h.iceBase) && (
                      <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                        {h.iceHose && (
                          <View style={{ backgroundColor: "rgba(20,184,166,0.08)", borderColor: COLORS.teal, borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ color: COLORS.teal, fontSize: 11, fontWeight: "700" }}>🧊 Ice Hose</Text>
                          </View>
                        )}
                        {h.iceBase && (
                          <View style={{ backgroundColor: "rgba(20,184,166,0.08)", borderColor: COLORS.teal, borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ color: COLORS.teal, fontSize: 11, fontWeight: "700" }}>❄️ Ice Base</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize:16.632, color:COLORS.muted }}>· Table {activeOrder.table}</Text>
                </View>
              ))}

              {/* Food/Drink: item list */}
              {activeOrder.kind === "mixed" && (
                <View style={{ width:"100%", marginTop:12, gap:6 }}>
                  {activeOrder.food?.map((line: any, i: number) => (
                    <View key={`food-${i}`} style={{ flexDirection:"row", justifyContent:"space-between", paddingVertical:6, borderBottomWidth:1, borderBottomColor:COLORS.line }}>
                      <Text style={{ color:COLORS.cream, fontSize:19.656 }}>{line.item.emoji} {line.item.name}{line.sauce ? ` (${line.sauce})` : ""}</Text>
                      <Text style={{ color:COLORS.gold, fontSize:19.656, fontWeight:"700" }}>x{line.qty} · ${(line.item.price * line.qty).toFixed(0)}</Text>
                    </View>
                  ))}
                  {activeOrder.drinks?.map((line: any, i: number) => (
                    <View key={`drink-${i}`} style={{ flexDirection:"row", justifyContent:"space-between", paddingVertical:6, borderBottomWidth:1, borderBottomColor:COLORS.line }}>
                      <Text style={{ color:COLORS.cream, fontSize:19.656 }}>{line.item.emoji} {line.item.name}</Text>
                      <Text style={{ color:COLORS.gold, fontSize:19.656, fontWeight:"700" }}>x{line.qty} · ${(line.item.price * line.qty).toFixed(0)}</Text>
                    </View>
                  ))}
                  <View style={{ flexDirection:"row", justifyContent:"space-between", marginTop:4 }}>
                    <Text style={{ color:COLORS.muted, fontSize:19.656 }}>Total</Text>
                    <Text style={{ color:COLORS.cream, fontSize:21.168, fontWeight:"800" }}>${activeOrder.total}</Text>
                  </View>
                </View>
              )}
              </View>


              {/* ── Karak Chai promo ── */}
              {hookahOrdersSoFar >= 1 && hookahOrdersSoFar < 2 && (
                <Animated.View style={[styles.flashPromoCard, { opacity:flashAnim, marginTop:20 }]}>
                  <Sparkles size={20} color={COLORS.gold}/>
                  <View style={{ flex:1 }}>
                    <Text style={styles.flashPromoTitle}>🔥 KARAK CHAI OFFER!</Text>
                    <Text style={styles.flashPromoSub}>
                      Order <Text style={{ color:COLORS.ember, fontWeight:"700" }}>1 more hookah</Text> and get a hot{" "}
                      <Text style={{ color:COLORS.gold, fontWeight:"700" }}>Karak Chai FREE!</Text>
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* ── Karak Chai already unlocked ── */}
              {hookahOrdersSoFar >= 2 && (
                <View style={[styles.flashPromoCard, { borderColor:COLORS.teal, backgroundColor:"rgba(20,184,166,0.08)", marginTop:20 }]}>
                  <Coffee size={20} color={COLORS.teal}/>
                  <View style={{ flex:1 }}>
                    <Text style={[styles.flashPromoTitle, { color:COLORS.teal }]}>✔️ KARAK CHAI UNLOCKED!</Text>
                    <Text style={styles.flashPromoSub}>A free hot Karak Chai has been added to your order.</Text>
                  </View>
                </View>
              )}

              {/* ── Action buttons ── */}
              <View style={{ gap:12, marginTop:28 }}>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => {
                  setKarakChaiEligible(true);   // mark as ordering immediately from confirmation
                  setScreen("dashboard");
                }}>
                  <Flame size={17} color="#20140C"/>
                  <Text style={styles.btnPrimaryText}>Order Another Flavor</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setScreen("bill")}>
                  <Text style={styles.btnGhostText}>Request the Bill</Text>
                  <CreditCard size={16} color={COLORS.cream}/>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </Panel>
        )}

        {/* ════════════════ BILL ════════════════ */}
        {screen === "bill" && (
          <Panel>
            {/* Header row with Back Button & Theme toggle */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", paddingHorizontal: 16, paddingTop: 10 }}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setScreen("dashboard")}>
                <Text style={styles.backBtnText}>← Back to Menu</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: COLORS.card2, borderColor: COLORS.line, borderWidth: 1,
                  alignItems: "center", justifyContent: "center"
                }} 
                onPress={() => setTheme(t => t === "dark" ? "light" : "dark")}
                activeOpacity={0.8}
              >
                {theme === "dark" ? <Sun size={20} color={COLORS.gold} /> : <Moon size={20} color={COLORS.gold} />}
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow:1, paddingHorizontal:16, paddingVertical:12 }}>
              <View style={{ flex:1, justifyContent:"space-between" }}>
                <View>
                  <Text style={styles.eyebrow}>Table {tableNum||LOUNGE.table}</Text>
                  <Text style={styles.greet}>Your bill</Text>
                  <View style={{ marginTop:18 }}>

                    {/* ── Hookah section ── */}
                    {hookahLine.length > 0 && (
                      <>
                        <Text style={[styles.menuSectionSubtitle, { marginBottom:6 }]}>🔥 Hookah</Text>
                        {hookahLine.map(o => (
                          <View style={styles.billRow} key={o.id}>
                            <View style={{ flex:1, paddingRight: 8 }}>
                              <Text style={styles.billRowText}>{o.flavor?.name || "Hookah"} {o.free && "🎁"}</Text>
                              {(o.iceHose || o.iceBase) && (
                                <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                                  {o.iceHose && (
                                    <View style={{ backgroundColor: "rgba(20,184,166,0.08)", borderColor: COLORS.teal, borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                                      <Text style={{ color: COLORS.teal, fontSize: 11, fontWeight: "700" }}>🧊 Ice Hose</Text>
                                    </View>
                                  )}
                                  {o.iceBase && (
                                    <View style={{ backgroundColor: "rgba(20,184,166,0.08)", borderColor: COLORS.teal, borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                                      <Text style={{ color: COLORS.teal, fontSize: 11, fontWeight: "700" }}>❄️ Ice Base</Text>
                                    </View>
                                  )}
                                </View>
                              )}
                            </View>
                            <Text style={styles.billRowPrice}>
                              {o.free ? <Text><Text style={styles.billStrike}>${HOOKAH_PRICE}</Text> Free</Text> : `$${o.price ?? HOOKAH_PRICE}`}
                            </Text>
                          </View>
                        ))}
                      </>
                    )}

                    {/* ── Karak Chai section ── */}
                    {chaiLine.map(o => (
                      <View style={styles.billRow} key={o.id}>
                        <Text style={styles.billRowText}>{o.name} 🎁</Text>
                        <Text style={styles.billRowPrice}><Text style={styles.billStrike}>${CHAI_PRICE}</Text> Free</Text>
                      </View>
                    ))}

                    {/* ── Food section ── */}
                    {foodLine.length > 0 && (
                      <>
                        <Text style={[styles.menuSectionSubtitle, { marginBottom:6, marginTop:12 }]}>🍽 Food</Text>
                        {foodLine.map((line: any, i: number) => (
                            <View style={styles.billRow} key={`food-${i}`}>
                              <Text style={styles.billRowText}>{line.item.emoji} {line.item.name}{line.sauce ? ` (${line.sauce})` : ""} x{line.qty}</Text>
                              <Text style={styles.billRowPrice}>${(line.item.price * line.qty).toFixed(0)}</Text>
                            </View>
                        ))}
                      </>
                    )}

                    {/* ── Drinks section ── */}
                    {drinkLine.length > 0 && (
                      <>
                        <Text style={[styles.menuSectionSubtitle, { marginBottom:6, marginTop:12 }]}>☕ Drinks</Text>
                        {drinkLine.map((line: any, i: number) => (
                            <View style={styles.billRow} key={`drink-${i}`}>
                              <Text style={styles.billRowText}>{line.item.emoji} {line.item.name} x{line.qty}</Text>
                              <Text style={styles.billRowPrice}>${(line.item.price * line.qty).toFixed(0)}</Text>
                            </View>
                        ))}
                      </>
                    )}

                    <View style={styles.billTotal}>
                      <Text style={styles.billTotalText}>Total</Text>
                      <Text style={styles.billTotalText}>${total.toFixed(0)}</Text>
                    </View>
                    {savedAmount > 0 && (
                      <View style={styles.savedBanner}>
                        <Gift size={15} color={COLORS.teal}/>
                        <Text style={styles.savedBannerText}>You saved ${savedAmount} in rewards tonight</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary, { marginTop: 24 }]} onPress={() => setScreen("thanks")}>
                  <Text style={styles.btnPrimaryText}>Notify My Server</Text>
                  <Bell size={16} color="#20140C"/>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Panel>
        )}


        {/* ════════════════ THANKS ════════════════ */}
        {screen === "thanks" && (
          <Panel>
            <View style={styles.loadingWrap}>
              <View style={[styles.modalIcon, { backgroundColor:COLORS.teal }]}>
                <Check size={28} color="#20140C"/>
              </View>
              <Text style={[styles.loadingTitle, { fontSize:25.2 }]}>Your server is on the way</Text>
              <Text style={[styles.subText, { textAlign:"center" }]}>Thanks for visiting {loungeName||LOUNGE.name}. See you next time!</Text>
              <TouchableOpacity style={[styles.btn, styles.btnGhost, { marginTop:20, width:"100%" }]} onPress={restart}>
                <Text style={styles.btnGhostText}>Start New Session</Text>
              </TouchableOpacity>
            </View>
          </Panel>
        )}

        {/* ── Floating Bell ─────────────────────── */}
        {showFloatingCall && (
          <Animated.View 
            {...panResponder.panHandlers}
            style={[{
              position: "absolute",
              bottom: 150,
              right: 20,
              width: 56,
              height: 56,
              zIndex: 30,
            }, {
              transform: pan.getTranslateTransform()
            }]}
          >
            {/* Glowing continuous pulsing ripples */}
            <Animated.View style={{
              position: "absolute",
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: COLORS.ember,
              transform: [{ scale: bellPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
              opacity: bellPulse.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.4, 0.4, 0] }),
            }} />
            <TouchableOpacity 
              style={[styles.floatingCallBtn, { position: "relative", bottom: 0, right: 0 }]} 
              onPress={() => {
                triggerBellRing();
                setShowServerPanel(true);
              }} 
              activeOpacity={0.8}
            >
              <Animated.View style={{
                transform: [{
                  rotate: bellRing.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ["-20deg", "20deg"]
                  })
                }]
              }}>
                <Bell size={24} color="#20140C"/>
              </Animated.View>
              {serverRequest && <View style={styles.floatingCallBadge}/>}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Reward Modal ──────────────────────── */}
        {showRewardModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modal, { maxWidth:"95%" }]}>
              <View style={StyleSheet.absoluteFillObject}>
                {Array.from({length:14}).map((_,i) => (
                  <View key={i} style={[styles.confettiPiece, {
                    top:`${10+Math.random()*70}%`, left:`${5+Math.random()*85}%`,
                    backgroundColor: ["#FF5A1F","#E5B13A","#14B8A6","#F472B6","#F8F1EA"][i%5],
                    transform:[{rotate:`${Math.random()*360}deg`}],
                    width: 6+Math.random()*6, height: 6+Math.random()*6,
                  }]}/>
                ))}
              </View>
              <View style={styles.modalIcon}><Gift size={28} color="#20140C"/></View>
              <Text style={styles.modalTitle}>Reward Unlocked! 🎉</Text>
              {rewards.map((r, i) => (
                <View style={styles.rewardLine} key={i}>
                  {r.type==="hookah" ? <Flame size={16} color={COLORS.ember}/> : <Coffee size={16} color={COLORS.teal}/>}
                  <Text style={styles.rewardLineText}>{r.text}</Text>
                </View>
              ))}

              {/* QR code for 4th-hookah reward — server scans this */}
              {rewardQrCode && (
                <View style={styles.rewardQrWrap}>
                  <Text style={styles.rewardQrLabel}>Show this to your server</Text>
                  <Image
                    source={{ uri: rewardQrCode }}
                    style={styles.rewardQrImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.rewardQrCaption}>🔒 Unique one-time reward code</Text>
                </View>
              )}

              <TouchableOpacity style={[styles.btn, styles.btnPrimary, { width:"100%", marginTop:14 }]} onPress={dismissReward}>
                <Text style={styles.btnPrimaryText}>Nice! 🙌</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Call Server Modal ─────────────────── */}
        <Modal visible={showServerPanel} transparent animationType="slide" onRequestClose={() => setShowServerPanel(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modal, { paddingBottom:20 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Call Server</Text>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowServerPanel(false)}>
                  <X size={20} color={COLORS.muted}/>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>How can we assist Table {tableNum||LOUNGE.table}?</Text>
              <View style={styles.serverGrid}>
                {[
                  { type:"coal",    label:"Refresh Coals", desc:"Fresh coals for your bowl",    icon:Flame,    bg:"rgba(255,90,31,0.15)",   color:COLORS.ember },
                  { type:"water",   label:"Ice Water",     desc:"A fresh cold pitcher",          icon:Coffee,   bg:"rgba(20,184,166,0.15)",  color:COLORS.teal  },
                  { type:"service", label:"Call Server",   desc:"Request server assistance",     icon:Users,    bg:"rgba(229,177,58,0.15)", color:COLORS.gold  },
                  { type:"cleanup", label:"Clean Table",   desc:"Clear cups or clean spills",    icon:Star,     bg:"rgba(148,131,117,0.15)",color:COLORS.cream },
                ].map(item => (
                  <TouchableOpacity key={item.type} style={styles.serverGridItem} onPress={() => handleCallServer(item.type, item.label)}>
                    <View style={[styles.serverGridIcon, { backgroundColor: item.bg }]}>
                      <item.icon size={24} color={item.color}/>
                    </View>
                    <Text style={styles.serverGridText}>{item.label}</Text>
                    <Text style={styles.serverGridDesc}>{item.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Request the Bill — shortcut from ring button */}
              <View style={styles.serverBillDivider}/>
              <TouchableOpacity
                style={[styles.btn, styles.btnGhost, { width:"100%", marginTop:4 }]}
                onPress={() => { setShowServerPanel(false); setScreen("bill"); }}>
                <CreditCard size={16} color={COLORS.cream}/>
                <Text style={styles.btnGhostText}>Request the Bill</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ═══════════════ WING SAUCE PICKER ═══════════════ */}
        <Modal visible={showWingSauce} transparent animationType="slide" onRequestClose={() => { setShowWingSauce(false); setPendingWingItem(null); }}>
          <View style={styles.modalOverlay}>
            <View style={styles.saucePicker}>
              <Text style={styles.saucePickerTitle}>Choose Your Sauce 🍗</Text>
              <Text style={styles.saucePickerSub}>{pendingWingItem?.name} — pick one sauce</Text>
              {WING_SAUCES.map(sauce => (
                <TouchableOpacity key={sauce} style={styles.sauceOption} onPress={() => commitWingSauce(sauce)}>
                  <Text style={styles.sauceOptionText}>{sauce}</Text>
                  <ChevronRight size={16} color={COLORS.muted}/>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.btn, { width:"100%", justifyContent:"center", marginTop:8 }]} onPress={() => { setShowWingSauce(false); setPendingWingItem(null); }}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ═══════════════ MULTI-FLAVOR MIXER MODAL ═══════════════ */}
        <Modal visible={showMixModal} transparent={false} animationType="slide" onRequestClose={() => setShowMixModal(false)}>
          <SafeAreaView style={[styles.safeArea, { flex: 1, backgroundColor: COLORS.night }]}>
            
            {/* Modal Header */}
            <View style={[styles.modalHeader, { paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingBottom: 10, marginTop: 10 }]}>
              <Text style={styles.modalTitle}>Custom Blend Mixer</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowMixModal(false)}>
                <X size={20} color={COLORS.muted}/>
              </TouchableOpacity>
            </View>

            {/* Sticky Lab & Current Recipe Editor (Top Section) */}
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.line }}>
              
              {/* Mixology Lab Panel */}
              <View style={{ flexDirection: "row", backgroundColor: COLORS.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: COLORS.line, width: "100%", alignItems: "center" }}>
                
                {/* Real Hookah in Table Picture */}
                <TouchableOpacity onPress={triggerSmokeAnimation} activeOpacity={0.9} style={{ width: 100, height: 130, position: "relative", alignItems: "center", justifyContent: "center" }}>
                  <Image 
                    source={require("../../assets/images/real_hookah.jpg")} 
                    style={{ width: "100%", height: "100%", borderRadius: 12, resizeMode: "cover" }} 
                  />
                  {/* Dark gradient overlay to make smoke stand out */}
                  <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", backgroundColor: "rgba(14,10,8,0.45)", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }} />
                  
                  {/* Animated Smoke Particles */}
                  <Animated.View style={{
                    position: "absolute",
                    top: 25,
                    left: 50 - 10,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: mixFlavors.length > 0 ? mixFlavors[0].flavor.color : "rgba(248,241,234,0.3)",
                    opacity: smokeAnim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.65, 0.65, 0] }),
                    transform: [
                      { translateY: smokeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -35] }) },
                      { translateX: smokeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
                      { scale: smokeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.2] }) }
                    ]
                  }} />
                  <Animated.View style={{
                    position: "absolute",
                    top: 25,
                    left: 50 - 10,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: mixFlavors.length > 1 ? mixFlavors[1].flavor.color : (mixFlavors.length > 0 ? mixFlavors[0].flavor.color : "rgba(248,241,234,0.3)"),
                    opacity: smokeAnim.interpolate({ inputRange: [0, 0.2, 0.4, 0.8, 1], outputRange: [0, 0, 0.6, 0.6, 0] }),
                    transform: [
                      { translateY: smokeAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0, -45] }) },
                      { translateX: smokeAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0, 12] }) },
                      { scale: smokeAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.4, 0.4, 2.5] }) }
                    ]
                  }} />
                  <Animated.View style={{
                    position: "absolute",
                    top: 25,
                    left: 50 - 10,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: mixFlavors.length > 2 ? mixFlavors[2].flavor.color : "rgba(248,241,234,0.3)",
                    opacity: smokeAnim.interpolate({ inputRange: [0, 0.4, 0.6, 0.8, 1], outputRange: [0, 0, 0.55, 0.55, 0] }),
                    transform: [
                      { translateY: smokeAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0, -50] }) },
                      { translateX: smokeAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0, -4] }) },
                      { scale: smokeAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.4, 0.4, 2.8] }) }
                    ]
                  }} />
                </TouchableOpacity>

                {/* Right side status */}
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontSize: 17.64, fontWeight: "800", color: COLORS.cream }}>Mixology Laboratory</Text>
                  <Text style={{ fontSize: 13.86, color: COLORS.gold, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>
                    Chamber Filled: {mixTotalRatio}%
                  </Text>
                  
                  {mixFlavors.length > 0 ? (
                    <Text style={{ fontSize: 12.6, color: COLORS.muted, marginTop: 6 }} numberOfLines={2}>
                      {mixFlavors.map(item => `${item.ratio}% ${item.flavor.name}`).join(" · ")}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 12.6, color: COLORS.muted, marginTop: 6 }}>
                      Tap the hookah to test animation or add single flavors below to start blending.
                    </Text>
                  )}
                </View>
              </View>

              {/* Recipe percentage items (Compact & scrollable internally) */}
              <View style={{ marginTop: 10, maxHeight: 110 }}>
                {mixFlavors.length === 0 ? (
                  <View style={{ height: 44, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.card2, borderRadius: 8, borderWidth: 1, borderColor: COLORS.line }}>
                    <Text style={{ color: COLORS.muted, fontSize: 13.86 }}>No ingredients. Pick single flavors below.</Text>
                  </View>
                ) : (
                  <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 90 }} showsVerticalScrollIndicator={true}>
                    {mixFlavors.map(item => (
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6, backgroundColor: COLORS.card2, padding: 6, borderRadius: 8 }} key={item.flavor.id}>
                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                          <FlavorIcon id={item.flavor.id} color={item.flavor.color} size={14}/>
                          <Text style={{ color: COLORS.cream, fontSize: 13.86, fontWeight: "700", marginLeft: 6, flex: 1 }} numberOfLines={1}>{item.flavor.name}</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <TouchableOpacity onPress={() => adjustFlavorRatio(item.flavor.id, -10)}>
                            <Text style={{ color: COLORS.gold, fontSize: 18, fontWeight: "800", paddingHorizontal: 6 }}>−</Text>
                          </TouchableOpacity>
                          <Text style={{ color: COLORS.cream, fontSize: 13.86, fontWeight: "800", minWidth: 32, textAlign: "center" }}>{item.ratio}%</Text>
                          <TouchableOpacity onPress={() => adjustFlavorRatio(item.flavor.id, 10)}>
                            <Text style={{ color: COLORS.gold, fontSize: 18, fontWeight: "800", paddingHorizontal: 6 }}>+</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => removeFlavorFromMix(item.flavor.id)} style={{ marginLeft: 4 }}>
                            <Trash2 size={14} color={COLORS.danger}/>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Validation Status Bar */}
              {mixFlavors.length > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: isMixValid ? "rgba(20,184,166,0.1)" : mixTotalRatio > 100 ? "rgba(239,68,68,0.1)" : "rgba(229,177,58,0.1)", borderRadius: 8, gap: 8 }}>
                  <View style={{ width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: isMixValid ? COLORS.teal : mixTotalRatio > 100 ? COLORS.danger : COLORS.gold }}>
                    {isMixValid ? <Check size={11} color="#0E0A08"/> : <Star size={11} color="#0E0A08"/>}
                  </View>
                  <Text style={{ fontSize: 13.86, fontWeight: "700", color: isMixValid ? COLORS.teal : mixTotalRatio > 100 ? COLORS.danger : COLORS.gold }}>
                    {isMixValid ? "Blend complete! Ready to select (100%)" : mixTotalRatio < 100 ? `${100-mixTotalRatio}% remaining to reach 100%` : `Over limit by ${mixTotalRatio-100}%`}
                  </Text>
                </View>
              )}
            </View>

            {/* Scrollable Flavors Selector Section (Bottom section) */}
            <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10 }}>
              <Text style={{ color: COLORS.muted, fontSize: 13.86, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                Add Flavors — Choose Section
              </Text>
              
              {/* Category tabs inside mixer */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 44, flexGrow: 0, marginBottom: 8 }}>
                {MIXABLE_SECTIONS.map((sec, idx) => (
                  <TouchableOpacity key={sec.id}
                    style={[styles.sectionTab, { paddingVertical: 6, marginRight: 8, height: 32 },
                      mixSection === idx && { borderColor: sec.sectionColor, backgroundColor: sec.sectionColor + "22" }]}
                    onPress={() => setMixSection(idx)}>
                    <Text style={[styles.sectionTabText, mixSection === idx && { color: sec.sectionColor }]}>
                      {sec.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={styles.mixerFlavorGrid}>
                  {mixSectionFlavors.map((f: Flavor) => {
                    const isInMix = mixFlavors.some(i => i.flavor.id === f.id);
                    return (
                      <TouchableOpacity key={f.id}
                        disabled={isInMix}
                        style={[styles.mixerFlavorGridItem, isInMix && { opacity: 0.35 }]}
                        onPress={() => addFlavorToMix(f)}>
                        <FlavorIcon id={f.id} color={f.color} size={20}/>
                        <Text style={styles.mixerGridItemName} numberOfLines={1}>{f.name}</Text>
                        {isInMix
                          ? <View style={styles.mixerGridAddBadgeDone}><Check size={11} color={COLORS.teal}/></View>
                          : <View style={styles.mixerGridAddBadge}><Plus size={11} color={COLORS.cream}/></View>
                        }
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Action Button (Fixed at bottom) */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.line }}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, { width: "100%" }, !isMixValid && styles.btnDisabled]}
                disabled={!isMixValid}
                onPress={handleConfirmMix}>
                <Sliders size={18} color="#20140C"/>
                <Text style={styles.btnPrimaryText}>Confirm Blend & Select</Text>
              </TouchableOpacity>
            </View>

          </SafeAreaView>
        </Modal>
        
        {/* Fly to Cart Particles Overlay */}
        {flyParticles.map(p => {
          const tx = flyAnim.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [120, 40, 0]
          });
          const ty = flyAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [180, 520]
          });
          const scale = flyAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1.2, 0.5]
          });
          const opacity = flyAnim.interpolate({
            inputRange: [0, 0.8, 1],
            outputRange: [1, 1, 0]
          });
          
          return (
            <Animated.View 
              key={p.id} 
              pointerEvents="none"
              style={{
                position: "absolute",
                zIndex: 9999,
                left: "45%",
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: p.color,
                shadowColor: p.color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 5,
                elevation: 8,
                transform: [
                  { translateX: tx },
                  { translateY: ty },
                  { scale }
                ],
                opacity
              }} 
            />
          );
        })}

      </View>
    </SafeAreaView>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                                STYLES                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getStyles(COLORS: typeof DARK_COLORS) {
  return StyleSheet.create({
  safeArea:   { flex:1, backgroundColor:COLORS.night },
  container:  { flex:1, paddingHorizontal:14, paddingVertical:20, backgroundColor:COLORS.night },
  panel:      { flex:1, justifyContent:"space-between" },
  eyebrow:    { fontSize:13.86, textTransform:"uppercase", letterSpacing:1.4, color:COLORS.muted, fontWeight:"700", marginBottom:6 },
  loungeName: { fontSize:46, fontWeight:"800", color:COLORS.cream, lineHeight:52, marginTop:8, marginBottom:4 },
  tableChip:  { flexDirection:"row", alignItems:"center", backgroundColor:COLORS.card, borderColor:COLORS.line, borderWidth:1, paddingHorizontal:14, paddingVertical:6, borderRadius:999, width:120, gap:6, justifyContent:"center", marginTop:6 },
  tableChipText: { fontSize:16.38, color:COLORS.gold, fontWeight:"600" },
  subText:    { color:COLORS.muted, fontSize:17.02, marginTop:12, lineHeight:25.2 },
  btn:        { borderRadius:16, paddingVertical:16, paddingHorizontal:20, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8 },
  btnPrimary: { backgroundColor:COLORS.ember },
  btnPrimaryText: { color:"#20140C", fontWeight:"700", fontSize:18.9 },
  btnDisabled:{ opacity:0.35 },
  btnGhost:   { backgroundColor:"transparent", borderColor:COLORS.line, borderWidth:1 },
  btnGhostText: { color:COLORS.cream, fontWeight:"700", fontSize:18.9 },
  btnTeal:    { backgroundColor:COLORS.teal },
  btnTealText:{ color:"#0B2C28", fontWeight:"700", fontSize:18.9 },
  loadingWrap:{ flex:1, justifyContent:"center", alignItems:"center", gap:18 },
  coal:       { width:64, height:64, borderRadius:32, backgroundColor:COLORS.ember, shadowColor:COLORS.ember, shadowOffset:{width:0,height:0}, shadowOpacity:0.8, shadowRadius:20, elevation:10 },
  loadingTitle: { fontSize:22.68, fontWeight:"700", color:COLORS.cream, textAlign:"center" },

  /* Scan */
  scanWrap:   { flex:1, justifyContent:"center", alignItems:"center", gap:24, paddingVertical:20 },
  qr:         { position:"relative", width:220, height:220, borderRadius:24, backgroundColor:COLORS.card, borderColor:COLORS.line, borderWidth:1.5, justifyContent:"center", alignItems:"center", overflow:"hidden" },
  qrInnerIcon:{ width:"100%", height:"100%", justifyContent:"center", alignItems:"center" },
  qrSuccessBadge: { backgroundColor:COLORS.teal },
  laser:      { position:"absolute", left:"10%", right:"10%", height:3, backgroundColor:COLORS.ember, shadowColor:COLORS.ember, shadowOffset:{width:0,height:0}, shadowOpacity:1, shadowRadius:10 },
  viewfinderCornerTopLeft:     { position:"absolute", top:14,    left:14,  width:24, height:24, borderTopWidth:4,    borderLeftWidth:4,  borderColor:COLORS.ember, borderTopLeftRadius:6 },
  viewfinderCornerTopRight:    { position:"absolute", top:14,    right:14, width:24, height:24, borderTopWidth:4,    borderRightWidth:4, borderColor:COLORS.ember, borderTopRightRadius:6 },
  viewfinderCornerBottomLeft:  { position:"absolute", bottom:14, left:14,  width:24, height:24, borderBottomWidth:4, borderLeftWidth:4,  borderColor:COLORS.ember, borderBottomLeftRadius:6 },
  viewfinderCornerBottomRight: { position:"absolute", bottom:14, right:14, width:24, height:24, borderBottomWidth:4, borderRightWidth:4, borderColor:COLORS.ember, borderBottomRightRadius:6 },

  /* Registration */
  inputContainer: { width:"100%", marginBottom:20 },
  inputLabel: { fontSize:13.86, textTransform:"uppercase", letterSpacing:1.2, color:COLORS.muted, fontWeight:"700", marginBottom:8 },
  textInput:  { width:"100%", height:52, backgroundColor:COLORS.card, borderColor:COLORS.line, borderWidth:1.5, borderRadius:14, paddingHorizontal:16, color:COLORS.cream, fontSize:18.9, fontWeight:"600" },

  /* Dashboard */
  topRow:     { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:16, marginTop:8 },
  greet:      { fontSize:26.46, fontWeight:"700", color:COLORS.cream },
  loyaltyCardHighlighted: { backgroundColor:COLORS.card, borderColor:COLORS.gold, borderWidth:1.8, borderRadius:20, padding:18, flexDirection:"row", alignItems:"center", gap:16, marginBottom:14, shadowColor:COLORS.gold, shadowOffset:{width:0,height:2}, shadowOpacity:0.15, shadowRadius:8, elevation:4 },
  loyaltyLabelText:       { fontSize:12.6, fontWeight:"800", color:COLORS.gold, letterSpacing:1.2, marginBottom:2 },
  loyaltyMainHighlightText: { fontSize:18.9, fontWeight:"800", color:COLORS.cream, lineHeight:27.72, marginBottom:4 },
  loyaltySubText:         { fontSize:14.5, color:COLORS.muted, lineHeight:20.16 },
  flashPromoCard: { backgroundColor:"rgba(229,177,58,0.08)", borderColor:COLORS.gold, borderWidth:1.2, borderRadius:16, padding:14, flexDirection:"row", alignItems:"center", gap:12, marginBottom:14 },
  flashPromoTitle:{ fontSize:14.5, fontWeight:"800", color:COLORS.gold, letterSpacing:1, marginBottom:2 },
  flashPromoSub:  { fontSize:15.12, color:COLORS.cream, lineHeight:22.68 },
  actionCard:  { backgroundColor:COLORS.card, borderColor:COLORS.line, borderWidth:1, borderRadius:18, padding:14, flexDirection:"row", alignItems:"center", gap:14, marginBottom:18 },
  actionIconCircle: { width:44, height:44, borderRadius:22, backgroundColor:"rgba(255,90,31,0.12)", justifyContent:"center", alignItems:"center" },
  actionCardTitle: { fontSize:18.28, fontWeight:"700", color:COLORS.cream, marginBottom:2 },
  actionCardSub:   { fontSize:15.12, color:COLORS.muted },
  recommendationBannerCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.line,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    position: "relative",
    overflow: "hidden"
  },
  recommendationTag: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: COLORS.ember + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.ember
  },
  recommendationTagText: {
    fontSize: 11.34,
    color: COLORS.ember,
    fontWeight: "800"
  },

  /* Section tabs */
  sectionLabel: { fontSize:15.12, textTransform:"uppercase", letterSpacing:1, color:COLORS.muted, fontWeight:"700", marginVertical:10 },
  sectionTab:         { paddingHorizontal:14, paddingVertical:8, borderRadius:20, borderWidth:1.5, borderColor:COLORS.line, marginRight:8, backgroundColor:"transparent", flexDirection:"row", alignItems:"center", gap:5 },
  sectionTabActive:   { borderColor:COLORS.ember, backgroundColor:COLORS.ember+"22" },
  sectionTabIcon:     { fontSize:17.64 },
  sectionTabText:     { fontSize:16.38, color:COLORS.muted, fontWeight:"600" },
  sectionTabTextActive: { color:COLORS.ember },

  /* Flavor cards */
  recCard:    { width:130, backgroundColor:COLORS.card, borderColor:COLORS.line, borderWidth:1, borderRadius:16, padding:12, marginRight:12 },
  recSwatch:  { height:60, borderRadius:10, marginBottom:10 },
  recName:    { fontSize:16.38, fontWeight:"700", color:COLORS.cream },
  recFam:     { fontSize:13.86, color:COLORS.muted },
  grid:       { flexDirection:"row", flexWrap:"wrap", justifyContent:"space-between", gap:12, marginBottom:20 },
  flavorCard: { width:"48%", backgroundColor:COLORS.card, borderColor:COLORS.line, borderWidth:1.5, borderRadius:16, padding:14 },
  flavorCardSelected: { shadowColor:COLORS.ember, shadowOffset:{width:0,height:0}, shadowOpacity:0.3, shadowRadius:10 },
  flavorIconHeader: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  flavorDotMini: { width:8, height:8, borderRadius:4 },
  flavorName: { fontSize:17.64, fontWeight:"700", color:COLORS.cream, marginBottom:4 },
  flavorDesc: { fontSize:14.5, color:COLORS.muted, lineHeight:20.16 },

  /* Cart bar */
  cartbarWrap:  { position:"absolute", bottom:76, left:0, right:0, zIndex:20 },
  cartbarContainer: {
    backgroundColor: COLORS.card2,
    borderColor: COLORS.line,
    borderWidth: 1.5,
    borderRadius: 18,
    overflow: "hidden",
    marginHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  cartbarAddonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  cartbarAddonsLabel: { fontSize:13.86, color:COLORS.muted, fontWeight:"700", marginRight:2 },
  iceToggleCheckbox: { flexDirection:"row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1.5, borderColor: COLORS.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, gap: 6, flexShrink: 0 },
  iceToggleCheckboxActive: { borderColor: COLORS.teal, backgroundColor: "rgba(20,184,166,0.08)" },
  iceCheckboxSquare: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: COLORS.muted, backgroundColor: "transparent", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  iceCheckboxSquareActive: { borderColor: COLORS.teal, backgroundColor: COLORS.teal },
  iceCheckboxLabel: { fontSize: 13.86, fontWeight: "600", color: COLORS.muted },
  iceCheckboxLabelActive: { color: COLORS.teal },
  cartbarMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cartbarFlavor: { flexDirection:"row", alignItems:"center", flex:1 },
  cartbarText:   { fontSize:17.02, fontWeight:"600", color:COLORS.cream },
  cartbarSubText:{ fontSize:13.86, color:COLORS.muted, marginTop:1 },

  /* Tracking */
  trackWrap:  { flex:1, alignItems:"center", paddingTop:20 },
  trackFlavorChip: { flexDirection:"row", alignItems:"center", gap:10, backgroundColor:COLORS.card, borderColor:COLORS.line, borderWidth:1, paddingHorizontal:16, paddingVertical:10, borderRadius:999, marginBottom:12, maxWidth:"90%" },
  trackFlavorChipText: { color:COLORS.cream, fontWeight:"700", fontSize:17.64, flexShrink:1 },
  stepsContainer: { width:"100%" },
  step:       { flexDirection:"row", alignItems:"center", gap:14, paddingVertical:14, position:"relative" },
  stepIcon:   { width:38, height:38, borderRadius:19, alignItems:"center", justifyContent:"center", backgroundColor:COLORS.card, borderColor:COLORS.line, borderWidth:1.5, zIndex:1 },
  stepActive: { borderColor:COLORS.ember, backgroundColor:COLORS.ember },
  stepDone:   { borderColor:COLORS.teal,  backgroundColor:COLORS.teal  },
  stepLine:   { position:"absolute", left:18, top:50, bottom:-14, width:2, backgroundColor:COLORS.line },
  stepLineDone:{ backgroundColor:COLORS.teal },
  stepTitle:  { fontWeight:"700", fontSize:18.28, color:COLORS.cream },
  stepTitlePending: { color:COLORS.muted, fontWeight:"500" },
  stepSub:    { fontSize:15.12, color:COLORS.muted },

  /* Served */
  servedCard: { backgroundColor:COLORS.card, borderColor:COLORS.line, borderWidth:1, borderRadius:20, padding:24, alignItems:"center", marginVertical:24 },
  servedCardTitle: { fontWeight:"700", fontSize:22.68, color:COLORS.cream, marginBottom:6 },

  /* Bill */
  billRow:    { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingVertical:12, borderBottomWidth:1, borderBottomColor:COLORS.line },
  billRowText:{ fontSize:17.64, color:COLORS.cream },
  billRowPrice:{ fontSize:17.64, color:COLORS.cream, fontWeight:"500" },
  billStrike: { textDecorationLine:"line-through", color:COLORS.muted, marginRight:6 },
  billTotal:  { flexDirection:"row", justifyContent:"space-between", paddingTop:16 },
  billTotalText: { fontSize:22.68, fontWeight:"800", color:COLORS.cream },
  savedBanner: { backgroundColor:"rgba(20,184,166,0.12)", borderColor:COLORS.teal, borderWidth:1, paddingHorizontal:12, paddingVertical:10, borderRadius:12, marginTop:14, flexDirection:"row", alignItems:"center", gap:8 },
  savedBannerText: { color:COLORS.teal, fontSize:15.76, fontWeight:"700", flex:1 },

  /* Ring */
  ringWrap:   { position:"relative" },
  ringCenter: { position:"absolute", top:0, left:0, right:0, bottom:0, justifyContent:"center", alignItems:"center", gap:2 },
  ringCount:  { fontSize:16.38, color:COLORS.muted, fontWeight:"600" },

  /* Modals */
  modalOverlay: { position:"absolute", top:0, left:0, right:0, bottom:0, backgroundColor:"rgba(10,7,5,0.72)", justifyContent:"center", alignItems:"center", zIndex:40, padding:20 },
  modal:      { width:"100%", backgroundColor:COLORS.card, borderColor:COLORS.line, borderWidth:1, borderRadius:22, paddingHorizontal:22, paddingVertical:24, alignItems:"center", position:"relative", overflow:"hidden" },
  modalHeader:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", width:"100%", marginBottom:14 },
  modalCloseBtn: { padding:4 },
  modalSubtitle: { color:COLORS.muted, fontSize:17.64, marginBottom:18, width:"100%", textAlign:"left" },
  modalIcon:  { width:64, height:64, borderRadius:32, backgroundColor:COLORS.ember, justifyContent:"center", alignItems:"center", marginBottom:14 },
  modalTitle: { fontWeight:"800", fontSize:25.2, color:COLORS.cream },
  rewardLine: { flexDirection:"row", alignItems:"center", gap:10, backgroundColor:COLORS.night, borderColor:COLORS.line, borderWidth:1, borderRadius:12, paddingHorizontal:12, paddingVertical:10, marginBottom:10, width:"100%" },
  rewardLineText: { color:COLORS.cream, fontSize:16.38, flex:1 },
  confettiPiece: { position:"absolute", width:8, height:8, borderRadius:2 },

  /* Floating bell */
  floatingCallBtn: { position:"absolute", bottom:150, right:20, width:56, height:56, borderRadius:28, backgroundColor:COLORS.ember, justifyContent:"center", alignItems:"center", shadowColor:COLORS.ember, shadowOffset:{width:0,height:4}, shadowOpacity:0.4, shadowRadius:10, elevation:6, zIndex:30 },
  floatingCallBadge: { position:"absolute", top:-2, right:-2, width:14, height:14, borderRadius:7, backgroundColor:COLORS.teal, borderWidth:2, borderColor:COLORS.night },

  /* Server banner */
  serverBanner: { position:"absolute", top:10, left:22, right:22, backgroundColor:COLORS.card2, borderColor:COLORS.line, borderWidth:1, borderRadius:14, paddingHorizontal:14, paddingVertical:12, flexDirection:"row", alignItems:"center", justifyContent:"space-between", zIndex:25, shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.3, shadowRadius:4, elevation:4 },
  serverBannerLeft: { flexDirection:"row", alignItems:"center", gap:10, flex:1 },
  serverStatusDot: { width:10, height:10, borderRadius:5, backgroundColor:COLORS.gold },
  serverStatusDotPulse: { backgroundColor:COLORS.ember },
  serverStatusDotDone:  { backgroundColor:COLORS.teal  },
  serverBannerText:   { color:COLORS.cream, fontSize:16.38, fontWeight:"600", flex:1 },
  serverCancelText:   { color:COLORS.danger, fontSize:15.76, fontWeight:"700", marginLeft:10 },
  serverGrid:    { flexDirection:"row", flexWrap:"wrap", justifyContent:"space-between", gap:12, width:"100%" },
  serverGridItem:{ width:"48%", backgroundColor:COLORS.night, borderColor:COLORS.line, borderWidth:1, borderRadius:16, padding:14, alignItems:"center" },
  serverGridIcon:{ width:48, height:48, borderRadius:24, justifyContent:"center", alignItems:"center", marginBottom:10 },
  serverGridText:{ color:COLORS.cream, fontSize:17.64, fontWeight:"700", marginBottom:4 },
  serverGridDesc:  { color:COLORS.muted,  fontSize:13.86, textAlign:"center", lineHeight:17.64 },
  serverBillDivider: { width:"100%", height:1, backgroundColor:COLORS.line, marginVertical:12 },

  /* Mixer */
  ratioBarContainer: { width:"100%", marginBottom:10 },
  ratioBarCard: { position:"relative", height:32, justifyContent:"center", borderRadius:16, overflow:"hidden" },
  mixerSectionLabel: { fontSize:13.86, fontWeight:"700", color:COLORS.muted, textTransform:"uppercase", letterSpacing:1, marginTop:16, marginBottom:8 },
  mixListContainer: { backgroundColor:COLORS.night, borderColor:COLORS.line, borderWidth:1, borderRadius:16, padding:12, width:"100%", marginBottom:14 },
  emptyMixCard: { alignItems:"center", justifyContent:"center", paddingVertical:24 },
  emptyMixText: { color:COLORS.muted, fontSize:15.76, textAlign:"center", lineHeight:22.68 },
  mixItemRow:   { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingVertical:10, borderBottomWidth:1, borderBottomColor:COLORS.line },
  mixItemInfo:  { flexDirection:"row", alignItems:"center", gap:8, flex:1, marginRight:10 },
  mixItemName:  { color:COLORS.cream, fontSize:17.02, fontWeight:"600", flex:1 },
  mixItemControllers: { flexDirection:"row", alignItems:"center" },
  ratioAdjustBtnMini: { width:28, height:28, borderRadius:6, backgroundColor:COLORS.card2, borderColor:COLORS.line, borderWidth:1, justifyContent:"center", alignItems:"center" },
  ratioAdjustBtnTextMini: { color:COLORS.cream, fontSize:18.9, fontWeight:"700" },
  ratioDisplayValue: { color:COLORS.cream, fontSize:16.38, fontWeight:"700", width:44, textAlign:"center" },
  mixItemDelete: { padding:6, marginLeft:8 },
  validationBanner: { flexDirection:"row", alignItems:"center", gap:10, marginBottom:14, width:"100%", justifyContent:"center" },
  validationBadge:  { width:22, height:22, borderRadius:11, justifyContent:"center", alignItems:"center" },
  validationText:   { fontSize:16.38, fontWeight:"700" },
  mixerFlavorGrid: { flexDirection:"row", flexWrap:"wrap", gap:8, width:"100%" },
  mixerFlavorGridItem: { width:"48%", flexDirection:"row", alignItems:"center", justifyContent:"space-between", backgroundColor:COLORS.card2, borderColor:COLORS.line, borderWidth:1, borderRadius:12, paddingHorizontal:10, paddingVertical:10 },
  mixerGridItemName: { color:COLORS.cream, fontSize:15.76, fontWeight:"600", flex:1, marginHorizontal:8 },
  mixerGridAddBadge: { width:18, height:18, borderRadius:9, backgroundColor:COLORS.line, justifyContent:"center", alignItems:"center" },
  mixerGridAddBadgeDone: { width:18, height:18, borderRadius:9, backgroundColor:"rgba(20,184,166,0.15)", justifyContent:"center", alignItems:"center" },
  mixedDot:    { width:16, height:16, borderRadius:8, overflow:"hidden", flexDirection:"row", flexShrink: 0 },
  mixedDotLeft:  { flex:1, height:"100%" },
  mixedDotRight: { flex:1, height:"100%" },

  /* House Mix lock banner (inside mixer modal) */
  houseLockBanner: { flexDirection:"row", alignItems:"flex-start", gap:12, backgroundColor:"rgba(46,32,24,0.6)", borderColor:COLORS.line, borderWidth:1.5, borderRadius:16, padding:16, marginBottom:8, width:"100%" },
  houseLockIcon:   { fontSize:24 },
  houseLockTitle:  { fontSize:17.64, fontWeight:"800", color:COLORS.cream, marginBottom:4 },
  houseLockSub:    { fontSize:15.76, color:COLORS.muted, lineHeight:22.68 },

  /* Signature badge shown on House Mix flavor cards */
  signatureBadge:     { backgroundColor:"rgba(229,177,58,0.15)", borderColor:COLORS.gold, borderWidth:1, borderRadius:8, paddingHorizontal:5, paddingVertical:2 },
  signatureBadgeText: { fontSize:11.34, fontWeight:"800", color:COLORS.gold, letterSpacing:0.5 },

  /* Order Confirmed screen */
  orderConfirmWrap:  { flex:1, alignItems:"center", justifyContent:"center", gap:16, paddingHorizontal:8 },
  orderConfirmIcon:  { width:88, height:88, borderRadius:44, backgroundColor:COLORS.teal, justifyContent:"center", alignItems:"center", shadowColor:COLORS.teal, shadowOffset:{width:0,height:0}, shadowOpacity:0.5, shadowRadius:20, elevation:8 },
  orderConfirmTitle: { fontSize:32.76, fontWeight:"800", color:COLORS.cream, textAlign:"center" },
  orderConfirmSub:   { fontSize:18.9, color:COLORS.muted, textAlign:"center", marginTop:-8 },

  /* Back button on confirmation screen */
  backBtn:     { flexDirection:"row", alignItems:"center", alignSelf:"flex-start", paddingVertical:6, paddingHorizontal:4, marginBottom:4 },
  backBtnText: { fontSize:17.02, fontWeight:"700", color:COLORS.muted },

  /* 4th-hookah reward QR code */
  rewardQrWrap:    { width:"100%", alignItems:"center", marginVertical:12, backgroundColor:COLORS.night, borderColor:COLORS.gold, borderWidth:1.5, borderRadius:16, paddingVertical:16, paddingHorizontal:12 },
  rewardQrLabel:   { fontSize:15.12, fontWeight:"700", color:COLORS.gold, textTransform:"uppercase", letterSpacing:1, marginBottom:10 },
  rewardQrImage:   { width:160, height:160, borderRadius:8 },
  rewardQrCaption: { fontSize:13.86, color:COLORS.muted, marginTop:8, textAlign:"center" },

  /* ── Bottom Tab Bar ── */
  bottomTabBar: {
    flexDirection:"row", backgroundColor:COLORS.card, borderTopWidth:1,
    borderTopColor:COLORS.line, paddingBottom:8, paddingTop:8,
  },
  bottomTab: { flex:1, alignItems:"center", justifyContent:"center", gap:3 },
  bottomTabLabel: { fontSize:12.6, color:COLORS.muted, fontWeight:"600", letterSpacing:0.3 },
  bottomTabLabelActive: { color:COLORS.ember },
  tabBadge: {
    position:"absolute", top:-5, right:-8, backgroundColor:COLORS.ember,
    borderRadius:8, minWidth:16, height:16, alignItems:"center", justifyContent:"center",
    paddingHorizontal:3,
  },
  tabBadgeText: { fontSize:11.34, color:"#0E0A08", fontWeight:"800" },

  /* ── Menu Section Header ── */
  menuSectionTitle:    { fontSize:22.68, fontWeight:"800", color:COLORS.cream, letterSpacing:-0.3, marginBottom:2 },
  menuSectionSubtitle: { fontSize:15.12, color:COLORS.muted, fontWeight:"600", textTransform:"uppercase", letterSpacing:1 },

  /* ── Menu Item Card ── */
  menuItemCard: {
    flexDirection:"row", alignItems:"center", backgroundColor:COLORS.card,
    borderRadius:14, paddingVertical:14, paddingHorizontal:14,
    marginBottom:12, borderWidth:1, borderColor:COLORS.line,
    minHeight:128,
  },
  cartItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    borderColor: COLORS.line,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
    width: "100%",
  },
  menuItemEmoji:  { width:44, height:44, borderRadius:10, backgroundColor:COLORS.card2, alignItems:"center", justifyContent:"center" },
  menuItemName:   { fontSize:17.64, fontWeight:"700", color:COLORS.cream, flex:1 },
  menuItemPrice:  { fontSize:14.11, fontWeight:"800", color:COLORS.gold },
  menuItemDesc:   { fontSize:14.5, color:COLORS.muted, marginTop:2, lineHeight:18.9 },

  /* ── Qty Controls ── */
  qtyControls: { flexDirection:"row", alignItems:"center", gap:6 },
  qtyBtn: {
    width:28, height:28, borderRadius:8, borderWidth:1, borderColor:COLORS.line,
    backgroundColor:COLORS.card2, alignItems:"center", justifyContent:"center",
  },
  qtyBtnAdd: { backgroundColor:COLORS.ember, borderColor:COLORS.ember },
  qtyCount: { fontSize:17.64, fontWeight:"700", color:COLORS.cream, minWidth:18, textAlign:"center" },

  /* ── Food / Drink Cart Bar ── */
  foodCartBar: {
    flexDirection:"row", alignItems:"center", justifyContent:"space-between",
    backgroundColor:COLORS.card, borderTopWidth:1, borderTopColor:COLORS.line,
    paddingVertical:10, paddingHorizontal:16, gap:10,
  },
  foodCartBarInfo:  { flexDirection:"row", alignItems:"center", gap:8 },
  foodCartBadge:    { backgroundColor:COLORS.ember, borderRadius:12, minWidth:22, height:22, alignItems:"center", justifyContent:"center", paddingHorizontal:5 },
  foodCartBadgeText:{ fontSize:15.12, color:"#0E0A08", fontWeight:"800" },
  foodCartBarText:  { fontSize:17.64, color:COLORS.cream, fontWeight:"600" },

  /* ── Sauce Tag ── */
  sauceTag: {
    flexDirection:"row", alignItems:"center", backgroundColor:COLORS.card2,
    borderRadius:6, paddingVertical:3, paddingHorizontal:7, borderWidth:1, borderColor:COLORS.line,
  },
  sauceTagText: { fontSize:13.86, color:COLORS.cream, fontWeight:"600" },

  /* ── Flavor Icon Wrap (new grid style) ── */
  flavorIconWrap: { marginBottom:6 },
  flavorGrid:     { flexDirection:"row", flexWrap:"wrap", gap:10, paddingHorizontal:16, marginBottom:16 },

  /* ── Section header ── */
  sectionHeader: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, marginBottom:10, marginTop:8 },
  sectionHeaderTitle: { fontSize:20.16, fontWeight:"700", color:COLORS.cream },
  sectionTabs: { marginVertical:8, maxHeight:48, minHeight:48 },

  /* ── Wing Sauce Modal ── */
  saucePicker: {
    backgroundColor:COLORS.card, borderRadius:20, padding:24,
    marginHorizontal:20, borderWidth:1, borderColor:COLORS.line,
  },
  saucePickerTitle: { fontSize:22.68, fontWeight:"800", color:COLORS.cream, marginBottom:4 },
  saucePickerSub:   { fontSize:16.38, color:COLORS.muted, marginBottom:16 },
  sauceOption: {
    flexDirection:"row", alignItems:"center", justifyContent:"space-between",
    paddingVertical:13, paddingHorizontal:14, borderRadius:10,
    backgroundColor:COLORS.card2, marginBottom:8, borderWidth:1, borderColor:COLORS.line,
  },
  sauceOptionText: { fontSize:17.64, color:COLORS.cream, fontWeight:"600" },
  });
}

