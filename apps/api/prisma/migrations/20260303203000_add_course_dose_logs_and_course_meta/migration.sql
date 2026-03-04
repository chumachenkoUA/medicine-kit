-- AlterTable
ALTER TABLE "courses"
ADD COLUMN "Status" VARCHAR(32) NOT NULL DEFAULT 'planned',
ADD COLUMN "Dose_times" JSONB;

-- CreateTable
CREATE TABLE "course_dose_logs" (
    "Id" BIGSERIAL NOT NULL,
    "course_id" BIGINT NOT NULL,
    "users_id" BIGINT NOT NULL,
    "Dose_date" DATE NOT NULL,
    "Dose_time" VARCHAR(5) NOT NULL,
    "State" VARCHAR(32) NOT NULL,
    "Created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_dose_logs_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_dose_logs_course_id_Dose_date_Dose_time_key" ON "course_dose_logs"("course_id", "Dose_date", "Dose_time");
CREATE INDEX "course_dose_logs_users_id_Dose_date_idx" ON "course_dose_logs"("users_id", "Dose_date");

-- AddForeignKey
ALTER TABLE "course_dose_logs" ADD CONSTRAINT "fk_course_dose_logs_course" FOREIGN KEY ("course_id") REFERENCES "courses"("Id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_dose_logs" ADD CONSTRAINT "fk_course_dose_logs_user" FOREIGN KEY ("users_id") REFERENCES "users"("Id") ON DELETE CASCADE ON UPDATE CASCADE;
