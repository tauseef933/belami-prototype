// Products are now served from the backend (/api/products)
// which reads backend/data/products.xlsx and filters by available images.
// This file only holds static UI configuration.

export const CATEGORIES = [
  {
    id: 'lighting',
    label: 'Lighting',
    tagline: 'Chandeliers & Sconces',
    icon: 'Lightbulb',
    accent: 'from-amber-200 to-belami-gold',
  },
  {
    id: 'fans',
    label: 'Ceiling Fans',
    tagline: 'Modern airflow',
    icon: 'Fan',
    accent: 'from-sky-200 to-belami-blue',
  },
  {
    id: 'furniture',
    label: 'Furniture',
    tagline: 'Sofas & Cabinets',
    icon: 'Sofa',
    accent: 'from-indigo-200 to-belami-navy',
  },
  {
    id: 'decor',
    label: 'Decor & Art',
    tagline: 'Walls & Accents',
    icon: 'Frame',
    accent: 'from-rose-200 to-pink-400',
  },
];

export const DEMO_ROOMS = [
  { id: 'room1', label: 'Modern Living Room', src: '/rooms/room1.jpg' },
  { id: 'room2', label: 'Elegant Dining', src: '/rooms/room2.jpg' },
  { id: 'room3', label: 'Warm Hallway', src: '/rooms/room3.jpg' },
  { id: 'room4', label: 'Classic Bedroom', src: '/rooms/room4.jpg' },
];

// Smart prompt suggestions keyed by product placement type
export const PROMPT_SUGGESTIONS = {
  ceiling: [
    'Center of ceiling above the dining table',
    'Centered directly over the coffee table',
    'In the middle of the ceiling, above the sofa',
    'Above the kitchen island, perfectly centered',
    'Centered over the bed, aligned with the headboard',
    'In the entryway foyer, above the console table',
    'Above the reading nook in the corner',
  ],
  wall: [
    'On the feature wall, at eye level',
    'Left of the doorframe at eye level',
    'Above the console table, centered',
    'Centered on the main accent wall',
    'Above the fireplace mantle, centered',
    'Between the two windows at eye level',
    'On the hallway wall, above the bench',
    'Flanking the bed on the left side',
  ],
  floor: [
    'Against the back wall, centered',
    'Facing the fireplace, centered on the rug',
    'In the left corner against the wall',
    'Center of the room as the focal piece',
    'Along the wall beneath the window',
    'On the right side, flanking the fireplace',
    'Behind the coffee table, against the sofa wall',
  ],
  tabletop: [
    'On top of the coffee table, slightly left of center',
    'On the console table, centered between lamps',
    'On the side table next to the sofa',
    'On the dining table as a centerpiece',
    'On the mantle, slightly off-center to the right',
    'On the bookshelf, third shelf from the top',
    'On the entryway table as a greeting accent',
  ],
};
