"use client"
import Image from "next/image";
import icon1 from "../../public/images/3093283_34807-removebg-preview.png";
import icon2 from "../../public/images/255951546_743f370f-a560-4111-a317-043a3142c626-removebg-preview.png";
import {motion} from "framer-motion";
export default function Process() {

    const steps = [
        {
        id: 1,
        title: "Request Pickup",
        description:"Users schedule a waste pickup from their home or business via the platform.",
        icon:icon2,
        },
        {
        id: 2,
        title: "Collector Assigned",
        description:"A nearby collector is automatically assigned to handle the request.",
        icon:icon2,
        },
        {
        id: 3,
        title: "Pickup & Sorting",
        description:"Waste is collected, sorted, and prepared for proper recycling or disposal.",
        icon:icon1,
        },
        {
        id: 4,
        title: "Recycling / Disposal",
        description:"Items are recycled or disposed of responsibly to reduce environmental impact.",
        icon:icon1,
        },
    ];


    return(
        <div className="px-10 md:px-10 lg:px-20 xl:px-50 py-10 md:py-4 lg:py-10 xl:py-20 flex flex-col md:flex-col lg:flex-row xl:flex-row items-center justify-between gap-x-10">
            {/* The Text */}
            <div className="w-full md:w-full lg:w-1/2 xl:w-1/2">
                <div className="w-full flex justify-end">
                    <button className="px-6 py-3 bg-transparent border border-green-600 text-black rounded-xl font-semibold shadow-md hover:bg-green-700 hover:text-white transition w-1/2 md:w-1/2 lg:w-1/4 xl:w-1/4">Our Process</button>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900 xl:w-[90%] lg:w-[90%]md:w-full sm:w-full">From <span className="text-green-600">Collection </span> to <span className="text-green-600">Perfection</span> every step made easy</h2>
                <p className="text-lg my-2 xl:w-[90%] lg:w-[90%]md:w-full sm:w-full">A recycling project can be processed step by step, whether for a school, business, or community.</p>
                <button className="px-6 py-3 bg-transparent border border-green-600 text-black rounded-xl font-semibold shadow-md hover:bg-green-700 hover:text-white transition xl:w-1/4 lg:w-1/4 md:w-1/2 w-1/2 xl:mt-10 lg:mt-10 md:mt-5 mt-3">Get in Touch</button>
            </div>

            <div className="w-full md:w-full lg:w-1/2 xl:w-1/2 relative">
                <div className="absolute left-12 top-0 xl:h-120 lg:h-120 md:120 h-130 mt-14 w-[2px] bg-gray-300"></div>
                {steps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration:1.0, ease:"easeOut",delay: index * 0.2 }}
                        viewport={{ once: false, amount: 0.3 }}
                        className="mt-14 flex items-start gap-6"
                    >
                        {/* Circle Icon */}
                        <div className="relative">
                            <div className="w-24 h-24 p-4 bg-gray-200 rounded-full flex items-center justify-center shadow">
                                <Image src={step.icon} alt="icon" />
                            </div>

                            {/* Number badge */}
                            <span className="absolute -top-3 -right-3 bg-green-500 text-white w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold shadow">
                                {step.id}
                            </span>
                        </div>

                        {/* Text */}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                                {step.title}
                            </h3>
                            <p className="text-gray-600 mt-2 xl:w-[90%] lg:w-[90%] md:w-full sm:w-full">
                                {step.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}