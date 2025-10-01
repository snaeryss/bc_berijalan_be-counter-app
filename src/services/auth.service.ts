import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { AppError } from "../errors/AppError";
import { UGenerateToken } from "../utils/jwt.util";
import { IGlobalResponse } from "../interfaces/global.interface";
import { ILoginResponse } from "../interfaces/auth.interface";

const prisma = new PrismaClient();

export const SLogin = async (
  usernameOrEmail: string,
  password: string
): Promise<IGlobalResponse<ILoginResponse>> => {

  console.log("--- START LOGIN ATTEMPT ---");
  console.log("Mencari admin dengan username/email:", usernameOrEmail);
  console.log("Password diterima dari frontend:", password);

  const admin = await prisma.admin.findFirst({
    where: {
      OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      isActive: true,
      deletedAt: null,
    },
  });

  if (!admin) {

    console.log("HASIL: Admin tidak ditemukan di database.");
    console.log("--- END LOGIN ATTEMPT ---");

    throw AppError.badRequest("Invalid credentials");
  }

  console.log("HASIL: Admin ditemukan. ID:", admin.id);
  console.log("Password HASH dari database:", admin.password);
  console.log("Panjang HASH dari database:", admin.password.length, "karakter.");

  const isPasswordValid = await bcrypt.compare(password, admin.password);

  console.log("Hasil perbandingan bcrypt.compare:", isPasswordValid);
  console.log("--- END LOGIN ATTEMPT ---");

  if (!isPasswordValid) {
    throw AppError.badRequest("Invalid credentials");
  }

  const token = UGenerateToken({
    id: admin.id,
    username: admin.username,
    email: admin.email,
    name: admin.name,
  });

  return {
    status: true,
    message: "Login successful",
    data: {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
      },
    },
  };
};

export const SCreateAdmin = async (
  username: string,
  email: string,
  name: string,
  password: string
): Promise<IGlobalResponse> => {
  const existingUsername = await prisma.admin.findFirst({
    where: {
      username,
      deletedAt: null,
    },
  });

  if (existingUsername) {
    throw AppError.conflict("Username already exists");
  }

  const existingEmail = await prisma.admin.findFirst({
    where: {
      email,
      deletedAt: null,
    },
  });

  if (existingEmail) {
    throw AppError.conflict("Email already exists");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw AppError.badRequest("Invalid email format");
  }

  if (password.length < 8) {
    throw AppError.badRequest("Password must be at least 8 characters long");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.create({
    data: {
      username,
      email,
      name,
      password: hashedPassword,
      isActive: true,
    },
  });

  return {
    status: true,
    message: "Admin created successfully",
    data: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      name: admin.name,
      isActive: admin.isActive,
    },
  };
};

export const SUpdateAdmin = async (
  id: number,
  username?: string,
  email?: string,
  name?: string,
  password?: string,
  isActive?: boolean
): Promise<IGlobalResponse> => {
  const admin = await prisma.admin.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!admin) {
    throw AppError.notFound("Admin not found");
  }

  if (username && username !== admin.username) {
    const existingUsername = await prisma.admin.findFirst({
      where: {
        username,
        deletedAt: null,
        NOT: { id },
      },
    });
    if (existingUsername) {
      throw AppError.conflict("Username already exists");
    }
  }

  if (email && email !== admin.email) {
    const existingEmail = await prisma.admin.findFirst({
      where: {
        email,
        deletedAt: null,
        NOT: { id },
      },
    });
    if (existingEmail) {
      throw AppError.conflict("Email already exists");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw AppError.badRequest("Invalid email format");
    }
  }

  if (password && password.length < 8) {
    throw AppError.badRequest("Password must be at least 8 characters long");
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (username !== undefined) updateData.username = username;
  if (email !== undefined) updateData.email = email;
  if (name !== undefined) updateData.name = name;
  if (isActive !== undefined) updateData.isActive = isActive;

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const updatedAdmin = await prisma.admin.update({
    where: { id },
    data: updateData,
  });

  return {
    status: true,
    message: "Admin updated successfully",
    data: {
      id: updatedAdmin.id,
      username: updatedAdmin.username,
      email: updatedAdmin.email,
      name: updatedAdmin.name,
      isActive: updatedAdmin.isActive,
    },
  };
};

export const SDeleteAdmin = async (id: number): Promise<IGlobalResponse> => {
  const admin = await prisma.admin.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!admin) {
    throw AppError.notFound("Admin not found");
  }

  await prisma.admin.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedAt: new Date(),
    },
  });

  return {
    status: true,
    message: "Admin deleted successfully",
  };
};

export const SGetAllAdmins = async (): Promise<IGlobalResponse> => {
  const admins = await prisma.admin.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    status: true,
    message: "Admins retrieved successfully",
    data: admins,
  };
};

export const SGetAdminById = async (id: number): Promise<IGlobalResponse> => {
  const admin = await prisma.admin.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!admin) {
    throw AppError.notFound("Admin not found");
  }

  return {
    status: true,
    message: "Admin retrieved successfully",
    data: admin,
  };
};

export const SToggleAdminStatus = async (
  id: number
): Promise<IGlobalResponse> => {
  const admin = await prisma.admin.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!admin) {
    throw AppError.notFound("Admin not found");
  }

  const updatedAdmin = await prisma.admin.update({
    where: { id },
    data: {
      isActive: !admin.isActive,
      updatedAt: new Date(),
    },
  });

  return {
    status: true,
    message: `Admin ${
      updatedAdmin.isActive ? "activated" : "deactivated"
    } successfully`,
    data: {
      id: updatedAdmin.id,
      username: updatedAdmin.username,
      email: updatedAdmin.email,
      name: updatedAdmin.name,
      isActive: updatedAdmin.isActive,
    },
  };
};
