"use client";
import AuthForm from "../components/AuthForm";
import { signupSchema } from "../components/formSchemas";
import OnboardingHeader from "../components/OnboardingHeader";
import { motion } from "framer-motion";


import { useSession } from "next-auth/react";

export default function Signup () {

    // const {data : session} = useSession();
    // console.log("SESSION is here", session);
    return(
        <motion.div 
            initial={{opacity: 0, y: 50}}
            whileInView={{ opacity:1, y: 0 }}
            viewport={{ once:false, amount:0.3 }}
            transition={{ duration: 1.2, ease:"easeOut", delay:1 }}
            className="rounded-2xl shadow-2xl">
            <OnboardingHeader />
            <div className="px-4 py-3 bg-white rounded-b-xl">
                <AuthForm
                    title="Welcome Back"
                    buttonLabel="Sign Up"
                    type="signup"
                    schema={signupSchema}
                    defaultValues={{ 
                        firstName: "", 
                        lastName: "" , 
                        email:"", 
                        password:"", 
                        confirmPassword:"", 
                    }}
                    onSubmit={(data) => {
                    console.log("SIGNUP:", data);
                }}
                />
            </div>
        </motion.div>
    )
}