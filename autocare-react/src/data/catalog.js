// Products shown in the shop pages (taken from your inventory HTML pages)
export const CATALOG = [
  {
    "slug": "engine-oil",
    "name": "Engine Oil",
    "price": 1000,
    "image": "/media/oil/oil2.jpg",
    "category": "Auto Parts"
  },
  {
    "slug": "brake-pads",
    "name": "Brake Pads",
    "price": 1800,
    "image": "/media/brake/brake2.jpg",
    "category": "Auto Parts"
  },
  {
    "slug": "lubricants",
    "name": "Lubricants",
    "price": 1000,
    "image": "/media/oil/oil3.jpg",
    "category": "Auto Parts"
  },
  {
    "slug": "battery",
    "name": "Batteries",
    "price": 4500,
    "image": "/media/accessories/batteries.jpg",
    "category": "Auto Parts"
  },
  {
    "slug": "tires",
    "name": "Tires",
    "price": 3500,
    "image": "/media/accessories/tire.jpg",
    "category": "Auto Parts"
  },
  {
    "slug": "spark-plugs",
    "name": "Spark Plugs",
    "price": 350,
    "image": "/media/accessories/spake%20plug.jpg",
    "category": "Auto Parts"
  },
  {
    "slug": "seat-covers",
    "name": "Seat Covers",
    "price": 3500,
    "image": "/media/accessories/seat%20covers.jpg",
    "category": "Car Accessories"
  },
  {
    "slug": "phone-holder",
    "name": "Phone Holders",
    "price": 800,
    "image": "/media/accessories/phone%20holder.jpg",
    "category": "Car Accessories"
  },
  {
    "slug": "dash-camera",
    "name": "Dash Cameras",
    "price": 4500,
    "image": "/media/accessories/desh%20carmer.jpg",
    "category": "Car Accessories"
  },
  {
    "slug": "car-perfume",
    "name": "Car Perfumes",
    "price": 500,
    "image": "/media/accessories/car%20perform.jpg",
    "category": "Car Accessories"
  },
  {
    "slug": "speakers",
    "name": "Speakers",
    "price": 2800,
    "image": "/media/accessories/speaker.jpg",
    "category": "Car Accessories"
  },
  {
    "slug": "alloy-wheels",
    "name": "Alloy Wheels",
    "price": 8500,
    "image": "/media/accessories/alloy%20wheel.jpg",
    "category": "Car Accessories"
  },
  {
    "slug": "car-shampoo",
    "name": "Car Shampoo",
    "price": 350,
    "image": "/media/cleaning/carshampoo.jpg",
    "category": "Cleaning Products"
  },
  {
    "slug": "wax-polish",
    "name": "Wax / Polish",
    "price": 600,
    "image": "/media/accessories/wax.jpg",
    "category": "Cleaning Products"
  },
  {
    "slug": "tire-cleaner",
    "name": "Tire Cleaner",
    "price": 400,
    "image": "/media/cleaning/tirecleanser.jpg",
    "category": "Cleaning Products"
  },
  {
    "slug": "interior-spray",
    "name": "Interior Spray",
    "price": 450,
    "image": "/media/accessories/interior%20Spray.jpg",
    "category": "Cleaning Products"
  },
  {
    "slug": "microfiber",
    "name": "Microfiber Cloth",
    "price": 150,
    "image": "/media/accessories/microfiber.jpg",
    "category": "Cleaning Products"
  },
  {
    "slug": "jumper-cables",
    "name": "Jumper Cables",
    "price": 900,
    "image": "/media/accessories/jumper%20cable.jpg",
    "category": "Emergency & Safety"
  },
  {
    "slug": "tire-inflator",
    "name": "Tire Inflator",
    "price": 2200,
    "image": "/media/accessories/tire%20inflator.jpg",
    "category": "Emergency & Safety"
  },
  {
    "slug": "tool-kit",
    "name": "Tool Kits",
    "price": 4000,
    "image": "/media/accessories/tool%20kit.jpg",
    "category": "Emergency & Safety"
  },
  {
    "slug": "first-aid",
    "name": "First Aid Kit",
    "price": 1200,
    "image": "/media/accessories/first%20aid%20kit.jpg",
    "category": "Emergency & Safety"
  }
]

export const findItem = (slug) => CATALOG.find((p) => p.slug === slug)
