"use server";

import { prisma } from "@/lib/db";

export async function getCountries() {
  return prisma.country.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });
}

export async function getCities(countryId?: string | null) {
  if (!countryId) return [];
  return prisma.city.findMany({
    where: { countryId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getDistricts(cityId?: string | null) {
  if (!cityId) return [];
  return prisma.district.findMany({
    where: { cityId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getTaxOffices() {
  return prisma.taxOffice.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getCurrencies() {
  return prisma.currency.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { code: "asc" },
  });
}

export async function getGoodsCategories() {
  return prisma.goodsCategory.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });
}

export async function getCnCodes(goodsCategoryId?: string | null) {
  if (!goodsCategoryId) return [];
  return prisma.cnCode.findMany({
    where: { goodsCategoryId },
    select: { id: true, name: true, code: true },
    orderBy: { code: "asc" },
  });
}

export async function getProductionRoutes() {
  return prisma.productionRoute.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });
}

export async function getProductionProcesses() {
  return prisma.productionProcess.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });
}

export async function getEmissionTypes() {
  return prisma.emissionType.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });
}

export async function getEmissionMethods() {
  return prisma.emissionMethod.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
