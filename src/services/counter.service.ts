import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { IGlobalResponse } from "../interfaces/global.interface";

const prisma = new PrismaClient();

export const SGetAllCounters = async (
  includeInactive: boolean = false
): Promise<IGlobalResponse> => {
  const whereCondition: any = {
    deletedAt: null,
  };

  if (!includeInactive) {
    whereCondition.isActive = true;
  }

  const counters = await prisma.counter.findMany({
    where: whereCondition,
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    status: true,
    message: "Counters retrieved successfully",
    data: counters,
  };
};

export const SGetCounterById = async (id: number): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  const activeQueue = await prisma.queue.findFirst({
    where: {
      counterId: id,
      status: { in: ["CLAIMED", "CALLED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    status: true,
    message: "Counter retrieved successfully",
    data: {
      ...counter,
      activeQueueNumber: activeQueue?.number || null,
      activeQueueStatus: activeQueue?.status || null,
    },
  };
};

export const SCreateCounter = async (
  name: string,
  maxQueue: number,
  isActive: boolean = true
): Promise<IGlobalResponse> => {
  if (!name || name.trim().length === 0) {
    throw AppError.badRequest("Counter name is required");
  }

  if (maxQueue < 1 || maxQueue > 999) {
    throw AppError.badRequest("Max queue must be between 1 and 999");
  }

  const existingCounter = await prisma.counter.findFirst({
    where: {
      name: name.trim(),
      deletedAt: null,
      isActive: isActive,
    },
  });

  if (existingCounter) {
    throw AppError.conflict("Counter with this name already exists");
  }

  const counter = await prisma.counter.create({
    data: {
      name: name.trim(),
      maxQueue,
      currentQueue: 0,
      isActive: true,
    },
  });

  return {
    status: true,
    message: "Counter created successfully",
    data: counter,
  };
};

export const SUpdateCounter = async (
  id: number,
  name?: string,
  maxQueue?: number,
  isActive?: boolean
): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  if (name !== undefined) {
    if (!name || name.trim().length === 0) {
      throw AppError.badRequest("Counter name is required");
    }

    const existingCounter = await prisma.counter.findFirst({
      where: {
        name: name.trim(),
        deletedAt: null,
        NOT: { id },
      },
    });
    if (existingCounter) {
      throw AppError.conflict("Counter with this name already exists");
    }
  }

  if (maxQueue !== undefined && (maxQueue < 1 || maxQueue > 999)) {
    throw AppError.badRequest("Max queue must be between 1 and 999");
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (name !== undefined) updateData.name = name.trim();
  if (maxQueue !== undefined) updateData.maxQueue = maxQueue;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updatedCounter = await prisma.counter.update({
    where: { id },
    data: updateData,
  });

  return {
    status: true,
    message: "Counter updated successfully",
    data: updatedCounter,
  };
};

export const SDeleteCounter = async (id: number): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  const activeQueueCount = await prisma.queue.count({
    where: {
      counterId: id,
      status: { in: ["CLAIMED", "CALLED"] },
    },
  });

  if (activeQueueCount > 0) {
    throw AppError.conflict("Cannot delete counter with active queues");
  }

  await prisma.counter.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedAt: new Date(),
    },
  });

  return {
    status: true,
    message: "Counter deleted successfully",
  };
};

export const SToggleCounterStatus = async (
  id: number
): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  const updatedCounter = await prisma.counter.update({
    where: { id },
    data: {
      isActive: !counter.isActive,
      updatedAt: new Date(),
    },
  });

  return {
    status: true,
    message: `Counter ${
      updatedCounter.isActive ? "activated" : "deactivated"
    } successfully`,
    data: updatedCounter,
  };
};

export const SUpdateCounterStatus = async (
  id: number,
  status: "active" | "inactive" | "disable"
): Promise<IGlobalResponse> => {
  // Validasi counter exists
  const counter = await prisma.counter.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  // Jika disable, cek apakah ada queue aktif
  if (status === "disable") {
    const activeQueueCount = await prisma.queue.count({
      where: {
        counterId: id,
        status: { in: ["CLAIMED", "CALLED"] },
      },
    });

    if (activeQueueCount > 0) {
      throw AppError.conflict(
        "Cannot disable counter with active queues. Please process or reset all active queues first."
      );
    }
  }

  let updateData: any = {
    updatedAt: new Date(),
  };

  switch (status) {
    case "active":
      updateData.isActive = true;
      break;
    case "inactive":
      updateData.isActive = false;
      break;
    case "disable":
      updateData.deletedAt = new Date();
      updateData.isActive = false;
      break;
  }

  const updatedCounter = await prisma.counter.update({
    where: { id },
    data: updateData,
  });

  const statusMessages: Record<string, string> = {
    active: "activated",
    inactive: "deactivated",
    disable: "disabled",
  };

  return {
    status: true,
    message: `Counter ${statusMessages[status]} successfully`,
    data: updatedCounter,
  };
};
