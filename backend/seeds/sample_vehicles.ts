import type { Knex } from "knex";

// Runs on every container start, hence the conflict ignore.
export async function seed(knex: Knex): Promise<void> {
  await knex("vehicles")
    .insert([
      { registration: "XQG-984", name: "Isuzu NPR 400 - Sydney depot" },
      { registration: "1HT-2KL", name: "Hino 500 - Melbourne depot" },
      { registration: "BUS-217", name: "Volvo B8R bus - Brisbane" },
      { registration: "WC-3341", name: "Mack Granite waste truck - Perth" },
      { registration: "SA-56RT", name: "Toyota HiAce - Adelaide" },
    ])
    .onConflict("registration")
    .ignore();
}
