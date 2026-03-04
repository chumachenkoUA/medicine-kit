-- AlterTable
ALTER TABLE "course_dose_logs"
ADD COLUMN "tabletos_user_id" BIGINT;

-- CreateIndex
CREATE INDEX "course_dose_logs_tabletos_user_id_idx" ON "course_dose_logs"("tabletos_user_id");

-- AddForeignKey
ALTER TABLE "course_dose_logs" ADD CONSTRAINT "fk_course_dose_logs_tabletos_user"
FOREIGN KEY ("tabletos_user_id") REFERENCES "tabletos_user"("Id") ON DELETE SET NULL ON UPDATE CASCADE;
