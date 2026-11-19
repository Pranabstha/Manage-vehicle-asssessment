import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw("CREATE EXTENSION IF NOT EXISTS timescaledb");

  await knex.schema.createTable("vehicle_telemetry", (table) => {
    table
      .integer("vehicle_id")
      .notNullable()
      .references("id")
      .inTable("vehicles")
      .onDelete("CASCADE");
    table.timestamp("ts", { useTz: true }).notNullable();
    table.double("lat").notNullable();
    table.double("lon").notNullable();
    table.double("speed").notNullable(); // km/h
    // TimescaleDB requires unique keys to include the time column; also dedupes Kafka redeliveries.
    table.primary(["vehicle_id", "ts"]);
  });

  await knex.raw("SELECT create_hypertable('vehicle_telemetry', by_range('ts'))");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("vehicle_telemetry");
}
