"use client";
import Image from "next/image";
import bgImage from "../../public/images/91170.jpg";
import { motion } from "framer-motion";
export default function Choose(){

    const features = [
        {
        title: "Fast Pickup Service",
        desc: "We provide quick and reliable waste collection for homes and businesses.",
        },
        {
        title: "Eco-Friendly Disposal",
        desc: "Your waste is handled with environmentally responsible methods.",
        },
        {
        title: "Verified Collectors",
        desc: "Our collectors are trained, approved, and background-checked for your safety.",
        },
        {
        title: "Affordable Pricing",
        desc: "Enjoy transparent, competitive pricing with no hidden fees.",
        },
    ];

    const featureData = features.map((feature, i) => {
        return(
            <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity:1, x: 0 }}
                viewport={{ once:false, amount:0.3 }}
                transition={{ duration: 1.2, ease:"easeOut", delay:i * 1.0 }}
                className="bg-white py-8 px-6 mb-5 rounded-xl shadow-xl xl:w-[90%] lg:w-[90%] md:w-full w-full"
            >
                <h4 className="text-xl font-bold">{feature.title}</h4>
                <p className="mt-3 text-base">{feature.desc}</p>
            </motion.div>
        )
    })

    return (
        <div className="px-5 md:px-10 lg:px-20 xl:px-50 py-10 md:py-4 lg:py-10 xl:py-10 bg-[linear-gradient(90deg,_#e3f3e6_0%,_#f2eee6_35%,_#e6e2f7_100%)]">
            <div className="flex items-end justify-end">
                <button className="px-6 py-3 bg-transparent border border-green-600 text-black rounded-xl font-semibold shadow-md hover:bg-green-700 hover:text-white transition xl:w-1/6 lg:w-1/6 md:w-1/2 w-1/2">Why Choose Us</button>
            </div>
            <div className="flex flex-col-reverse md:flex-col-reverse lg:flex-row xl:flex-row items-center justify-between w-full gap-x-10 mt-8">
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity:1, x: 0 }}
                    viewport={{ once:false, amount:0.3 }}
                    transition={{ duration: 1.2, ease:"easeOut", delay:0 }}
                    className="w-full md:w-full lg:w-1/2 xl:w-1/2 h-[600px] relative overflow-hidden">
                    <Image 
                        src={bgImage} 
                        alt="bakcground image"  
                        className="object-cover" 
                        fill 
                        sizes="100vw"
                        priority
                    />

                    <div className="absolute inset-0 bg-black/60"></div>
                </motion.div>
            
                <div className="xl:w-1/2 lg:w-1/2 md:w-full w-full"> 
                    {featureData}
                </div>
            </div>
        </div>
     
    )
}