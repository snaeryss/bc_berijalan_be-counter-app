import jwt, { SignOptions } from "jsonwebtoken";
import { Admin } from "@prisma/client";
import { redisClient } from "../config/redis.config";
import { Request } from "express";
import ms from "ms";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "1d") as ms.StringValue;

export const UGenerateToken = (admin: Partial<Admin>): string => {
  const token = jwt.sign(
    { id: admin.id, username: admin.username },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as SignOptions
  );

  const key = `token:${admin.id}:${token.split(".")[2]}`;

  redisClient.set(key, token, {
    expiration: {
      type: "EX",
      value: ms(JWT_EXPIRES_IN) / 1000,
    },
  });
  return token;
};

export const UVerifyToken = async (token: string) => {
  const payload = jwt.verify(token, JWT_SECRET);

  if (!payload) {
    throw Error("Invalid token");
  }

  const key = `token:${(payload as Request["admin"])?.id}:${
    token.split(".")[2]
  }`;

  const data = await redisClient.get(key);

  if (!data) {
    throw Error("Token expired");
  }

  return payload;
};

export const UInvalidateToken = (
  adminId: number,
  token: string
): Promise<number> => {
  const key = `token:${adminId}:${token.split(".")[2]}`;
  return redisClient.del(key);
};
