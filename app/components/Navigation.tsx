// "use client"
// import Link from "next/link"
// export default function Navigation() {
//     return(
//         <div className="fixed top-0 left-0 z-50 flex items-center justify-between w-full bg-white px-10 py-3 shadow-xl">
//             {/* LOGO */}
//             <div className="w-1/6">
//                 <h4 className="font-bold text-2xl italic">EcoWaste</h4>
//             </div>
//             {/* MENU */}
//             <div className="flex flex-1 items-center justify-center gap-x-20 ">
//                 <Link className="text-lg font-normal" href="/">About</Link>
//                 <Link className="text-lg font-normal" href="">How it Works</Link>
//                 <Link className="text-lg font-normal" href="">Services</Link>
//                 <Link className="text-lg font-normal" href="">Contact</Link>
//             </div>

//             {/* ACTION BUTTONS */}
//             <div className="w-1/6 flex justify-end">
//                 <button className="bg-green-600 text-white px-15 py-3 rounded-lg hover:bg-green-800">
//                     <Link href="" className="font-bold">Log In</Link>
//                 </button>
//             </div>
//         </div>
//     )
// }





"use client";
import { useState } from "react";
import Link from "next/link";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";

export default function Navigation() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 z-50 w-full bg-white shadow-xl">
      <div className="flex items-center justify-between px-6 py-4 md:px-10">
        
        {/* LOGO */}
        <div>
          <h4 className="font-bold text-2xl italic">EcoWaste</h4>
        </div>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center justify-center gap-x-12">
          <Link href="" className="text-lg font-normal">About</Link>
          <Link href="" className="text-lg font-normal">How it Works</Link>
          <Link href="" className="text-lg font-normal">Services</Link>
          <Link href="" className="text-lg font-normal">Contact</Link>
        </div>

        {/* DESKTOP BUTTON */}
        <div className="hidden md:flex">
          <Link href="/onboarding/login" className="bg-green-600 text-white px-15 py-3 rounded-lg font-semibold hover:bg-green-700 transition">Log In</Link>
        </div>

        {/* MOBILE HAMBURGER */}
        <div className="md:hidden cursor-pointer text-3xl" onClick={() => setOpen(!open)}>
          {open ? <AiOutlineClose /> : <AiOutlineMenu />}
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      <div
        className={`md:hidden bg-white shadow-lg transition-all duration-300 overflow-hidden ${
          open ? "max-h-80 py-4" : "max-h-0 py-0"
        }`}
      >
        <div className="flex flex-col items-start gap-4 px-6 text-lg font-medium">
          <Link href="#about" onClick={() => setOpen(false)}>About</Link>
          <Link href="#how" onClick={() => setOpen(false)}>How it Works</Link>
          <Link href="#services" onClick={() => setOpen(false)}>Services</Link>
          <Link href="#contact" onClick={() => setOpen(false)}>Contact</Link>


          <Link href="/onboarding/login" className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg text-center">Log In</Link>
        </div>
      </div>
    </nav>
  );
}
