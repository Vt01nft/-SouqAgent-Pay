import fs from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { config } from "./config.js";

export type ProductTask = {
  taskId: string;
  createdAt: string;
  updatedAt: string;
  mode: string;
  businessName: string;
  vendor: string;
  ownerRequest: string;
  maxAutonomousSpend: string;
  selectedService: string;
  status: "funded" | "delivered" | "released" | "refunded" | "human-approval-required" | "failed";
  payment?: unknown;
  result?: unknown;
  deliverable?: {
    uri: string;
    notes: string;
    submittedAt: string;
    submittedBy: string;
  };
  arcEscrow?: {
    jobId: string;
    amount: string;
    state: string;
    contract: string;
    approveTxHash?: string;
    createTxHash?: string;
    fundTxHash?: string;
    releaseTxHash?: string;
    refundTxHash?: string;
    explorerUrls?: Record<string, string>;
  };
  receipts: unknown[];
  policy?: unknown;
  receiptUrl?: string;
};

let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;
let memoryTasks: ProductTask[] = [];

const localStorePath = path.join(process.cwd(), ".data", "tasks.json");
const supabaseTable = "souqagent_product_tasks";
type SupabaseRequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

function getPool() {
  if (!config.databaseUrl) {
    return undefined;
  }

  pool ??= new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  return pool;
}

async function ensureSchema() {
  const db = getPool();
  if (!db) {
    return;
  }

  schemaReady ??= db.query(`
    create table if not exists product_tasks (
      task_id text primary key,
      data jsonb not null,
      created_at timestamptz not null,
      updated_at timestamptz not null
    );
  `).then(() => undefined);

  await schemaReady;
}

async function readLocalTasks() {
  try {
    const raw = await fs.readFile(localStorePath, "utf8");
    memoryTasks = JSON.parse(raw) as ProductTask[];
  } catch {
    memoryTasks = memoryTasks.length > 0 ? memoryTasks : [];
  }

  return memoryTasks;
}

async function writeLocalTasks(tasks: ProductTask[]) {
  memoryTasks = tasks;

  if (process.env.VERCEL) {
    return;
  }

  await fs.mkdir(path.dirname(localStorePath), { recursive: true });
  await fs.writeFile(localStorePath, JSON.stringify(tasks, null, 2));
}

function hasSupabase() {
  return Boolean(config.supabaseUrl && config.supabasePublishableKey);
}

async function supabaseRequest<T>(pathName: string, init?: SupabaseRequestInit): Promise<T> {
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required.");
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/${pathName}`, {
    ...init,
    headers: {
      apikey: config.supabasePublishableKey,
      Authorization: `Bearer ${config.supabasePublishableKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed with ${response.status}: ${detail}`);
  }

  return (await response.json()) as T;
}

export async function saveTask(task: ProductTask) {
  if (hasSupabase()) {
    await supabaseRequest(`${supabaseTable}?on_conflict=task_id`, {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        task_id: task.taskId,
        data: task,
        created_at: task.createdAt,
        updated_at: task.updatedAt,
      }),
    });
    return task;
  }

  const db = getPool();
  if (db) {
    await ensureSchema();
    await db.query(
      `
        insert into product_tasks (task_id, data, created_at, updated_at)
        values ($1, $2, $3, $4)
        on conflict (task_id)
        do update set data = excluded.data, updated_at = excluded.updated_at
      `,
      [task.taskId, task, task.createdAt, task.updatedAt],
    );
    return task;
  }

  const tasks = await readLocalTasks();
  const nextTasks = [task, ...tasks.filter((savedTask) => savedTask.taskId !== task.taskId)].slice(0, 50);
  await writeLocalTasks(nextTasks);
  return task;
}

export async function listTasks() {
  if (hasSupabase()) {
    const rows = await supabaseRequest<{ data: ProductTask }[]>(
      `${supabaseTable}?select=data&order=created_at.desc&limit=50`,
    );
    return rows.map((row) => row.data);
  }

  const db = getPool();
  if (db) {
    await ensureSchema();
    const result = await db.query(
      "select data from product_tasks order by created_at desc limit 50",
    );
    return result.rows.map((row) => row.data as ProductTask);
  }

  return readLocalTasks();
}

export async function getTask(taskId: string) {
  if (hasSupabase()) {
    const rows = await supabaseRequest<{ data: ProductTask }[]>(
      `${supabaseTable}?select=data&task_id=eq.${encodeURIComponent(taskId)}&limit=1`,
    );
    return rows[0]?.data ?? null;
  }

  const db = getPool();
  if (db) {
    await ensureSchema();
    const result = await db.query("select data from product_tasks where task_id = $1", [taskId]);
    return (result.rows[0]?.data as ProductTask | undefined) ?? null;
  }

  const tasks = await readLocalTasks();
  return tasks.find((task) => task.taskId === taskId) ?? null;
}

// eslint-disable-next-line no-unused-vars
export async function updateTask(taskId: string, updater: (task: ProductTask) => ProductTask) {
  const task = await getTask(taskId);

  if (!task) {
    return null;
  }

  const updatedTask = updater({
    ...task,
    updatedAt: new Date().toISOString(),
  });

  await saveTask(updatedTask);
  return updatedTask;
}

export async function findTaskByEscrowJobId(jobId: string) {
  const tasks = await listTasks();
  return tasks.find((task) => task.arcEscrow?.jobId === jobId) ?? null;
}
