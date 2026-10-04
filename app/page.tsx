"use client"
import Navigation from "./components/Navigation";
import Hero from "./components/HeroComponent";
import About from "./components/About";
import Services from "./components/Services";
import Process from "./components/Process";
import CTA from "./components/Cta";
import Choose from "./components/Choose";
import Footer from "./components/Footer";
export default function Home() {
  return(
    <div className="">
      <Navigation />
      <Hero />
      <About />
      <Services />
      <Process />
      <CTA />
      <Choose />
      <Footer />
    </div>
  )
}