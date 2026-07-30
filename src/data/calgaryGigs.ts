export type GigCategory =
  | "delivery"
  | "rideshare"
  | "moving"
  | "painting"
  | "handyman"
  | "cleaning"
  | "pet_care"
  | "grocery"

export type CalgaryGig = {
  id: string
  title: string
  category: GigCategory
  description: string
  neighborhood: string
  payoutCad: number
  durationHours: number
  platform: string
  urgency: "same_day" | "tomorrow" | "this_week"
  requirements: string[]
}

export const CALGARY_GIGS: CalgaryGig[] = [
  {
    id: "GIG-001",
    title: "Dinner rush — SkipTheDishes",
    category: "delivery",
    description:
      "Peak dinner deliveries across Beltline and Downtown. Multi-order batches common. Bring an insulated bag.",
    neighborhood: "Beltline",
    payoutCad: 42,
    durationHours: 2.5,
    platform: "SkipTheDishes",
    urgency: "same_day",
    requirements: ["Car, bike, or e-bike", "Insulated bag"],
  },
  {
    id: "GIG-002",
    title: "Uber Eats evening shift",
    category: "delivery",
    description:
      "Cover Kensington and Hillhurst restaurants through late evening. Surge pricing usually kicks in after 6pm.",
    neighborhood: "Kensington",
    payoutCad: 38,
    durationHours: 2,
    platform: "Uber Eats",
    urgency: "same_day",
    requirements: ["Valid driver's licence or bike", "Smartphone"],
  },
  {
    id: "GIG-003",
    title: "DoorDash lunch block",
    category: "delivery",
    description:
      "Scheduled lunch block around University of Calgary and Market Mall. Expect short hops between campus and NW residential.",
    neighborhood: "University District",
    payoutCad: 28,
    durationHours: 1.5,
    platform: "DoorDash",
    urgency: "same_day",
    requirements: ["Vehicle or bike", "DoorDash app"],
  },
  {
    id: "GIG-004",
    title: "Instacart shop & deliver",
    category: "grocery",
    description:
      "Shop a full grocery order at Calgary Co-op Bridgeland and deliver to a condo nearby. Tip included in estimate.",
    neighborhood: "Bridgeland",
    payoutCad: 35,
    durationHours: 1.5,
    platform: "Instacart",
    urgency: "same_day",
    requirements: ["Car with trunk space", "Able to lift 20kg"],
  },
  {
    id: "GIG-005",
    title: "Airport rideshare runs",
    category: "rideshare",
    description:
      "Pick up YYC airport riders heading downtown and Mission. Friday evening demand is typically strong.",
    neighborhood: "YYC Airport / Downtown",
    payoutCad: 55,
    durationHours: 3,
    platform: "Uber",
    urgency: "same_day",
    requirements: ["4-door car 2012+", "Commercial insurance preferred"],
  },
  {
    id: "GIG-006",
    title: "Late-night Lyft corridor",
    category: "rideshare",
    description:
      "Cover 17th Ave SW bar strip to suburban drop-offs. Short waits between rides on weekend nights.",
    neighborhood: "17th Avenue SW",
    payoutCad: 48,
    durationHours: 2.5,
    platform: "Lyft",
    urgency: "same_day",
    requirements: ["Clean 4-door vehicle", "Night availability"],
  },
  {
    id: "GIG-007",
    title: "Apartment move — 1 bedroom",
    category: "moving",
    description:
      "Help load a 1-bedroom apartment in Marda Loop and unload in Altadore. Truck already booked — need muscle.",
    neighborhood: "Marda Loop",
    payoutCad: 120,
    durationHours: 4,
    platform: "TaskRabbit-style",
    urgency: "tomorrow",
    requirements: ["Able to lift 25kg+", "Comfortable shoes"],
  },
  {
    id: "GIG-008",
    title: "IKEA furniture assembly",
    category: "handyman",
    description:
      "Assemble a bed frame, dresser, and bookshelf for a new condo in East Village. Tools provided on site.",
    neighborhood: "East Village",
    payoutCad: 95,
    durationHours: 3,
    platform: "TaskRabbit-style",
    urgency: "this_week",
    requirements: ["Basic handyman skills", "Own screwdriver set preferred"],
  },
  {
    id: "GIG-009",
    title: "Interior touch-up painting",
    category: "painting",
    description:
      "Paint one bedroom and hallway in a bungalow near Inglewood. Primer already done — finish coats only.",
    neighborhood: "Inglewood",
    payoutCad: 180,
    durationHours: 6,
    platform: "Local listing",
    urgency: "this_week",
    requirements: ["Painting experience", "Own brushes/rollers helpful"],
  },
  {
    id: "GIG-010",
    title: "Fence stain — backyard",
    category: "painting",
    description:
      "Stain a cedar fence in Signal Hill. Stain and brushes provided. Weather window is this weekend.",
    neighborhood: "Signal Hill",
    payoutCad: 150,
    durationHours: 5,
    platform: "Local listing",
    urgency: "this_week",
    requirements: ["Outdoor work OK", "Comfortable on ladders"],
  },
  {
    id: "GIG-011",
    title: "Deep clean — 2 bed condo",
    category: "cleaning",
    description:
      "Move-out deep clean in Mission before new tenants arrive. Kitchen, baths, and floors are the priority.",
    neighborhood: "Mission",
    payoutCad: 110,
    durationHours: 4,
    platform: "TaskRabbit-style",
    urgency: "tomorrow",
    requirements: ["Cleaning supplies provided", "Attention to detail"],
  },
  {
    id: "GIG-012",
    title: "Office end-of-day tidy",
    category: "cleaning",
    description:
      "After-hours tidy of a small coworking suite in Downtown West. Vacuum, wipe desks, empty bins.",
    neighborhood: "Downtown West",
    payoutCad: 45,
    durationHours: 1.5,
    platform: "Local listing",
    urgency: "same_day",
    requirements: ["Available after 6pm", "Reliable"],
  },
  {
    id: "GIG-013",
    title: "TV wall mount install",
    category: "handyman",
    description:
      "Mount a 65\" TV on drywall in a Bowness townhouse. Stud finder and mount kit already purchased.",
    neighborhood: "Bowness",
    payoutCad: 75,
    durationHours: 1.5,
    platform: "TaskRabbit-style",
    urgency: "tomorrow",
    requirements: ["Drill experience", "Able to lift TV with help"],
  },
  {
    id: "GIG-014",
    title: "Dog walking — afternoon",
    category: "pet_care",
    description:
      "Walk two friendly labs around Nose Hill trails for 45 minutes. Keys left with building concierge.",
    neighborhood: "North Hill",
    payoutCad: 30,
    durationHours: 1,
    platform: "Rover-style",
    urgency: "same_day",
    requirements: ["Comfortable with large dogs", "Own leash optional"],
  },
  {
    id: "GIG-015",
    title: "Pet sit overnight",
    category: "pet_care",
    description:
      "Overnight stay with a calm cat in Mount Royal while owner is out of town. Feed, litter, and some company.",
    neighborhood: "Mount Royal",
    payoutCad: 65,
    durationHours: 12,
    platform: "Rover-style",
    urgency: "tomorrow",
    requirements: ["Allergic-friendly", "Overnight availability"],
  },
  {
    id: "GIG-016",
    title: "Yard clean-up & bagging",
    category: "handyman",
    description:
      "Rake leaves, bag debris, and tidy flower beds at a Ranchlands home before the next lawn cut.",
    neighborhood: "Ranchlands",
    payoutCad: 80,
    durationHours: 3,
    platform: "Local listing",
    urgency: "this_week",
    requirements: ["Outdoor work", "Bags provided"],
  },
  {
    id: "GIG-017",
    title: "Amazon Flex block",
    category: "delivery",
    description:
      "Parcel delivery block covering SE industrial to McKenzie Lake. Blocks book early — claim ASAP.",
    neighborhood: "SE Calgary",
    payoutCad: 52,
    durationHours: 3,
    platform: "Amazon Flex",
    urgency: "same_day",
    requirements: ["Car with cargo space", "Amazon Flex account"],
  },
  {
    id: "GIG-018",
    title: "Garage clean-out help",
    category: "moving",
    description:
      "Sort, haul, and load junk from a garage in Forest Lawn. Dump run arranged — need a second pair of hands.",
    neighborhood: "Forest Lawn",
    payoutCad: 100,
    durationHours: 3.5,
    platform: "Local listing",
    urgency: "tomorrow",
    requirements: ["Able to lift heavy items", "Work gloves recommended"],
  },
]

export const getGigById = (id: string): CalgaryGig | undefined => {
  return CALGARY_GIGS.find((gig) => gig.id === id)
}

export const categoryLabel = (category: GigCategory): string => {
  const labels: Record<GigCategory, string> = {
    delivery: "Delivery",
    rideshare: "Rideshare",
    moving: "Moving",
    painting: "Painting",
    handyman: "Handyman",
    cleaning: "Cleaning",
    pet_care: "Pet care",
    grocery: "Grocery",
  }
  return labels[category]
}
