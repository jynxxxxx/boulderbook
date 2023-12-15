import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "~/server/db";
import bcrypt from 'bcrypt'

type FormData = {
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  password: string;
  checkPassword: string;
};

export default async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = req.body;
    console.log(body);

    const { firstname, lastname, email, username, password, checkPassword }: FormData = body;

    const existingEmail = await db.user.findUnique({ where: { email: email } });
    if (existingEmail) {
      return res.status(409).json({ msg: "This email is already in use" });
    }

    const existingUsername = await db.user.findUnique({ where: { name: username } });
    if (existingUsername) {
      return res.status(409).json({ msg: "This username is already in use" });
    }

    if (password !== checkPassword) {
      return res.status(409).json({ msg: "Passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: {
        name: username,
        realName: firstname + " " + lastname,
        password: hashedPassword,
        email: email,
      }
    });

    return res.status(200).json({ user: newUser, message: "New User Created" });

  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}