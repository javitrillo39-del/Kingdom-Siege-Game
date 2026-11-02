import { Castle, Map, MessageCircle, Shield, Sparkles, Trees, UsersRound, Wheat } from "lucide-react";

export const enemies = [
  { id: "goblin", name: "map.goblinCamp", power: 30, reward: 70 },
  { id: "bandit", name: "map.banditFort", power: 85, reward: 160 },
  { id: "shadow", name: "map.shadowKeep", power: 180, reward: 350 },
];

export const buildings = {
  farm: {
    name: "city.farm",
    base: 60,
    Icon: Wheat,
    output: "city.farmOutput",
    resource: "food",
    benefit: "city.farmBenefit",
  },
  lumber: {
    name: "city.lumber",
    base: 70,
    Icon: Trees,
    output: "city.lumberOutput",
    resource: "wood",
    benefit: "city.lumberBenefit",
  },
  barracks: {
    name: "city.barracks",
    base: 100,
    Icon: Shield,
    output: "city.barracksOutput",
    benefit: "city.barracksBenefit",
  },
  castle: {
    name: "city.castle",
    base: 180,
    Icon: Castle,
    output: "city.castleOutput",
    resource: "gold",
    benefit: "city.castleBenefit",
  },
};

export const navigation = [
  { id: "city", label: "navigation.city", Icon: Castle },
  { id: "army", label: "navigation.army", Icon: Shield },
  { id: "map", label: "navigation.map", Icon: Map },
  { id: "social", label: "navigation.social", Icon: UsersRound },
  { id: "chat", label: "navigation.chat", Icon: MessageCircle },
  { id: "assistant", label: "navigation.assistant", Icon: Sparkles },
];

export const sectionTitles = {
  city: "sections.city",
  army: "sections.army",
  map: "sections.map",
  social: "sections.social",
  chat: "sections.chat",
  assistant: "sections.assistant",
};
