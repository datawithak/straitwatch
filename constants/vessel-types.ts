export function getVesselTypeLabel(shipType: number): string {
  if (shipType >= 80 && shipType <= 89) {
    const labels: Record<number, string> = {
      80: "Tanker",
      81: "Crude Oil Tanker",
      82: "Chemical Tanker",
      83: "LNG Tanker",
      84: "LPG Tanker",
      85: "Tanker",
      86: "Tanker",
      87: "Tanker",
      88: "Tanker",
      89: "Tanker",
    };
    return labels[shipType] ?? "Tanker";
  }
  if (shipType >= 70 && shipType <= 79) return "Cargo Ship";
  if (shipType === 35 || shipType === 36) return "Military Vessel";
  if (shipType === 30) return "Fishing Vessel";
  if (shipType === 52) return "Tug";
  if (shipType === 60) return "Passenger Ship";
  if (shipType >= 40 && shipType <= 49) return "High-Speed Craft";
  if (shipType === 0) return "Unknown";
  return `Vessel (type ${shipType})`;
}

export function isTanker(shipType: number): boolean {
  return shipType >= 80 && shipType <= 89;
}

export function isCargo(shipType: number): boolean {
  return shipType >= 70 && shipType <= 79;
}

export function isMilitary(shipType: number): boolean {
  return shipType === 35 || shipType === 36;
}

export function getNavStatusLabel(status: number): string {
  const labels: Record<number, string> = {
    0: "Underway using engine",
    1: "Anchored",
    2: "Not under command",
    3: "Restricted manoeuvrability",
    4: "Constrained by draught",
    5: "Moored",
    6: "Aground",
    7: "Engaged in fishing",
    8: "Underway sailing",
    15: "Unknown",
  };
  return labels[status] ?? "Unknown";
}

export function getNavStatusSimple(status: number): string {
  if (status === 0) return "Underway";
  if (status === 1) return "Anchored";
  if (status === 5) return "Moored";
  if (status === 6) return "Aground";
  return "Unknown";
}
