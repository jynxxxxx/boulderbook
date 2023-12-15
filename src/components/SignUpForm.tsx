import { Button } from "./Button"
import { useState } from "react";
import type { FormEvent } from "react";


type FormData = {
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  password: string;
  checkPassword: string;
};

export function SignUpForm() {
  const [formData, setFormData] = useState<FormData>({
    firstname: "",
    lastname: "",
    email: "",
    username: "",
    password: "",
    checkPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/signup/newUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error("Failed to sign up:", errorMessage);
        throw new Error("Failed to sign up");
      }

      const user = await response.json();
      console.log("Signed up successfully", user);
      return {
        user,
        redirect: {
          destination: "/"
        }
      };
    } catch (error) {
      throw new Error("Failed to sign up");
    }
  };

  return (
    <div className="formdiv flex flex-col items-center justify-center w-full">
      <form
        className="flex flex-col gap-3 min-w-min w-full"
        onSubmit={handleSubmit}>
        <div className="forminput">
          <label htmlFor="firstname">First Name:</label>
          <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} />
        </div>
        <div className="forminput">
          <label htmlFor="lastname">Last Name:</label>
          <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} />
        </div>
        <div className="forminput">
          <label htmlFor="email">Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} />
        </div>
        <div className="forminput">
          <label htmlFor="username">Username:</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} />
        </div>
        <div className="forminput">
          <label htmlFor="password">Password:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} />
        </div>
        <div className="forminput">
          <label htmlFor="password">Confirm Password:</label>
          <input type="password" name="checkPassword" value={formData.checkPassword} onChange={handleChange} />
        </div>

        <Button className="mt-2 w-4/5 m-auto">
          Sign Up
        </Button>
      </form>
    </div>
  );
}
