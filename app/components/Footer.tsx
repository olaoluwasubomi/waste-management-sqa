"use client";
import Link from "next/link";

export default function Footer () {
    return (
        <div 
            className="relative flex items-center w-full px-12 md:px-10 lg:px-50 xl:px-50 py-16 bg-cover bg-center bg-no-repeat min-h-[400px]"
            style={{
                backgroundImage: "url('/images/2151230099.jpg')",
            }}
        >
            {/* DARK OVERLAY */}
            <div className="absolute inset-0 bg-black/60"></div>

            {/* CONTENT CONTAINER */}
            <div className="container mx-auto relative z-10 flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-20">
                
                {/* LEFT SIDE - MAIN CONTENT */}
                <div className="w-full lg:w-1/2">
                    <h4 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                        We can change the <span className="text-green-500">World</span> Together
                    </h4>
                    <hr className="my-6 border-white/30" />
                    <p className="mt-6 text-white text-justify text-base lg:text-lg w-full lg:w-[90%]">
                        The Power of Recycling Solutions perfect for enhancing the beauty of your space! 
                        We strive to become a leader in environmental responsibility, transforming waste 
                        into valuable resources for future generations
                    </p>
                    <button className="bg-green-600 text-white px-8 md:px-12 py-3 rounded-lg hover:bg-green-700 transition mt-10 font-semibold">
                        Let's Talk
                    </button>
                </div>

                {/* RIGHT SIDE - CONTACT DETAILS */}
                <div className="w-full lg:w-1/2 flex flex-col items-start lg:items-end">
                    <div className="mb-6 lg:mb-8 lg:text-right">
                        <h4 className="text-xl md:text-2xl text-white font-bold">Phone</h4>
                        <p className="mt-1 text-white text-lg">+34 567 721 12 35</p>
                    </div>
                    <div className="mb-6 lg:mb-8 lg:text-right">
                        <h4 className="text-xl md:text-2xl text-white font-bold">Email</h4>
                        <p className="mt-1 text-white text-lg">info@ecowaste.com</p>
                    </div>
                    <div className="lg:text-right">
                        <h4 className="text-xl md:text-2xl text-white font-bold">Directions</h4>
                        <p className="mt-1 text-white text-lg max-w-md lg:ml-auto">
                            124, Kenny Road, Lorem ipsum dolor sit amet.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}