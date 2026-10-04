// "use client"
// import Image from "next/image"
// import Link from "next/link";
// import { motion } from "framer-motion";
// import Image1 from "../../public/images/5071743_2640303-removebg-preview.png";
// import Image2 from "../../public/images/7884507_3794722.jpg";
// import Image3 from "../../public/images/7884850_3725847.jpg";
// import Image4 from "../../public/images/7970451_3799980.jpg";
// export default function Hero() {
//     return(
//         <div className="h-screen pt-20 flex items-center justify-between px-40 overflow-hidden bg-[linear-gradient(90deg,_#e3f3e6_0%,_#f2eee6_35%,_#e6e2f7_100%)]">

//             <motion.div 
//                 initial={{ opacity: 0, x: -30 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 1.2, ease: "easeOut" }} 
//                 className=" w-1/2">
//                 <motion.h1
//                     initial={{ opacity: 0, y: -30 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ duration: 1.2, ease: "easeOut" }}
//                     className="text-4xl md:text-5xl font-bold leading-tight text-gray-900"
//                 >
//                     Smart & Sustainable <span className="text-green-600">Waste Management</span>  
//                     For a Cleaner Tomorrow
//                 </motion.h1>

//                 <motion.p
//                     initial={{ opacity: 0, x: -30 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
//                     className="mt-5 text-gray-600 text-lg leading-relaxed"
//                 >
//                     Manage, track, and dispose waste responsibly with our modern,
//                     eco-friendly solutions.
//                 </motion.p>

//                 <motion.div
//                     initial={{ opacity: 0, y: 30 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ duration: 1.2, ease: "easeOut", delay: 0.7 }}
//                     className="mt-8 flex flex-wrap gap-4"
//                 >
//                     <button className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-md hover:bg-green-700 transition">
//                         Get Started
//                     </button>

//                     <button className="px-6 py-3 border border-green-600 text-green-700 rounded-xl font-semibold hover:bg-green-50 transition">
//                         Learn More
//                     </button>
//                 </motion.div>

//             </motion.div>

//             <motion.div 
//                 initial={{ opacity: 0, x: 30 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 1.2, ease: "easeOut" }} className="w-1/2 flex justify-center">
//                 <Image src={Image1} alt="Image One" className="max-h-[700px] w-full object-contain"/>
//             </motion.div>
//         </div>
//     )
// }





"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";

import Image1 from "../../public/images/5071743_2640303-removebg-preview.png";
import Image2 from "../../public/images/7884507_3794722-removebg-preview.png";
import Image3 from "../../public/images/7970451_3799980-removebg-preview.png";

const slides = [
  {
    id: 1,
    title: (
      <>
        Smart & Sustainable{" "}
        <span className="text-green-600 block">Waste Management</span> For a Cleaner
        Tomorrow
      </>
    ),
    text: "Manage, track, and dispose waste responsibly with our modern, eco-friendly solutions.",
    image: Image1,
  },
  {
    id: 2,
    title: (
      <>
        Reliable{" "}
        <span className="text-green-600 block">Waste Pickup Services</span> At Your
        Convenience
      </>
    ),
    text: "We connect you with trained collectors to ensure your waste is picked up safely and on time.",
    image: Image2,
  },
  {
    id: 3,
    title: (
      <>
        Making Communities{" "}
        <span className="text-green-600 block">Cleaner & Greener</span>
      </>
    ),
    text: "Join thousands of people who are choosing a cleaner environment through modern waste management.",
    image: Image3,
  },
];

export default function Hero() {
  const [index, setIndex] = useState(0);

  // Auto-slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  const slide = slides[index];

  return (
    <section className="relative h-screen pt-20 overflow-hidden bg-[linear-gradient(90deg,_#e3f3e6_0%,_#f2eee6_35%,_#e6e2f7_100%)] flex items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 1 }}
          className="w-full flex flex-col md:flex-col lg:flex-row xl:flex-row items-center justify-between px-6 md:px-10 lg:px-10 xl:px-40 py-0 md:py-44 lg:py-0 xl:py-0  absolute"
        >
          {/* LEFT TEXT */}
          <div className="w-full md:w-full lg:w-1/2 xl:w-1/2">
            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="text-4xl md:text-5xl lg:text-5xl xl:text-5xl font-bold leading-tight text-gray-900"
            >
              {slide.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
              className="mt-5 text-gray-600 text-lg leading-relaxed w-[80%]"
            >
              {slide.text}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.7 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link href="/onboarding/signup" className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-md hover:bg-green-700 transition">
                Get Started
              </Link>

              <button className="px-6 py-3 border border-green-600 text-green-700 rounded-xl font-semibold hover:bg-green-50 transition">
                Learn More
              </button>
            </motion.div>
          </div>

          {/* RIGHT IMAGE */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="w-full md:w-full lg:w-1/2 xl:w-1/2 flex justify-center"
          >
            <Image
              src={slide.image}
              alt="slide image"
              className="max-h-[400px] md:max-h-[400px] lg:max-h-[600px] xl:max-h-[700px] w-full object-contain"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* DOT INDICATORS */}
      <div className="absolute bottom-10 w-full flex justify-center gap-3 hidden">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full transition-all ${
              i === index ? "bg-green-600 scale-125" : "bg-gray-400"
            }`}
          ></div>
        ))}
      </div>
    </section>
  );
}