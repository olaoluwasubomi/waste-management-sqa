"use client";

import Image from "next/image";
import bgImage from "../../public/images/2149181972.jpg";
import { motion } from "framer-motion";

export default function CTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration:1.0, ease:"easeOut",delay:0.5}}
      viewport={{ once: false, amount: 0.3 }}
      className="relative w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage.src})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Content */}
      <div className="relative mx-auto text-center py-30 px-4">
        <h2 className="xl:text-5xl lg:text-5xl md:text-4xl text-3xl font-bold text-white">
          Join thousands keeping their environment clean
        </h2>

        <p className="my-5 text-white text-base md:w-1/2 mx-auto">
          Schedule your waste pickup today and take the first step toward a
          cleaner, greener community.
        </p>

        <button className="px-10 py-4 bg-white text-green-700 rounded-xl font-semibold shadow-md hover:bg-green-100 transition">
          Request a Pickup
        </button>
      </div>
    </motion.div>
  );
}
