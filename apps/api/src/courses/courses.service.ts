import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpsertDoseLogDto } from './dto/upsert-dose-log.dto';
import {
  buildDoseLogMap,
  computeCourseEndDate,
  generateCourseCalendarEvents,
  normalizeCourseDoseTimes,
} from '../lib/calendar/calendar.service';

type UserIdLike = string | number | bigint;

type CourseStatus = 'active' | 'planned' | 'completed' | 'paused';
type DoseLogState = 'taken' | 'missed' | 'skipped';

@Injectable()
export class CoursesService {
  private normalizeId(value: UserIdLike): bigint {
    return typeof value === 'bigint' ? value : BigInt(value);
  }

  private toDateOnly(value: Date | string): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private normalizeStatus(
    status: string | undefined,
    startDate: Date,
    periodDays: number,
  ): CourseStatus {
    const normalized = status?.trim().toLowerCase();
    if (
      normalized === 'active' ||
      normalized === 'planned' ||
      normalized === 'completed' ||
      normalized === 'paused'
    ) {
      return normalized;
    }

    const today = this.toDateOnly(new Date());
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Math.max(1, periodDays) - 1);

    if (today < startDate) return 'planned';
    if (today > endDate) return 'completed';
    return 'active';
  }

  private parseRangeDate(raw?: string, mode: 'start' | 'end' = 'start'): Date | undefined {
    if (!raw || !raw.trim()) return undefined;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return undefined;
    parsed.setHours(mode === 'start' ? 0 : 23, mode === 'start' ? 0 : 59, mode === 'start' ? 0 : 59, mode === 'start' ? 0 : 999);
    return parsed;
  }

  private normalizePackageId(value: unknown): bigint | undefined {
    if (value == null) return undefined;
    const normalized = Number(value);
    if (!Number.isInteger(normalized) || normalized <= 0) return undefined;
    return this.normalizeId(normalized);
  }

  private isTakenState(state: string | null | undefined): state is 'taken' {
    return state === 'taken';
  }

  private async findAvailablePackages(
    tx: Prisma.TransactionClient,
    userId: bigint,
    medicineId: bigint,
  ) {
    const today = this.toDateOnly(new Date());

    return tx.tabletos_user.findMany({
      where: {
        users_id: userId,
        tabletos_id: medicineId,
        Count: { gt: 0 },
        Expiration_date: { gte: today },
      },
      orderBy: [{ Expiration_date: 'asc' }, { Create_date: 'asc' }, { Id: 'asc' }],
    });
  }

  private async resolveTakenPackage(
    tx: Prisma.TransactionClient,
    userId: bigint,
    medicineId: bigint,
    requestedPackageId?: bigint,
  ) {
    if (requestedPackageId) {
      const selectedPackage = await tx.tabletos_user.findFirst({
        where: {
          Id: requestedPackageId,
          users_id: userId,
          tabletos_id: medicineId,
          Count: { gt: 0 },
          Expiration_date: { gte: this.toDateOnly(new Date()) },
        },
      });

      if (!selectedPackage) {
        throw new BadRequestException(
          'Обрана упаковка недоступна для списання або вже порожня.',
        );
      }

      return selectedPackage;
    }

    const availablePackages = await this.findAvailablePackages(tx, userId, medicineId);
    if (availablePackages.length === 0) {
      throw new BadRequestException('Немає доступних упаковок для списання таблетки.');
    }
    if (availablePackages.length > 1) {
      throw new ConflictException('Обери упаковку для списання таблетки.');
    }

    return availablePackages[0];
  }

  private serializeBigInt<T>(payload: T): T {
    return JSON.parse(
      JSON.stringify(payload, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
    ) as T;
  }

  private async findOwnedCourseOrThrow(userId: UserIdLike, courseId: number) {
    const course = await prisma.courses.findFirst({
      where: {
        Id: courseId,
        users_id: this.normalizeId(userId),
      },
      include: {
        tabletos: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Курс не знайдено.');
    }

    return course;
  }

  async createForUser(userId: UserIdLike, createCourseDto: CreateCourseDto) {
    const normalizedUserId = this.normalizeId(userId);
    const periodDays = Math.max(1, Number(createCourseDto.period) || 1);
    const qtyPerDay = Math.max(1, Number(createCourseDto.qtyDay) || 1);
    const startDate = this.toDateOnly(createCourseDto.startDate);
    const status = this.normalizeStatus(createCourseDto.status, startDate, periodDays);
    const doseTimes = normalizeCourseDoseTimes(createCourseDto.doseTimes, qtyPerDay);

    const created = await prisma.courses.create({
      data: {
        Name_doctor: createCourseDto.nameDoctor,
        Period_courses: periodDays,
        Quantity_day: qtyPerDay,
        Start_date: startDate,
        Status: status,
        Dose_times: doseTimes,
        Description: createCourseDto.description,
        users: {
          connect: { Id: normalizedUserId },
        },
        tabletos: {
          connect: { Id: this.normalizeId(createCourseDto.tabletoId) },
        },
      },
    });

    return this.serializeBigInt(created);
  }

  async findAllByUser(userId: UserIdLike) {
    const courses = await prisma.courses.findMany({
      where: { users_id: this.normalizeId(userId) },
      orderBy: { Start_date: 'desc' },
    });

    return this.serializeBigInt(courses);
  }

  async findOneByUser(userId: UserIdLike, id: number) {
    const course = await this.findOwnedCourseOrThrow(userId, id);
    return this.serializeBigInt(course);
  }

  async updateByUser(userId: UserIdLike, id: number, updateCourseDto: UpdateCourseDto) {
    const ownedCourse = await this.findOwnedCourseOrThrow(userId, id);

    const periodDays = Math.max(1, Number(updateCourseDto.period ?? ownedCourse.Period_courses) || 1);
    const qtyPerDay = Math.max(1, Number(updateCourseDto.qtyDay ?? ownedCourse.Quantity_day) || 1);
    const startDate =
      updateCourseDto.startDate !== undefined
        ? this.toDateOnly(updateCourseDto.startDate)
        : this.toDateOnly(ownedCourse.Start_date);

    const status =
      updateCourseDto.status !== undefined
        ? this.normalizeStatus(updateCourseDto.status, startDate, periodDays)
        : ownedCourse.Status;

    const nextDoseTimes =
      updateCourseDto.doseTimes !== undefined
        ? normalizeCourseDoseTimes(updateCourseDto.doseTimes, qtyPerDay)
        : ownedCourse.Dose_times;

    const updated = await prisma.courses.update({
      where: { Id: id },
      data: {
        Name_doctor: updateCourseDto.nameDoctor ?? ownedCourse.Name_doctor,
        Period_courses: periodDays,
        Quantity_day: qtyPerDay,
        Start_date: startDate,
        Status: status,
        Dose_times: nextDoseTimes,
        Description: updateCourseDto.description ?? ownedCourse.Description,
        ...(updateCourseDto.tabletoId !== undefined
          ? {
              tabletos: {
                connect: { Id: this.normalizeId(updateCourseDto.tabletoId) },
              },
            }
          : {}),
      },
    });

    return this.serializeBigInt(updated);
  }

  async removeByUser(userId: UserIdLike, id: number) {
    await this.findOwnedCourseOrThrow(userId, id);

    const removed = await prisma.courses.delete({
      where: { Id: id },
    });

    return this.serializeBigInt(removed);
  }

  async getCalendarEventsByUser(
    userId: UserIdLike,
    query?: { from?: string; to?: string },
  ) {
    const normalizedUserId = this.normalizeId(userId);
    const fromDate = this.parseRangeDate(query?.from, 'start');
    const toDate = this.parseRangeDate(query?.to, 'end');

    const courses = await prisma.courses.findMany({
      where: { users_id: normalizedUserId },
      include: {
        tabletos: true,
      },
      orderBy: { Start_date: 'asc' },
    });

    if (courses.length === 0) {
      return [];
    }

    const whereDoseDateRange =
      fromDate || toDate
        ? {
            Dose_date: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {};

    const logs = await prisma.course_dose_logs.findMany({
      where: {
        users_id: normalizedUserId,
        course_id: { in: courses.map((course) => course.Id) },
        ...whereDoseDateRange,
      },
      orderBy: [{ Dose_date: 'asc' }, { Dose_time: 'asc' }],
    });

    const doseLogMap = buildDoseLogMap(
      logs.map((log) => ({
        courseId: String(log.course_id),
        date: log.Dose_date.toISOString().slice(0, 10),
        time: log.Dose_time,
        state: log.State as 'taken' | 'missed' | 'skipped',
      })),
    );

    const events = courses.flatMap((course) =>
      generateCourseCalendarEvents(course, {
        from: fromDate,
        to: toDate,
        medicineName: course.tabletos?.Name,
        logStateByKey: doseLogMap,
      }),
    );

    return this.serializeBigInt(events);
  }

  async upsertDoseLogForUser(userId: UserIdLike, courseId: number, dto: UpsertDoseLogDto) {
    const normalizedUserId = this.normalizeId(userId);
    const course = await this.findOwnedCourseOrThrow(userId, courseId);
    const doseDate = this.toDateOnly(dto.date);
    const requestedPackageId = this.normalizePackageId(dto.packageId);

    if (dto.packageId != null && !requestedPackageId) {
      throw new BadRequestException('Некоректний packageId для списання таблетки.');
    }

    const payload = await prisma.$transaction(async (tx) => {
      const existingLog = await tx.course_dose_logs.findUnique({
        where: {
          course_id_Dose_date_Dose_time: {
            course_id: course.Id,
            Dose_date: doseDate,
            Dose_time: dto.time,
          },
        },
      });

      const previousState = existingLog?.State as DoseLogState | undefined;
      const wasTaken = this.isTakenState(previousState);
      const willBeTaken = this.isTakenState(dto.state);
      let nextPackageId = existingLog?.tabletos_user_id ?? null;
      let stockDelta = 0;
      let packageCount: number | null = null;

      if (!wasTaken && willBeTaken) {
        const selectedPackage = await this.resolveTakenPackage(
          tx,
          normalizedUserId,
          course.tabletos_id,
          requestedPackageId,
        );
        const updatedPackage = await tx.tabletos_user.update({
          where: { Id: selectedPackage.Id },
          data: {
            Count: {
              decrement: 1,
            },
          },
        });
        nextPackageId = selectedPackage.Id;
        stockDelta = -1;
        packageCount = updatedPackage.Count;
      } else if (wasTaken && !willBeTaken) {
        if (existingLog?.tabletos_user_id) {
          const restoredPackage = await tx.tabletos_user.findFirst({
            where: {
              Id: existingLog.tabletos_user_id,
              users_id: normalizedUserId,
              tabletos_id: course.tabletos_id,
            },
          });

          if (restoredPackage) {
            const updatedPackage = await tx.tabletos_user.update({
              where: { Id: restoredPackage.Id },
              data: {
                Count: {
                  increment: 1,
                },
              },
            });
            stockDelta = 1;
            packageCount = updatedPackage.Count;
          }
        }

        nextPackageId = null;
      }

      const savedLog = existingLog
        ? await tx.course_dose_logs.update({
            where: {
              Id: existingLog.Id,
            },
            data: {
              State: dto.state,
              tabletos_user_id: nextPackageId,
            },
          })
        : await tx.course_dose_logs.create({
            data: {
              course_id: course.Id,
              users_id: normalizedUserId,
              Dose_date: doseDate,
              Dose_time: dto.time,
              State: dto.state,
              tabletos_user_id: nextPackageId,
            },
          });

      return {
        id: String(savedLog.Id),
        state: dto.state,
        previousState: previousState ?? null,
        stockDelta,
        packageId: nextPackageId != null ? String(nextPackageId) : null,
        packageCount,
      };
    });

    return this.serializeBigInt(payload);
  }

  async getCourseProgressByUser(
    userId: UserIdLike,
    courseId: number,
    query?: { from?: string; to?: string },
  ) {
    const normalizedUserId = this.normalizeId(userId);
    const course = await this.findOwnedCourseOrThrow(userId, courseId);
    const fromDate = this.parseRangeDate(query?.from, 'start');
    const toDate = this.parseRangeDate(query?.to, 'end');

    const whereDoseDateRange =
      fromDate || toDate
        ? {
            Dose_date: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {};

    const logs = await prisma.course_dose_logs.findMany({
      where: {
        users_id: normalizedUserId,
        course_id: course.Id,
        ...whereDoseDateRange,
      },
      orderBy: [{ Dose_date: 'asc' }, { Dose_time: 'asc' }],
    });

    const doseLogMap = buildDoseLogMap(
      logs.map((log) => ({
        courseId: String(log.course_id),
        date: log.Dose_date.toISOString().slice(0, 10),
        time: log.Dose_time,
        state: log.State as 'taken' | 'missed' | 'skipped',
      })),
    );

    const events = generateCourseCalendarEvents(course, {
      from: fromDate,
      to: toDate,
      medicineName: course.tabletos?.Name,
      logStateByKey: doseLogMap,
    });

    const total = events.length;
    const taken = events.filter((event) => event.status === 'taken').length;
    const missed = events.filter((event) => event.status === 'missed').length;
    const skipped = events.filter((event) => event.status === 'skipped').length;
    const completed = taken + missed + skipped;
    const remaining = Math.max(0, total - completed);

    return {
      courseId: String(course.Id),
      from: fromDate?.toISOString() ?? null,
      to: toDate?.toISOString() ?? null,
      total,
      taken,
      missed,
      skipped,
      remaining,
      adherencePercent: total > 0 ? Math.round((taken / total) * 100) : 0,
    };
  }

  async getStockWarningsByUser(userId: UserIdLike) {
    const normalizedUserId = this.normalizeId(userId);

    const [courses, inventoryRows] = await Promise.all([
      prisma.courses.findMany({
        where: { users_id: normalizedUserId },
        include: {
          tabletos: true,
        },
      }),
      prisma.tabletos_user.findMany({
        where: { users_id: normalizedUserId },
        select: {
          tabletos_id: true,
          Count: true,
        },
      }),
    ]);

    const stockByMedicineId = new Map<string, number>();
    for (const row of inventoryRows) {
      const key = String(row.tabletos_id);
      stockByMedicineId.set(key, (stockByMedicineId.get(key) ?? 0) + (Number(row.Count) || 0));
    }

    const warnings = courses.map((course) => {
      const medicineId = String(course.tabletos_id);
      const stockCount = stockByMedicineId.get(medicineId) ?? 0;
      const dailyNeed = Math.max(1, Number(course.Quantity_day) || 1);
      const daysLeftEstimate = stockCount / dailyNeed;

      const severity: 'ok' | 'low' | 'empty' =
        stockCount <= 0 ? 'empty' : daysLeftEstimate <= 3 ? 'low' : 'ok';

      const message =
        severity === 'empty'
          ? 'Таблетки закінчилися для цього курсу.'
          : severity === 'low'
            ? `Залишку вистачить приблизно на ${Math.floor(daysLeftEstimate)} дн.`
            : 'Запас достатній.';

      const endDate = computeCourseEndDate(course);

      return {
        courseId: String(course.Id),
        medicineId,
        medicineName: course.tabletos?.Name ?? 'Невідомий препарат',
        courseStatus: course.Status,
        stockCount,
        dailyNeed,
        daysLeftEstimate: Number.isFinite(daysLeftEstimate)
          ? Math.max(0, Number(daysLeftEstimate.toFixed(1)))
          : 0,
        severity,
        message,
        courseEndDate: endDate ? endDate.toISOString() : null,
      };
    });

    return this.serializeBigInt(warnings);
  }

  async getCalendarEventsByUser(userId: string | number | bigint) {
    const courses = await this.findAllByUser(userId);
    return courses.flatMap((course) => generateEventsWithFlexibleHours(course));
  }
}
