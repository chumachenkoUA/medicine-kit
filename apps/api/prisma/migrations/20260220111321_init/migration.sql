-- CreateTable
CREATE TABLE "tabletos" (
    "Id" BIGSERIAL NOT NULL,
    "Name" VARCHAR(2044) NOT NULL,
    "Description" VARCHAR(2044),
    "Effects" VARCHAR(2044),
    "Format" VARCHAR(2044) NOT NULL,
    "Link" VARCHAR(2044) NOT NULL,
    "Photo" VARCHAR(2044),
    "Quantity" INTEGER NOT NULL,
    "Rate" SMALLINT,

    CONSTRAINT "tabletos_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "users" (
    "Id" BIGSERIAL NOT NULL,
    "Email" VARCHAR(2044) NOT NULL,
    "Name" VARCHAR(2044) NOT NULL,
    "Password" VARCHAR(2044) NOT NULL,
    "Surname" VARCHAR(2044) NOT NULL,
    "Username" VARCHAR(2044) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "courses" (
    "Id" BIGSERIAL NOT NULL,
    "Name_doctor" VARCHAR(2044) NOT NULL,
    "Period_courses" SMALLINT NOT NULL,
    "Quantity_day" SMALLINT NOT NULL,
    "Quantity_week" SMALLINT NOT NULL,
    "Description" VARCHAR(2044),
    "users_id" BIGINT NOT NULL,
    "tabletos_id" BIGINT NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "tabletos_user" (
    "Id" BIGSERIAL NOT NULL,
    "tabletos_id" BIGINT NOT NULL,
    "Count" INTEGER NOT NULL,
    "Expiration_date" DATE NOT NULL,
    "Create_date" DATE NOT NULL,
    "users_id" BIGINT NOT NULL,

    CONSTRAINT "tabletos_user_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_Email_key" ON "users"("Email");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "fk_users" FOREIGN KEY ("users_id") REFERENCES "users"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "fk_tabletos" FOREIGN KEY ("tabletos_id") REFERENCES "tabletos"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tabletos_user" ADD CONSTRAINT "fk_users" FOREIGN KEY ("users_id") REFERENCES "users"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tabletos_user" ADD CONSTRAINT "fk_tabletos" FOREIGN KEY ("tabletos_id") REFERENCES "tabletos"("Id") ON DELETE CASCADE ON UPDATE CASCADE;
