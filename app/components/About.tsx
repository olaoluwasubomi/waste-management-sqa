"use client"

import Image from "next/image";
import Image1 from "../../public/images/13152.jpg";
import Image2 from "../../public/images/2148999411.jpg";
import Image3 from "../../public/images/2148999412.jpg";
import Image4 from "../../public/images/2151995203.jpg";
import Image5 from "../../public/images/351.jpg";
import Image6 from "../../public/images/407795046_15cdf173-c2f0-43c5-9b9e-6057e5d4eb4f.jpg";
import { motion } from "framer-motion";



export default function About() {
    return(
        <div className="px-10 md:px-10 lg:px-20 xl:px-50 py-10 md:py-4 lg:py-20 xl:py-20 flex flex-col-reverse md:flex-col-reverse lg:flex-row xl:flex-row items-center justify-between w-full gap-x-10">
            {/* IMAGES SECTION */}
            <div className="w-full md:w-full lg:w-1/2 xl:w-1/2 shadow-2xl px-3 py-4 grid grid-cols-2 gap-2">
                <motion.div 
                    initial={{ opacity: 0, y: -30 }}
                    whileInView={{ opacity:1, y: 0 }}
                    viewport={{ once:false, amount:0.3 }}
                    transition={{ duration: 1.2, ease:"easeOut", delay:0 }}
                    className="relative w-full h-[220px]"
                >
                    <Image src={Image1} alt="Image One" fill className="object-cover rounded-lg" />
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y:30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once:false,amount:0.3 }}
                    transition={{ duration: 1.2, ease: "easeOut", delay:0.6 }}
                    className="relative w-full h-[220px]"
                >
                    <Image src={Image2} alt="Image Two" fill className="object-cover rounded-lg" />
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x:-30 }}
                    whileInView={{ opacity: 1, x:0 }}
                    viewport={{ once:false, amount:0.3 }}
                    transition={{ duration: 1.2, ease:"easeOut", delay:1.0 }}
                    className="relative w-full h-[220px]"
                >
                    <Image src={Image3} alt="Image Three" fill className="object-cover rounded-lg" />
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x:30 }}
                    whileInView={{ opacity: 1, x:0 }}
                    viewport={{ once:false , amount:0.3 }}
                    transition={{ duration: 1.2, ease:"easeOut", delay:1.4 }}
                    className="relative w-full h-[220px]"
                >
                    <Image src={Image4} alt="Image Four" fill className="object-cover rounded-lg" />
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y:30 }}
                    whileInView={{ opacity:1, y: 0 }}
                    viewport={{ once:false, amount:0.3 }}
                    transition={{ duration: 1.2, ease:"easeOut", delay:1.7 }}
                    className="relative w-full h-[220px]"
                >
                    <Image src={Image5} alt="Image Five" fill className="object-cover rounded-lg" />
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x:30 }}
                    whileInView={{ opacity:1, x: 0 }}
                    viewport={{ once:false, amount:0.3 }}
                    transition={{ duration: 1.2, ease: "easeOut", delay:2 }}
                    className="relative w-full h-[220px]"
                >
                    <Image src={Image6} alt="Image Six" fill className="object-cover rounded-lg" />
                </motion.div>
            </div>

            {/* ABOUT TEXT SECTION */}
            <div className="w-full md:w-full lg:w-1/2 xl:w-1/2">
                <div className="flex flex-col-reverse md:flex-row lg:flex-row xl:flex-row items-start justify-between w-full">
                    <div className="w-full md:w-2/3 lg:w-2/3 xl:w-2/3">
                        <h3 className="text-4xl md:text-4xl font-semibold leading-tight text-gray-900">Recycle Today For A <span className="text-green-600">Better</span> Tomorrow</h3>
                        <p className="text-base mt-2 mb-4 w-[90%]">Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit. Lorem ipsum dolor sit amet.</p>
                    </div>
                    <button className="px-6 py-3 bg-transparent border border-green-600 text-black rounded-xl font-semibold shadow-md hover:bg-green-700 hover:text-white transition xl:w-1/4 lg:w-1/4 md:w-1/4 w-2/3 mb-4 md:mb-0 lg:mb-0 xl:mb-0">About Us</button>
                </div>
                <div className="my-6 text-justify leading-7">
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quod possimus cumque nisi non amet obcaecati, inventore quas tenetur aliquid exercitationem explicabo hic nam? Voluptas similique numquam quos excepturi saepe impedit. Lorem ipsum dolor sit, amet consectetur adipisicing elit. Aliquid inventore velit nemo impedit commodi voluptates dicta tempore ad possimus accusantium provident nulla fugiat dignissimos ipsum nobis debitis sed, facere libero. Lorem ipsum dolor sit amet consectetur adipisicing elit. Cupiditate odio quidem iure hic ab eum unde, sapiente amet temporibus porro, sequi similique distinctio officiis quod quasi tenetur deserunt dolor neque. Lorem ipsum dolor sit, amet consectetur adipisicing elit. Minima id accusamus, fuga magni quidem labore soluta accusantium asperiores magnam beatae distinctio atque provident non dolorum aliquid facere, doloremque et iure? Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas assumenda, praesentium obcaecati quis reprehenderit quam vitae! Optio qui error vero laboriosam id quo ipsa soluta non architecto, facilis tempore eveniet.</p>
                </div>
            </div>
        </div>
    )
}