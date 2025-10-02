import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { publishQueueUpdate } from "../config/redis.config";
import { IGlobalResponse } from "../interfaces/global.interface";
import { QUEUE_CONFIG } from "../config/queue.config";

const prisma = new PrismaClient();

export const SGetMetrics = async (): Promise<IGlobalResponse> => {
  const waitingCount = await prisma.queue.count({
    where: { status: "CLAIMED" },
  });
  const calledCount = await prisma.queue.count({
    where: { status: "CALLED" },
  });
  const releasedCount = await prisma.queue.count({
    where: { status: "RELEASED" },
  });
  const skippedCount = await prisma.queue.count({
    where: { status: "SKIPPED" },
  });

  return {
    status: true,
    message: "Metrics retrieved successfully",
    data: {
      waiting: waitingCount,
      called: calledCount,
      released: releasedCount,
      skipped: skippedCount,
    },
  };
};

export const SClaimQueue = async (): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: {
      isActive: true,
      deletedAt: null,
    },
    orderBy: { currentQueue: "asc" },
  });

  if (!counter) {
    throw AppError.notFound("No active counters found");
  }

  let nextQueueNumber = counter.currentQueue + 1;

  if (nextQueueNumber > counter.maxQueue) {
    nextQueueNumber = 1;
  }

  const queue = await prisma.queue.create({
    data: {
      number: nextQueueNumber,
      status: "CLAIMED",
      counterId: counter.id,
    },
    include: {
      counter: true,
    },
  });

  await prisma.counter.update({
    where: { id: counter.id },
    data: { currentQueue: nextQueueNumber },
  });

  await publishQueueUpdate({
    event: "queue_claimed",
    counter_id: counter.id,
    counter_name: counter.name,
    queue_number: nextQueueNumber,
  });

  const calledQueuePosition = await prisma.queue.count({
    where: {
      counterId: counter.id,
      status: "CALLED",
      createdAt: {
        lt: queue.createdAt,
      },
    },
  });

  const waitingQueueCount = await prisma.queue.count({
    where: {
      counterId: counter.id,
      status: "CLAIMED",
      createdAt: {
        lt: queue.createdAt,
      },
    },
  });

  const estimatedWaitTime =
    (calledQueuePosition + waitingQueueCount) *
    QUEUE_CONFIG.AVERAGE_SERVICE_TIME_MINUTES;

  return {
    status: true,
    message: "Queue claimed successfully",
    data: {
      queueNumber: queue.number,
      counterName: queue.counter.name,
      counterId: queue.counter.id,
      estimatedWaitTime: estimatedWaitTime, // in minutes
      positionInQueue: waitingQueueCount + 1,
    },
  };
};

