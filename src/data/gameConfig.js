import { Castle, Map, Shield, Trees, Wheat } from "lucide-react";

export const enemies = [
  { id: "goblin", name: "Goblin Camp", power: 30, reward: 70 },
  { id: "bandit", name: "Bandit Fort", power: 85, reward: 160 },
  { id: "shadow", name: "Shadow Keep", power: 180, reward: 350 },
];

export const buildings = {
  farm: {
    name: "Farm",
    base: 60,
    Icon: Wheat,
    output: "Produces food",
    resource: "food",
    benefit: "Sustains the people and provisions your armies.",
  },
  lumber: {
    name: "Lumber Mill",
    base: 70,
    Icon: Trees,
    output: "Produces wood",
    resource: "wood",
    benefit: "Supplies timber for new structures and defenses.",
  },
  barracks: {
    name: "Barracks",
    base: 100,
    Icon: Shield,
    output: "Raises army power",
    benefit: "Each barracks level contributes 8 combat power.",
  },
  castle: {
    name: "Castle",
    base: 180,
    Icon: Castle,
    output: "Produces gold",
    resource: "gold",
    benefit: "Adds 20 combat power per level and produces gold.",
  },
};

export const navigation = [
  { id: "city", label: "City", Icon: Castle },
  { id: "army", label: "Army", Icon: Shield },
  { id: "map", label: "Map", Icon: Map },
];

export const sectionTitles = {
  city: "Kingdom Development",
  army: "Royal Army",
  map: "Battle Map",
};
