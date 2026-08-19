import { z } from "zod";

/**
 * Esquemas de validación compartidos entre el Worker y la SPA.
 * El Worker valida toda entrada; el cliente los reutiliza para validar
 * antes de enviar y evitar viajes de red innecesarios.
 */

export const optionLetterSchema = z.enum(["A", "B", "C", "D"]);
export const phaseSchema = z.enum(["pretest", "postest"]);

/**
 * Código de acceso del estudiante: MAC-XXXX-XXXX.
 * El alfabeto excluye caracteres que se confunden al digitar en móvil
 * (O/0, I/1, L), por eso la clase de caracteres no es simplemente A-Z0-9.
 */
export const accessCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^MAC-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/,
    "El código debe tener el formato MAC-XXXX-XXXX",
  );

/** `POST /api/attempt/redeem` */
export const redeemRequestSchema = z.object({
  code: accessCodeSchema,
});

/** `PUT /api/attempt/answer` — autoguardado de una respuesta. */
export const saveAnswerRequestSchema = z.object({
  questionId: z.number().int().positive(),
  /** Posición en pantalla donde se mostró la opción elegida (0-3). */
  displayedPosition: z.number().int().min(0).max(3),
  /** Tiempo dedicado al ítem, en milisegundos. */
  timeSpentMs: z.number().int().min(0).max(3_600_000),
  /** Tiempo total transcurrido en el intento, en milisegundos. */
  elapsedMs: z.number().int().min(0).max(86_400_000),
});

/** `POST /api/admin/login` */
export const adminLoginRequestSchema = z.object({
  code: z.string().trim().min(6).max(120),
});

/** `POST /api/admin/codes` — generación de códigos por lotes. */
export const generateCodesRequestSchema = z.object({
  quantity: z.number().int().min(1).max(100),
  phase: phaseSchema,
  /** Nombres de estudiantes, opcionales y solo visibles en el panel gestor. */
  labels: z.array(z.string().trim().max(120)).max(100).optional(),
  notes: z.string().trim().max(500).optional(),
  /** Días de vigencia. Sin valor, el código no expira. */
  validForDays: z.number().int().min(1).max(365).optional(),
});

export type RedeemRequest = z.infer<typeof redeemRequestSchema>;
export type SaveAnswerRequest = z.infer<typeof saveAnswerRequestSchema>;
export type AdminLoginRequest = z.infer<typeof adminLoginRequestSchema>;
export type GenerateCodesRequest = z.infer<typeof generateCodesRequestSchema>;
