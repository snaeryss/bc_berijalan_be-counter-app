import Joi from "joi";

export const VLoginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const VCounterSchema = Joi.object({
  name: Joi.string().required(),
  max_queue: Joi.number().integer().min(1).default(99),
  is_active: Joi.boolean().optional(),
});

export const VCounterStatusSchema = Joi.object({
  status: Joi.string()
    .valid("active", "inactive", "disable")
    .required()
    .messages({
      "any.only": "Status must be one of: active, inactive, disable",
      "any.required": "Status is required",
    }),
});

export const VNextQueueSchema = Joi.object({
  counter_id: Joi.number().integer().required(),
});

export const VSkipQueueSchema = Joi.object({
  counter_id: Joi.number().integer().required(),
});

export const VResetQueueSchema = Joi.object({
  counter_id: Joi.number().integer().optional(),
});

export const VBaseID = Joi.object({
  id: Joi.number().integer().positive().optional(),
  counter_id: Joi.number().integer().positive().optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one ID parameter is required",
  });

// Tugas 
export const VCreateQueueSchema = Joi.object({
  counter_id: Joi.number().integer().positive().required(),
  queue_number: Joi.number().integer().positive().required(),
  status: Joi.string()
    .valid("CLAIMED", "CALLED", "SERVED", "SKIPPED", "RELEASED", "RESET")
    .default("CLAIMED"),
});

export const VUpdateQueueSchema = Joi.object({
  counter_id: Joi.number().integer().positive().optional(),
  queue_number: Joi.number().integer().positive().optional(),
  status: Joi.string()
    .valid("CLAIMED", "CALLED", "SERVED", "SKIPPED", "RELEASED", "RESET")
    .optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

export const VQueueStatusSchema = Joi.object({
  status: Joi.string()
    .valid("active", "inactive", "disable")
    .required()
    .messages({
      "any.only": "Status must be one of: active, inactive, disable",
      "any.required": "Status is required",
    }),
});

export const VGetQueuesQuerySchema = Joi.object({
  include_deleted: Joi.string().valid("true", "false").optional(),
  status: Joi.string()
    .valid("CLAIMED", "CALLED", "SERVED", "SKIPPED", "RELEASED", "RESET")
    .optional(),
  counter_id: Joi.number().integer().positive().optional(),
  page: Joi.number().integer().positive().default(1),
  limit: Joi.number().integer().positive().max(100).default(20),
});



export const VAdminSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required().min(6),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
});

export const VUpdateAdminSchema = Joi.object({
  username: Joi.string().optional().trim().min(3),
  password: Joi.string().optional().allow("", null).min(8), // Sesuaikan dengan service
  email: Joi.string().email().optional(),
  name: Joi.string().optional().trim().min(2),
  isActive: Joi.boolean().optional(), // Tambahkan field isActive
})
  .min(1) // Minimal 1 field harus diisi
  .messages({
    "object.min": "At least one field must be provided for update",
  });

export const VGetSearchSchema = Joi.object({
  q: Joi.string().optional().allow("", null),
});
