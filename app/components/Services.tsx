"use client";
import Image from "next/image";
import Image1 from "../../public/images/2148999414.jpg";
import Image2 from "../../public/images/2149181970.jpg";
import Image3 from "../../public/images/2149181972.jpg";
import Image4 from "../../public/images/12179.jpg";
import { motion } from "framer-motion";

export default function Services() {
    return(
        <div className="px-10 md:px-10 lg:px-20 xl:px-50 py-4 md:py-4 lg:py-10 xl:py-15 bg-[linear-gradient(90deg,_#e3f3e6_0%,_#f2eee6_35%,_#e6e2f7_100%)] overflow-hidden w-full">
            <div className="flex flex-col-reverse md:flex-row lg:flex-row xl:flex-row xl:items-center lg:items-center md:items-center items-start justify-between w-full">
                <div className="w-full md:w-2/3 lg:w-2/3 xl:w-2/3  mt-4 md:mt-0 lg:mt-0 xl:mt-0">
                    <h3 className="text-2xl md:text-4xl lg:text-4xl xl:text-4xl font-semibold leading-tight text-gray-900">Smart Waste Management Solutions</h3>
                    <p className="text-base mt-2 mb-4 xl:w-[70%] lg:w-[70%] md:w-[70%] w-full">Explore our range of fast, affordable, and sustainable waste services built for individuals, businesses, and communities.</p>
                </div>
                <button className="px-6 py-3 bg-transparent border border-green-600 text-black rounded-xl font-semibold shadow-md hover:bg-green-700 hover:text-white transition xl:w-1/4 lg:w-1/4 md:w-1/4 w-2/3">Our Services</button>
            </div>

            <div className="flex xl:flex-row lg:flex-row md:flex-col flex-col items-center justify-center w-full gap-x-5 mt-10">
                <motion.div 
                    initial={{ opacity: 0, y: -30 }}
                    whileInView={{ opacity:1, y: 0 }}
                    viewport={{ once:false, amount:0.3 }}
                    transition={{ duration: 1.2, ease:"easeOut", delay:0 }}
                    className="h-140 xl:w-1/2 lg:w-1/2 md:w-full w-full bg-cover bg-center bg-no-repeat flex items-end justify-center p-4 rounded-xl shadow-xl "
                    style={{ backgroundImage: `url(${Image2.src})` }}
                >
                    <button className="py-3 px-6 rounded-xl text-xl font-bold bg-white w-2/3">
                    Waste Pickup
                    </button>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: -30 }}
                    whileInView={{ opacity:1, y: 0 }}
                    viewport={{ once:false, amount:0.3 }}
                    transition={{ duration: 1.2, ease:"easeOut", delay:1.0 }}
                    className="h-140 xl:w-1/2 lg:w-1/2 md:w-full w-full bg-cover bg-center bg-no-repeat flex items-end justify-center p-4 rounded-xl shadow-xl xl:mt-36 lg:mt-36 md:mt-10 mt-10"
                    style={{ backgroundImage: `url(${Image1.src})` }}
                >
                    <button className="py-3 px-6 rounded-xl text-xl font-bold bg-white w-2/3">
                    Recycling Services
                    </button>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: -30 }}
                    whileInView={{ opacity:1, y: 0 }}
                    viewport={{ once:false, amount:0.3 }}
                    transition={{ duration: 1.2, ease:"easeOut", delay:1.5 }}
                    className="h-140 xl:w-1/2 lg:w-1/2 md:w-full w-full bg-cover bg-center bg-no-repeat flex items-end justify-center p-4 rounded-xl shadow-xl mt-10 md:mt-10 lg:mt-o xl:mt-0"
                    style={{ backgroundImage: `url(${Image3.src})` }}
                >
                    <button className="py-3 px-6 rounded-xl text-xl font-bold bg-white w-2/3">
                    Bulk Waste Removal
                    </button>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: -30 }}
                    whileInView={{ opacity:1, y: 0 }}
                    viewport={{ once:false, amount:0.3 }}
                    transition={{ duration: 1.2, ease:"easeOut", delay:2 }}
                    className="h-140 xl:w-1/2 lg:w-1/2 md:w-full w-full bg-cover bg-center bg-no-repeat flex items-end justify-center p-4 rounded-xl shadow-xl xl:mt-36 lg:mt-36 md:mt-10 mt-10"
                    style={{ backgroundImage: `url(${Image4.src})` }}
                >
                    <button className="py-3 px-6 rounded-xl text-xl font-bold bg-white w-2/3">
                    E-Waste Disposal
                    </button>
                </motion.div>
            </div>

        </div>
    )
}