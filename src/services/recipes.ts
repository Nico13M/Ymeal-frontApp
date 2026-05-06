// import { ApiError, apiRequest } from "@/src/lib/api";

// const RAW_RECIPES_COUNT_PATH = process.env.EXPO_PUBLIC_RECIPES_COUNT_PATH;

// export const RECIPES_COUNT_PATH =
//   typeof RAW_RECIPES_COUNT_PATH === "string" && RAW_RECIPES_COUNT_PATH.trim().length > 0
//     ? RAW_RECIPES_COUNT_PATH.trim()
//     : "/public/recipes/count";

// function toNonNegativeInteger(value: unknown): number | null {
//   if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
//     return Math.floor(value);
//   }

//   if (typeof value === "string") {
//     const trimmed = value.trim();
//     if (/^\d+$/.test(trimmed)) {
//       return Number(trimmed);
//     }
//   }

//   return null;
// }

// function extractRecipesCount(payload: unknown): number | null {
//   if (Array.isArray(payload)) {
//     return payload.length;
//   }

//   if (!payload || typeof payload !== "object") return null;

//   const data = payload as Record<string, unknown>;
//   const nestedData =
//     data.data && typeof data.data === "object" ? (data.data as Record<string, unknown>) : null;

//   const candidates = [
//     data.count,
//     data.total,
//     data.totalCount,
//     data.total_count,
//     nestedData?.count,
//     nestedData?.total,
//     nestedData?.totalCount,
//     nestedData?.total_count,
//   ];

//   for (const candidate of candidates) {
//     const normalized = toNonNegativeInteger(candidate);
//     if (normalized !== null) {
//       return normalized;
//     }
//   }

//   const rootItems = Array.isArray(data.items) ? data.items : null;
//   if (rootItems) {
//     return rootItems.length;
//   }

//   const nestedItems = Array.isArray(nestedData?.items) ? nestedData?.items : null;
//   if (nestedItems) {
//     return nestedItems.length;
//   }

//   return null;
// }

// export async function fetchRecipesCount(): Promise<number | null> {
//   try {
//     const payload = await apiRequest<unknown>(RECIPES_COUNT_PATH, {
//       method: "GET",
//     });

//     return extractRecipesCount(payload);
//   } catch (error) {
//     if (error instanceof ApiError && [401, 403, 404, 405].includes(error.status)) {
//       return null;
//     }

//     return null;
//   }
// }