export const SReleaseQueue = async (
  queueNumber: number,
  counterId: number
): Promise<IGlobalResponse> => {
  if (!queueNumber || queueNumber <= 0) {
    throw AppError.badRequest("Invalid queue number", null, "queueNumber");
  }

  if (!counterId || counterId <= 0) {
    throw AppError.badRequest("Invalid counter ID", null, "counterId");
  }

  const counter = await prisma.counter.findUnique({
    where: {
      id: counterId,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  if (!counter.isActive) {
    throw AppError.badRequest("Counter is not active", null, "counterId");
  }

  const queue = await prisma.queue.findFirst({
    where: {
      number: queueNumber,
      counterId: counterId,
      status: "CLAIMED",
    },
  });

  if (!queue) {
    throw AppError.notFound("Queue not found or already processed");
  }

  await prisma.queue.update({
    where: { id: queue.id },
    data: { status: "RELEASED" },
  });

  await publishQueueUpdate({
    event: "queue_released",
    counter_id: counterId,
    queue_number: queueNumber,
  });

  return {
    status: true,
    message: "Queue released successfully",
  };
};

export const SGetCurrentQueues = async (
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
    orderBy: { name: "asc" },
  });

  const currentQueues = await prisma.queue.findMany({
    where: {
      counterId: {
        in: counters.map((c) => c.id),
      },
      status: "CALLED",
      counter: {
        isActive: includeInactive ? undefined : true,
        deletedAt: null,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const lastProcessedQueues = await prisma.queue.findMany({
    where: {
      counterId: {
        in: counters.map((c) => c.id),
      },
      status: { in: ["CALLED", "SERVED"] }, // CALLED (aktif) atau SERVED (baru selesai)
      counter: {
        isActive: includeInactive ? undefined : true,
        deletedAt: null,
      },
    },
    orderBy: { updatedAt: "desc" },
    distinct: ["counterId"], // Ambil 1 per counter
  });

  const data = counters.map((counter) => {
    const currentQueue = currentQueues.find((q) => q.counterId === counter.id);
    return {
      id: counter.id,
      isActive: counter.isActive,
      name: counter.name,
      currentQueue: currentQueue?.number,
      maxQueue: counter.maxQueue,
      status: currentQueue?.status || null,
    };
  });

  return {
    status: true,
    message: "Current queues retrieved successfully",
    data,
  };
};

// export const SNextQueue = async (
//   counterId: number
// ): Promise<IGlobalResponse> => {
//   if (!counterId || counterId <= 0) {
//     throw AppError.badRequest("Invalid counter ID", null, "counterId");
//   }

//   const counter = await prisma.counter.findUnique({
//     where: {
//       id: counterId,
//       deletedAt: null,
//     },
//   });

//   if (!counter) {
//     throw AppError.notFound("Counter not found");
//   }

//   if (!counter.isActive) {
//     throw AppError.badRequest("Counter is not active", null, "counterId");
//   }

//   const claimedQueue = await prisma.queue.findFirst({
//     where: {
//       counterId,
//       status: "CLAIMED",
//     },
//     orderBy: {
//       createdAt: "asc",
//     },
//   });

//   if (!claimedQueue) {
//     throw AppError.notFound("No claimed queues found for this counter");
//   }

//   await prisma.queue.update({
//     where: { id: claimedQueue.id },
//     data: { status: "CALLED" },
//   });

//   await publishQueueUpdate({
//     event: "queue_called",
//     counter_id: counterId,
//     queue_number: claimedQueue.number,
//     counter_name: counter.name,
//   });

//   return {
//     status: true,
//     message: "Next queue called successfully",
//     data: {
//       queueNumber: claimedQueue.number,
//       counterName: counter.name,
//       counterId,
//     },
//   };
// };

// Di src/services/queue.service.ts
// Replace fungsi SNextQueue yang lama dengan ini:

export const SNextQueue = async (
  counterId: number
): Promise<IGlobalResponse> => {
  if (!counterId || counterId <= 0) {
    throw AppError.badRequest("Invalid counter ID", null, "counterId");
  }

  const counter = await prisma.counter.findUnique({
    where: {
      id: counterId,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  if (!counter.isActive) {
    throw AppError.badRequest("Counter is not active", null, "counterId");
  }

  // PERBAIKAN: Cari queue dengan status CLAIMED terlebih dahulu
  let claimedQueue = await prisma.queue.findFirst({
    where: {
      counterId,
      status: "CLAIMED",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // JIKA TIDAK ADA CLAIMED QUEUE, BUAT BARU
  if (!claimedQueue) {
    console.log("No claimed queue found, creating new queue...");
    
    // Cari nomor antrian berikutnya
    let nextQueueNumber = counter.currentQueue + 1;
    if (nextQueueNumber > counter.maxQueue) {
      nextQueueNumber = 1;
    }

    // Buat queue baru dengan status CLAIMED
    claimedQueue = await prisma.queue.create({
      data: {
        number: nextQueueNumber,
        status: "CLAIMED",
        counterId: counterId,
      },
    });

    // Update counter current queue
    await prisma.counter.update({
      where: { id: counterId },
      data: { currentQueue: nextQueueNumber },
    });

    console.log(`Created new queue: ${nextQueueNumber} for counter ${counterId}`);
  }

  // Update status queue menjadi CALLED
  const calledQueue = await prisma.queue.update({
    where: { id: claimedQueue.id },
    data: { status: "CALLED" },
  });

  // Publish SSE event
  await publishQueueUpdate({
    event: "queue_called",
    counter_id: counterId,
    queue_number: calledQueue.number,
    counter_name: counter.name,
  });

  return {
    status: true,
    message: "Next queue called successfully",
    data: {
      queue: {
        id: calledQueue.id,
        number: calledQueue.number,
        status: calledQueue.status,
        counterId: calledQueue.counterId,
        createdAt: calledQueue.createdAt,
        updatedAt: calledQueue.updatedAt,
      },
      queueNumber: calledQueue.number,
      counterName: counter.name,
      counterId,
    },
  };
};

export const SSkipQueue = async (
  counterId: number
): Promise<IGlobalResponse> => {
  if (!counterId || counterId <= 0) {
    throw AppError.badRequest("Invalid counter ID", null, "counterId");
  }

  const counter = await prisma.counter.findUnique({
    where: {
      id: counterId,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  if (!counter.isActive) {
    throw AppError.badRequest("Counter is not active", null, "counterId");
  }

  const calledQueue = await prisma.queue.findFirst({
    where: {
      counterId,
      status: "CALLED",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!calledQueue) {
    throw AppError.notFound("No called queue found for this counter");
  }

  await prisma.queue.update({
    where: { id: calledQueue.id },
    data: { status: "SKIPPED" },
  });

  await publishQueueUpdate({
    event: "queue_skipped",
    counter_id: counterId,
    queue_number: calledQueue.number,
  });

  try {
    const nextQueueResult = await SNextQueue(counterId);
    return {
      status: true,
      message: "Queue skipped successfully and next queue called",
      data: nextQueueResult.data,
    };
  } catch (error) {
    console.warn("No more queues to call after skip:", error);
    return {
      status: true,
      message: "Queue skipped successfully, no more queues to call",
    };
  }
};

export const SResetQueues = async (
  counterId?: number
): Promise<IGlobalResponse> => {
  if (counterId) {
    if (counterId <= 0) {
      throw AppError.badRequest("Invalid counter ID", null, "counterId");
    }

    const counter = await prisma.counter.findUnique({
      where: {
        id: counterId,
        deletedAt: null,
      },
    });

    if (!counter) {
      throw AppError.notFound("Counter not found");
    }

    if (!counter.isActive) {
      throw AppError.badRequest("Counter is not active", null, "counterId");
    }

    await prisma.queue.updateMany({
      where: {
        counterId,
        status: { in: ["CLAIMED", "CALLED"] },
      },
      data: { status: "RESET" },
    });

    await prisma.counter.update({
      where: { id: counterId },
      data: { currentQueue: 0 },
    });

    await publishQueueUpdate({
      event: "queue_reset",
      counter_id: counterId,
    });

    return {
      status: true,
      message: `Queue for counter ${counter.name} reset successfully`,
    };
  } else {
    await prisma.queue.updateMany({
      where: {
        status: { in: ["CLAIMED", "CALLED"] },
        counter: {
          isActive: true,
          deletedAt: null,
        },
      },
      data: { status: "RESET" },
    });

    await prisma.counter.updateMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      data: { currentQueue: 0 },
    });

    await publishQueueUpdate({
      event: "all_queues_reset",
    });

    return {
      status: true,
      message: "All active queues reset successfully",
    };
  }
};

export const SSearchQueues = async (
  search?: string | null
): Promise<IGlobalResponse> => {
  const queues = await prisma.queue.findMany({
    where: {
      OR: [
        {
          number: isNaN(Number(search)) ? undefined : Number(search),
        },
        {
          counter: {
            name: {
              contains: search || undefined,
              mode: "insensitive",
            },
            deletedAt: null,
          },
        },
      ],
      counter: {
        isActive: true,
        deletedAt: null,
      },
    },
    include: {
      counter: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  const data = queues.map((queue) => ({
    id: queue.id,
    queueNumber: queue.number,
    status: queue.status,
    counter: {
      id: queue.counterId,
      name: queue.counter.name,
    },
    createdAt: queue.createdAt,
    updatedAt: queue.updatedAt,
  }));

  return {
    status: true,
    message: "Queues retrieved successfully",
    data,
  };
};

// Tugas Opsional (Akan Wajib di day 4)

export const SGetAllQueues = async (
  includeDeleted: boolean = false,
  status?: string,
  counterId?: number,
  page: number = 1,
  limit: number = 20
): Promise<IGlobalResponse> => {
  const whereCondition: any = {};

  if (!includeDeleted) {
    whereCondition.deletedAt = null;
  }

  if (status) {
    whereCondition.status = status;
  }

  if (counterId) {
    whereCondition.counterId = counterId;
  }

  const skip = (page - 1) * limit;

  const [queues, total] = await Promise.all([
    prisma.queue.findMany({
      where: whereCondition,
      include: {
        counter: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.queue.count({ where: whereCondition }),
  ]);

  return {
    status: true,
    message: "Queues retrieved successfully",
    data: queues,
    pagination: {
      total,
      current_page: page,
      total_page: Math.ceil(total / limit),
      per_page: limit,
    },
  };
};

export const SGetQueueById = async (id: number): Promise<IGlobalResponse> => {
  const queue = await prisma.queue.findFirst({
    where: {
      id,

      deletedAt: null,
    },
    include: {
      counter: {
        select: {
          id: true,
          name: true,
          isActive: true,
          maxQueue: true,
        },
      },
    },
  });

  if (!queue) {
    throw AppError.notFound("Queue not found");
  }

  // Hitung posisi dalam antrean
  const position = await prisma.queue.count({
    where: {
      counterId: queue.counterId,
      status: "CLAIMED",
      createdAt: {
        lt: queue.createdAt,
      },
    },
  });

  return {
    status: true,
    message: "Queue retrieved successfully",
    data: {
      ...queue,
      positionInQueue: position + 1,
    },
  };
};

export const SCreateQueue = async (
  counterId: number,
  queueNumber: number,
  status:
    | "CLAIMED"
    | "CALLED"
    | "SERVED"
    | "SKIPPED"
    | "RELEASED"
    | "RESET" = "CLAIMED"
): Promise<IGlobalResponse> => {
  const counter = await prisma.counter.findFirst({
    where: {
      id: counterId,
      deletedAt: null,
    },
  });

  if (!counter) {
    throw AppError.notFound("Counter not found");
  }

  if (!counter.isActive) {
    throw AppError.badRequest("Counter is not active", null, "counterId");
  }

  // Validasi queue number
  if (queueNumber < 1 || queueNumber > counter.maxQueue) {
    throw AppError.badRequest(
      `Queue number must be between 1 and ${counter.maxQueue}`,
      null,
      "queueNumber"
    );
  }

  const existingQueue = await prisma.queue.findFirst({
    where: {
      counterId,
      number: queueNumber,
      status: { in: ["CLAIMED", "CALLED"] },
    },
  });

  if (existingQueue) {
    throw AppError.conflict(
      `Queue number ${queueNumber} is already active for this counter`
    );
  }

  const queue = await prisma.queue.create({
    data: {
      number: queueNumber,
      status,
      counterId,
    },
    include: {
      counter: true,
    },
  });

  await publishQueueUpdate({
    event: "queue_claimed",
    counter_id: counterId,
    counter_name: counter.name,
    queue_number: queueNumber,
  });

  return {
    status: true,
    message: "Queue created successfully",
    data: queue,
  };
};

export const SUpdateQueue = async (
  id: number,
  queueNumber?: number,
  status?: string,
  counterId?: number
): Promise<IGlobalResponse> => {
  const queue = await prisma.queue.findFirst({
    where: {
      id,

      deletedAt: null,
    },
  });

  if (!queue) {
    throw AppError.notFound("Queue not found");
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (counterId !== undefined) {
    const counter = await prisma.counter.findFirst({
      where: {
        id: counterId,
        deletedAt: null,
      },
    });

    if (!counter) {
      throw AppError.notFound("Counter not found");
    }

    updateData.counterId = counterId;
  }

  // Jika update queue number
  if (queueNumber !== undefined) {
    const targetCounterId = counterId || queue.counterId;
    const counter = await prisma.counter.findUnique({
      where: { id: targetCounterId },
    });

    if (counter && (queueNumber < 1 || queueNumber > counter.maxQueue)) {
      throw AppError.badRequest(
        `Queue number must be between 1 and ${counter.maxQueue}`,
        null,
        "queueNumber"
      );
    }

    updateData.number = queueNumber;
  }

  // Jika update status
  if (status !== undefined) {
    const validStatuses = [
      "CLAIMED",
      "CALLED",
      "SERVED",
      "SKIPPED",
      "RELEASED",
      "RESET",
    ];
    if (!validStatuses.includes(status)) {
      throw AppError.badRequest(
        `Invalid status. Valid values: ${validStatuses.join(", ")}`,
        null,
        "status"
      );
    }
    updateData.status = status;
  }

  const updatedQueue = await prisma.queue.update({
    where: { id },
    data: updateData,
    include: {
      counter: true,
    },
  });

  return {
    status: true,
    message: "Queue updated successfully",
    data: updatedQueue,
  };
};

export const SUpdateQueueStatus = async (
  id: number,
  statusAction: "active" | "inactive" | "disable"
): Promise<IGlobalResponse> => {
  const queue = await prisma.queue.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!queue) {
    throw AppError.notFound("Queue not found");
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  switch (statusAction) {
    case "active":
      // Set status ke CLAIMED (aktif kembali)
      updateData.status = "CLAIMED";
      break;
    case "inactive":
      // Set status ke RELEASED (tidak aktif sementara)
      updateData.status = "RELEASED";
      break;
    case "disable":
      // Soft delete
      updateData.deletedAt = new Date();
      updateData.status = "RESET";
      break;
  }

  const updatedQueue = await prisma.queue.update({
    where: { id },
    data: updateData,
    include: {
      counter: true,
    },
  });

  const statusMessages: Record<string, string> = {
    active: "activated",
    inactive: "deactivated",
    disable: "disabled",
  };

  return {
    status: true,
    message: `Queue ${statusMessages[statusAction]} successfully`,
    data: updatedQueue,
  };
};

/**
 * Delete queue (soft delete)
 */
export const SDeleteQueue = async (id: number): Promise<IGlobalResponse> => {
  const queue = await prisma.queue.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!queue) {
    throw AppError.notFound("Queue not found");
  }

  // Cek apakah queue sedang dipanggil (CALLED)
  if (queue.status === "CALLED") {
    throw AppError.conflict(
      "Cannot delete queue that is currently being called. Please serve or skip the queue first."
    );
  }

  await prisma.queue.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: "RESET",
      updatedAt: new Date(),
    },
  });

  return {
    status: true,
    message: "Queue deleted successfully",
  };
};

export const SBulkDeleteQueues = async (ids: number[]): Promise<IGlobalResponse> => {
  const queues = await prisma.queue.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
    },
  });

  if (queues.length !== ids.length) {
    throw AppError.notFound("One or more queues not found or already deleted.");
  }
  
  const calledQueue = queues.find(q => q.status === 'CALLED');
  if (calledQueue) {
    throw AppError.conflict(
      `Cannot delete queue number ${calledQueue.number} because it is currently being called.`
    );
  }

  const result = await prisma.queue.updateMany({
    where: {
      id: { in: ids },
    },
    data: {
      deletedAt: new Date(),
      status: "RESET",
      updatedAt: new Date(),
    },
  });

  return {
    status: true,
    message: `${result.count} queues deleted successfully`,
  };
};

export const SServeQueue = async (
  counterId: number
): Promise<IGlobalResponse> => {
  if (!counterId || counterId <= 0) {
    throw AppError.badRequest("Invalid counter ID", null, "counterId");
  }

  const calledQueue = await prisma.queue.findFirst({
    where: {
      counterId,
      status: "CALLED",
    },
  });

  if (!calledQueue) {
    throw AppError.notFound("No active queue being called for this counter");
  }

  const servedQueue = await prisma.queue.update({
    where: { id: calledQueue.id },
    data: { status: "SERVED" },
  });

  await publishQueueUpdate({
    event: "queue_served", 
    counter_id: counterId,
    queue_number: servedQueue.number,
  });

  return {
    status: true,
    message: "Queue served successfully",
    data: servedQueue,
  };
};
