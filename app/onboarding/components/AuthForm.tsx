"use client";
import {useForm} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF } from "react-icons/fa6";
import { AiOutlineApple } from "react-icons/ai";
import Image from "next/image";
import api from "@/lib/api";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { signIn  , useSession } from "next-auth/react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useState } from "react";


interface AuthFormProps {
  title: string;
  buttonLabel: string;
  schema: any;
  defaultValues: any;
  type: "login" | "signup" | "forgot";
  onSubmit: (data: any) => void;
}

export default function AuthForm({
    title,
    buttonLabel,
    schema,
    defaultValues,
    type,
    onSubmit,
} : AuthFormProps) {
    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleFormSubmit = async (data: any) => {
        try{
            if (type === "signup") {
                const response = await api.post("/register", data);

                if (response.status === 201) {
                    toast.success("Registration successful");
                    setTimeout(() => {
                        router.push("/onboarding/login");
                    }, 4000);
                }
              
            }

            if (type === "login") {
                const res = await signIn("credentials", {
                    redirect:false,
                    email: data.email,
                    password:data.password,
                });

                if (res?.ok) {
                    toast.success("Login successful");

                    const updatedSession = await fetch("/api/auth/session").then((res) => res.json());

                    if (updatedSession?.user?.mustChangePassword) {
                        router.push("/onboarding/change-password");
                        return;
                    }   

                    const role = updatedSession?.user?.role;

                    if (role === "ADMIN") {
                        router.push("/admin");
                    } else if (role === "COLLECTOR") {
                        router.push("/collector");
                    } else if (role === "USER") {
                        router.push("/user");
                    }
                }

            
                if (res?.error) {
                    toast.error("Invalid email or password");
                    return;
                }

        
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "An error occurred, please try again");
        }
    }
    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <h2 className="text-2xl text-center font-bold">{title}</h2>

            {type === "signup" && (
                <>
                <div>
                    {/* <label>First Name</label> */}
                    <input
                    {...register("firstName")}
                    placeholder="First Name"
                    className="w-full border p-2 rounded-xl outline-none mt-2"
                    />
                    {errors.firstName && (
                    <p className="text-red-500 text-sm">
                        {String(errors.firstName.message)}
                    </p>
                    )}
                </div>

                <div>
                    {/* <label>Last Name</label> */}
                    <input
                    {...register("lastName")}
                    placeholder="Last Name"
                    className="w-full border p-2 rounded-xl outline-none mt-2"
                    />
                    {errors.lastName && (
                    <p className="text-red-500 text-sm">
                        {String(errors.lastName.message)}
                    </p>
                    )}
                </div>
                </>
            )}

            <div>
                {/* <label>Email</label> */}
                <input
                {...register("email")}
                placeholder="Email"
                className="w-full border p-2 rounded-xl outline-none mt-2"
                />
                {errors.email && (
                <p className="text-red-500 text-sm">
                    {String(errors.email.message)}
                </p>
                )}
            </div>

            {type !== "forgot" && (
                <div>
                    {/* <label>Password</label> */}
                    <div className="flex items-center justify-between w-full  border p-2 rounded-xl mt-2">
                        <input
                            type={showPassword ? "text" : "password"}
                            {...register("password")}
                            placeholder="Password"
                            className="outline-none w-full"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="text-black"
                        >
                            {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-red-500 text-sm">
                            {String(errors.password.message)}
                        </p>
                    )}
                </div>
            )}

            {type === "signup" && (
                <div>
                    {/* <label>Confirm Password</label> */}
                    <div className="flex items-center justify-between w-full  border p-2 rounded-xl mt-2">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            {...register("confirmPassword")}
                            placeholder="Confirm Password"
                            className="outline-none w-full"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="text-black"
                        >
                            {showConfirmPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                        </button>
                    </div>
                 
                    {errors.confirmPassword && (
                        <p className="text-red-500 text-sm">
                            {String(errors.confirmPassword.message)}
                        </p>
                    )}
                </div>
            )}

            <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-lg"
                disabled={isSubmitting}
            >
                {isSubmitting ? "Processing..." : buttonLabel}
            </button>

            {type === "login" && (
                <div>
                    <div className="flex items-center mt-1 w-full mx-auto">
                        <div className="flex-grow border-t border-gray-800"></div>
                            <span className="mx-2 text-white md:text-black lg:text-black text-base">Or continue with</span>
                        <div className="flex-grow border-t border-gray-800"></div>
                    </div>
                    <div className="flex items-centeer justify-center w-full gap-x-10 mt-5">
                        {/* Google */}
                        <div className="flex items-center justify-center w-20 h-9 cursor-pointer p-3 border border-gray-200 rounded-xl">
                        <FcGoogle  className="text-2xl"/>
                        </div>

                        {/* Facebook */}
                        <div className="flex items-center justify-center w-20 h-9 cursor-pointer p-2 border border-gray-200 rounded-xl">
                        <FaFacebookF  className="text-2xl"/>
                        </div>

                        {/* Apple */}
                        <div className="flex items-center justify-center w-20 h-9 cursor-pointer p-2 border border-gray-200 rounded-xl">
                        <AiOutlineApple  className="text-2xl"/>
                        </div>
                    </div>
                    <div className="text-center mt-5 text-base flex items-center justify-between">
                        <Link href="/onboarding/forgot-password" className="text-green-800">
                            Forgot password?
                        </Link>
                        <br />
                        <Link href="/onboarding/signup" className="text-green-800">
                            Create an account
                        </Link>
                    </div>
                </div>
           
            )}

            {type === "signup" && (
                <p className="text-center text-base mt-3">
                    Already have an account?{" "}
                    <Link href="/onboarding/login" className="text-green-800">
                        Login
                    </Link>
                </p>
            )}
        </form>
    )
}